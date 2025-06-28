/**
 * API Client Service - TO BE MIGRATED
 * 
 * MIGRATE - From HTTP Client Cluster
 * Strategy: REFACTOR_INTO_ABSTRACTION
 * 
 * This will be migrated to: src/clients/axios-client.ts
 * Full-featured HTTP client with interceptors
 */

export interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  apiKey?: string;
  retries: number;
}

export class ApiClient {
  private config: ApiClientConfig;
  private interceptors: {
    request: ((config: any) => any)[];
    response: ((response: any) => any)[];
  };

  constructor(config: ApiClientConfig) {
    this.config = config;
    this.interceptors = {
      request: [],
      response: []
    };
    
    this.setupDefaultInterceptors();
  }

  /**
   * Setup default request/response interceptors
   * MIGRATE: This pattern will be used in AxiosHttpClient
   */
  private setupDefaultInterceptors(): void {
    // Request interceptor for API key
    this.interceptors.request.push((config) => {
      if (this.config.apiKey) {
        config.headers = {
          ...config.headers,
          'Authorization': `Bearer ${this.config.apiKey}`
        };
      }
      return config;
    });

    // Response interceptor for error handling
    this.interceptors.response.push((response) => {
      if (response.status >= 400) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      return response;
    });
  }

  /**
   * Make HTTP request with full features
   * MIGRATE: Core functionality for AxiosHttpClient
   */
  async request<T>(config: {
    method: string;
    url: string;
    data?: any;
    headers?: Record<string, string>;
  }): Promise<T> {
    // Apply request interceptors
    let processedConfig = { ...config };
    for (const interceptor of this.interceptors.request) {
      processedConfig = interceptor(processedConfig);
    }

    // Build full URL
    const fullUrl = this.buildUrl(processedConfig.url);
    
    // Make request with retry logic
    let lastError: Error;
    for (let attempt = 0; attempt <= this.config.retries; attempt++) {
      try {
        const response = await fetch(fullUrl, {
          method: processedConfig.method,
          headers: {
            'Content-Type': 'application/json',
            ...processedConfig.headers
          },
          body: processedConfig.data ? JSON.stringify(processedConfig.data) : undefined
        });

        // Apply response interceptors
        let processedResponse: any = {
          data: await response.json(),
          status: response.status,
          statusText: response.statusText
        };

        for (const interceptor of this.interceptors.response) {
          processedResponse = interceptor(processedResponse);
        }

        return processedResponse.data;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === this.config.retries) {
          break;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    }
    
    throw lastError!;
  }

  /**
   * GET request
   */
  async get<T>(url: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>({ method: 'GET', url, headers });
  }

  /**
   * POST request
   */
  async post<T>(url: string, data: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>({ method: 'POST', url, data, headers });
  }

  /**
   * Add request interceptor
   */
  addRequestInterceptor(interceptor: (config: any) => any): void {
    this.interceptors.request.push(interceptor);
  }

  /**
   * Add response interceptor
   */
  addResponseInterceptor(interceptor: (response: any) => any): void {
    this.interceptors.response.push(interceptor);
  }

  /**
   * Build full URL
   */
  private buildUrl(path: string): string {
    if (path.startsWith('http')) {
      return path;
    }
    return `${this.config.baseURL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  }
} 