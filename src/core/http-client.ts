/**
 * HTTP Client Abstraction
 * 
 * NEW ABSTRACTION - Created from refactoring strategy
 * Strategy: REFACTOR_INTO_ABSTRACTION
 * 
 * This abstraction layer replaces multiple HTTP implementations
 * with a configurable interface supporting different backends
 */

export interface HttpClientConfig {
  timeout: number;
  retries: number;
  authentication?: AuthConfig;
  baseURL?: string;
  headers?: Record<string, string>;
  interceptors?: {
    request?: RequestInterceptor[];
    response?: ResponseInterceptor[];
  };
}

export interface AuthConfig {
  type: 'bearer' | 'basic' | 'api-key';
  token?: string;
  username?: string;
  password?: string;
  apiKey?: string;
}

export interface RequestConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data?: any;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

export interface HttpResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: RequestConfig;
}

export interface RequestInterceptor {
  (config: RequestConfig): RequestConfig | Promise<RequestConfig>;
}

export interface ResponseInterceptor {
  (response: HttpResponse): HttpResponse | Promise<HttpResponse>;
}

/**
 * Main HTTP Client Interface
 * All implementations must conform to this interface
 */
export interface HttpClient {
  get<T = any>(url: string, config?: Partial<RequestConfig>): Promise<HttpResponse<T>>;
  post<T = any>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<HttpResponse<T>>;
  put<T = any>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<HttpResponse<T>>;
  delete<T = any>(url: string, config?: Partial<RequestConfig>): Promise<HttpResponse<T>>;
  patch<T = any>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<HttpResponse<T>>;
  request<T = any>(config: RequestConfig): Promise<HttpResponse<T>>;
}

/**
 * HTTP Client Factory
 * Creates appropriate client implementation based on environment and needs
 */
export class HttpClientFactory {
  static create(type: 'axios' | 'fetch' | 'mock', config: HttpClientConfig): HttpClient {
    switch (type) {
      case 'axios':
        return new (require('../clients/axios-client').AxiosHttpClient)(config);
      case 'fetch':
        return new (require('../clients/fetch-client').FetchHttpClient)(config);
      case 'mock':
        return new (require('../clients/mock-client').MockHttpClient)(config);
      default:
        throw new Error(`Unsupported HTTP client type: ${type}`);
    }
  }

  /**
   * Auto-detect best client for environment
   */
  static createAuto(config: HttpClientConfig): HttpClient {
    // Browser environment - prefer fetch for lightweight operations
    if (typeof window !== 'undefined') {
      return this.create('fetch', config);
    }
    
    // Node.js environment - prefer axios for full features
    if (typeof process !== 'undefined') {
      return this.create('axios', config);
    }
    
    // Fallback to mock for testing
    return this.create('mock', config);
  }
}

/**
 * Base HTTP Client with common functionality
 */
export abstract class BaseHttpClient implements HttpClient {
  protected config: HttpClientConfig;

  constructor(config: HttpClientConfig) {
    this.config = config;
  }

  async get<T = any>(url: string, config?: Partial<RequestConfig>): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, url, method: 'GET' });
  }

  async post<T = any>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, url, method: 'POST', data });
  }

  async put<T = any>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, url, method: 'PUT', data });
  }

  async delete<T = any>(url: string, config?: Partial<RequestConfig>): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, url, method: 'DELETE' });
  }

  async patch<T = any>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, url, method: 'PATCH', data });
  }

  abstract request<T = any>(config: RequestConfig): Promise<HttpResponse<T>>;

  /**
   * Apply request interceptors
   */
  protected async applyRequestInterceptors(config: RequestConfig): Promise<RequestConfig> {
    let processedConfig = { ...config };
    
    if (this.config.interceptors?.request) {
      for (const interceptor of this.config.interceptors.request) {
        processedConfig = await interceptor(processedConfig);
      }
    }
    
    return processedConfig;
  }

  /**
   * Apply response interceptors
   */
  protected async applyResponseInterceptors<T>(response: HttpResponse<T>): Promise<HttpResponse<T>> {
    let processedResponse = { ...response };
    
    if (this.config.interceptors?.response) {
      for (const interceptor of this.config.interceptors.response) {
        processedResponse = await interceptor(processedResponse);
      }
    }
    
    return processedResponse;
  }

  /**
   * Build full URL with base URL
   */
  protected buildUrl(url: string): string {
    if (url.startsWith('http')) {
      return url;
    }
    
    const baseURL = this.config.baseURL || '';
    return `${baseURL.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
  }

  /**
   * Merge headers with default headers
   */
  protected mergeHeaders(requestHeaders?: Record<string, string>): Record<string, string> {
    const headers = { ...this.config.headers };
    
    // Add authentication header
    if (this.config.authentication) {
      const authHeader = this.buildAuthHeader(this.config.authentication);
      if (authHeader) {
        headers.Authorization = authHeader;
      }
    }
    
    // Merge request-specific headers
    return { ...headers, ...requestHeaders };
  }

  /**
   * Build authentication header
   */
  private buildAuthHeader(auth: AuthConfig): string | null {
    switch (auth.type) {
      case 'bearer':
        return auth.token ? `Bearer ${auth.token}` : null;
      case 'basic':
        if (auth.username && auth.password) {
          const credentials = Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
          return `Basic ${credentials}`;
        }
        return null;
      case 'api-key':
        return auth.apiKey ? `ApiKey ${auth.apiKey}` : null;
      default:
        return null;
    }
  }
} 