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
  private static useCookie: boolean = false;
  private static baseUrl: string = import.meta.env.VITE_SDK_API_URL || "";
  private static defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };
  private static defaultTimeout: number = 30000;
  public static setUseCookie(value: boolean) {
    this.useCookie = value;
  }

  static get(endpoint: string, config?: RequestConfig): Promise<ApiResponse> { 
    return this.request("GET", endpoint, null, config);
  }

  static post(endpoint: string, payload?: Record<string, any>, config?: RequestConfig): Promise<ApiResponse> { 
    return this.request("POST", endpoint, payload, config); 
  }

  static put(endpoint: string, payload?: Record<string, any>, config?: RequestConfig): Promise<ApiResponse> { 
    return this.request("PUT", endpoint, payload, config); 
  }

  static delete(endpoint: string, payload?: Record<string, any>, config?: RequestConfig): Promise<ApiResponse> { 
    return this.request("DELETE", endpoint, payload, config); 
  }

  static patch(endpoint: string, payload?: Record<string, any>, config?: RequestConfig): Promise<ApiResponse> { 
    return this.request("PATCH", endpoint, payload, config); 
  }

  private static request(
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
      const existingUuid = getSession({ useCookie: this.useCookie })?.id;

      // Initialize the request
      xhr.open(method, url, true);

      // Set default headers and custom headers
      const mergedHeaders = { 
        ...this.defaultHeaders,
        ...(existingUuid && { Uuid: existingUuid } as Record<string, string>),
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
   * @private
   */
  private static buildUrl(endpoint: string): string {
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
   * @private
   */
  private static getResponseData(xhr: XMLHttpRequest, headers: Record<string, any>): ApiResponse {
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