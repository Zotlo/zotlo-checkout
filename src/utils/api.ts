import { COOKIE } from "./cookie";
import { getSession } from "./session";

interface RequestConfig {
  headers?: Record<string, string>;
  timeout?: number;
  responseType?: XMLHttpRequestResponseType;
}

interface ApiResponse {
  meta: {
    requestId: string;
    httpStatus: number;
    errorCode?: string;
    message?: string;
  };
  result: Record<string, any>;
}

/**
 * API utility class for making HTTP requests using XMLHttpRequest
 */
export class API {
  baseUrl = import.meta.env.VITE_SDK_API_URL || '';
  defaultHeaders: Record<string, any> = {
    "Content-Type": "application/json",
  };
  defaultTimeout = 30000;
  useCookie = false;
  sessionKey: string | undefined = undefined;

  constructor(payload?: {
    baseUrl?: string;
    defaultHeaders?: Record<string, string>;
    defaultTimeout?: number;
    useCookie?: boolean;
    sessionKey?: string;
  }) {
    if (payload?.baseUrl) this.baseUrl = payload.baseUrl;
    if (payload?.defaultHeaders) this.defaultHeaders = payload.defaultHeaders;
    if (payload?.defaultTimeout) this.defaultTimeout = payload.defaultTimeout;
    if (payload?.useCookie) this.useCookie = payload.useCookie;
    if (payload?.sessionKey) this.sessionKey = payload.sessionKey;
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

  request(
    method: string,
    endpoint: string,
    data?: any,
    config?: RequestConfig
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

      // Setup event handlers
      xhr.onload = () => {
        try {
          const responseData = this.getResponseData(xhr, mergedHeaders);
          resolve(responseData);
        } catch {
          const responseData = this.getResponseData(xhr, mergedHeaders);
          reject(responseData);
        }
      };

      xhr.onerror = function () {
        reject(xhr.response);
      };

      xhr.ontimeout = function () {
        reject(xhr.response);
      };

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
  sessionKey: COOKIE.CARD_UUID
});
