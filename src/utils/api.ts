import { COOKIE } from "./cookie";
import { getSession, refreshSession } from "./session";

interface RequestConfig {
  headers?: Record<string, string>;
  timeout?: number;
  responseType?: XMLHttpRequestResponseType;
  // Extra attempts for requests that got no response (network error, not timeout),
  // made only while the page is still visible and online. Only for idempotent requests.
  retry?: number;
}

export interface ApiResponse {
  meta: {
    requestId: string;
    httpStatus: number;
    errorCode?: string;
    message?: string;
  };
  result: Record<string, any>;
}

// Safari reports a request cancelled by a navigation (back button, closing the in-app
// browser, tapping a link) through xhr.onerror with status 0, exactly like a real network
// failure, where Chrome and Firefox abort it silently. Track the page lifecycle so the
// error can tell the two apart; Sentry events that can't reach the user are not errors.
const pageState = { unloading: false };
if (typeof window !== 'undefined') {
  const markUnloading = () => { pageState.unloading = true; };
  window.addEventListener('pagehide', markUnloading);
  window.addEventListener('beforeunload', markUnloading);
  // Restored from the back/forward cache: the page is live again
  window.addEventListener('pageshow', () => { pageState.unloading = false; });
}

export function isPageUnloading() {
  return pageState.unloading;
}

function getPageSnapshot() {
  return {
    unloading: pageState.unloading,
    online: typeof navigator === 'undefined' || navigator.onLine !== false,
    visibility: (typeof document !== 'undefined' && document.visibilityState) || 'visible',
    sinceLoadMs: typeof performance !== 'undefined' ? Math.round(performance.now()) : -1,
  };
}

/**
 * A request that got no response (network error or timeout).
 * The message stays stable for Sentry grouping; the details are fields,
 * which Sentry records through extraErrorDataIntegration and tags in Logger.
 */
export class ApiRequestError extends Error {
  type: 'network' | 'timeout';
  method: string;
  endpoint: string;
  status: number;
  elapsedMs: number;
  timeout: number;
  // Retries already made before this failure
  attempt: number;
  // Page state at the time of the failure (see pageState above)
  unloading: boolean;
  online: boolean;
  visibility: string;
  sinceLoadMs: number;

  constructor(details: Pick<ApiRequestError, 'type' | 'method' | 'endpoint' | 'status' | 'elapsedMs' | 'timeout' | 'attempt'>) {
    super(`${details.type === 'timeout' ? 'Request timeout' : 'Network error'}: ${details.method} ${details.endpoint}`);
    this.name = 'ApiRequestError';
    this.type = details.type;
    this.method = details.method;
    this.endpoint = details.endpoint;
    this.status = details.status;
    this.elapsedMs = details.elapsedMs;
    this.timeout = details.timeout;
    this.attempt = details.attempt;

    const page = getPageSnapshot();
    this.unloading = page.unloading;
    this.online = page.online;
    this.visibility = page.visibility;
    this.sinceLoadMs = page.sinceLoadMs;
  }

  // The user left the page mid-request (Safari reports it as a network error)
  get cancelledByNavigation() {
    return this.type !== 'timeout' && this.unloading;
  }

  // Worth another attempt: no response, and the page can still receive one
  get retryable() {
    return this.type === 'network' && !this.unloading && this.online && this.visibility === 'visible';
  }
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * API utility class for making HTTP requests using XMLHttpRequest
 */
export class API {
  baseUrl = import.meta.env.VITE_SDK_API_URL || '';
  defaultHeaders: Record<string, any> = {
    "Content-Type": "application/json",
  };
  defaultTimeout = 30000;
  retryDelay = 500;
  useCookie = false;
  sessionKey: string | undefined = undefined;
  // Session lifetime in minutes, must match the backend session timeout
  sessionTimeout = 15;

  constructor(payload?: {
    baseUrl?: string;
    defaultHeaders?: Record<string, string>;
    defaultTimeout?: number;
    useCookie?: boolean;
    sessionKey?: string;
    sessionTimeout?: number;
  }) {
    if (payload?.baseUrl) this.baseUrl = payload.baseUrl;
    if (payload?.defaultHeaders) this.defaultHeaders = payload.defaultHeaders;
    if (payload?.defaultTimeout) this.defaultTimeout = payload.defaultTimeout;
    if (payload?.useCookie) this.useCookie = payload.useCookie;
    if (payload?.sessionKey) this.sessionKey = payload.sessionKey;
    if (payload?.sessionTimeout) this.sessionTimeout = payload.sessionTimeout;
  }

  setUseCookie(value: boolean) {
    this.useCookie = value;
  }

  get(endpoint: string, config?: RequestConfig): Promise<ApiResponse> { 
    return this.request("GET", endpoint, null, config);
  }

  post(endpoint: string, payload?: Record<string, any>, config?: RequestConfig): Promise<ApiResponse> { 
    return this.request("POST", endpoint, payload, config); 
  }

  put(endpoint: string, payload?: Record<string, any>, config?: RequestConfig): Promise<ApiResponse> { 
    return this.request("PUT", endpoint, payload, config); 
  }

  delete(endpoint: string, payload?: Record<string, any>, config?: RequestConfig): Promise<ApiResponse> { 
    return this.request("DELETE", endpoint, payload, config); 
  }

  patch(endpoint: string, payload?: Record<string, any>, config?: RequestConfig): Promise<ApiResponse> { 
    return this.request("PATCH", endpoint, payload, config); 
  }

  async request(
    method: string,
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse> {
    const retries = config?.retry || 0;

    for (let attempt = 0; ; attempt++) {
      try {
        return await this.send(method, endpoint, data, config, attempt);
      } catch (err) {
        if (!(err instanceof ApiRequestError) || !err.retryable || attempt >= retries) throw err;
        await sleep(this.retryDelay * (attempt + 1));
      }
    }
  }

  // A single attempt; request() wraps it with the retry policy
  send(
    method: string,
    endpoint: string,
    data: any,
    config: RequestConfig | undefined,
    attempt: number
  ): Promise<ApiResponse> {
    return new Promise((resolve, reject) => {
      const {
        headers = {},
        timeout = this.defaultTimeout,
        responseType = "",
      } = config || {};

      const url = this.buildUrl(endpoint);
      const xhr = new XMLHttpRequest();
      const existingUuid = getSession({ useCookie: this.useCookie, key: this.sessionKey })?.id;
      const clientDomain = window.location.hostname || window.location.host || "";

      // Initialize the request
      xhr.open(method, url, true);

      // Set default headers and custom headers
      const mergedHeaders = { 
        ...this.defaultHeaders,
        ...(existingUuid && { Uuid: existingUuid } as Record<string, string>),
        ...(clientDomain && { "Client-Domain": clientDomain } as Record<string, string>),
        ...headers 
      };
      Object.keys(mergedHeaders).forEach((key) => {
        // Skip content-type header for FormData
        if (key.toLowerCase() === "content-type" && data instanceof FormData) return;
        xhr.setRequestHeader(key, mergedHeaders[key]);
      });

      // Set timeout
      xhr.timeout = timeout;

      // Set response type if specified
      if (responseType) {
        xhr.responseType = responseType;
      }

      const startedAt = Date.now();

      // Setup event handlers
      xhr.onload = () => {
        try {
          const responseData = this.getResponseData(xhr, mergedHeaders);
          this.handleSessionRefresh(existingUuid, responseData);
          resolve(responseData);
        } catch {
          const responseData = this.getResponseData(xhr, mergedHeaders);
          reject(responseData);
        }
      };

      // Network errors and timeouts carry no response (xhr.response is ""), so reject with
      // a descriptive error instead; otherwise Sentry gets an empty value with no context.
      const rejectWithRequestError = (type: ApiRequestError['type']) => {
        reject(new ApiRequestError({
          type,
          method,
          endpoint,
          status: xhr.status,
          elapsedMs: Date.now() - startedAt,
          timeout,
          attempt
        }));
      };

      xhr.onerror = () => rejectWithRequestError('network');
      xhr.ontimeout = () => rejectWithRequestError('timeout');

      // Send the request
      if (data && method !== "GET") {
        if (data instanceof FormData) {
          xhr.send(data);
        } else {
          xhr.send(JSON.stringify(data));
        }
      } else {
        xhr.send();
      }
    });
  }

  /**
   * Backend resets the session timeout only on successful responses,
   * so keep the local expiry in sync with it.
   */
  handleSessionRefresh(sentUuid: string | undefined, responseData: ApiResponse) {
    if (!sentUuid || !responseData?.meta || responseData.meta.errorCode) return;

    refreshSession({
      expireTimeInMinutes: this.sessionTimeout,
      useCookie: this.useCookie,
      key: this.sessionKey
    });
  }

  /**
   * Build the full URL by combining baseUrl and endpoint
   */
  buildUrl(endpoint: string): string {
    if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
      return endpoint; // Absolute URL
    }

    // Remove trailing slash from baseUrl if present
    const base = this.baseUrl.endsWith("/")
      ? this.baseUrl.slice(0, -1)
      : this.baseUrl;
    // Remove leading slash from endpoint if present
    const path = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;

    return `${base}/${path}`;
  }

  /**
   * Prepare data by response type
   */
  getResponseData(xhr: XMLHttpRequest, headers: Record<string, any>): ApiResponse {
    let responseData: any;
    if (xhr.responseType) {
      responseData = xhr.response;
    } else {
      responseData = xhr.responseText
        ? headers["Content-Type"]?.includes("application/json")
          ? JSON.parse(xhr.responseText)
          : xhr.responseText
        : null;
    }
    return responseData;
  }
}

export const CheckoutAPI = new API();
export const CardAPI = new API({
  baseUrl: import.meta.env.VITE_SDK_CARD_API_URL || '',
  sessionKey: COOKIE.CARD_UUID,
  sessionTimeout: 30
});
