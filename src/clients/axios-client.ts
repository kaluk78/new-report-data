/**
 * Axios HTTP Client Implementation
 * 
 * NEW IMPLEMENTATION - From abstraction strategy
 * Strategy: REFACTOR_INTO_ABSTRACTION
 * 
 * Use Case: Full-featured HTTP client with interceptors
 * Migrated from: src/services/api-client.ts
 */

import { BaseHttpClient, HttpClientConfig, RequestConfig, HttpResponse } from '../core/http-client';

export class AxiosHttpClient extends BaseHttpClient {
  private axiosInstance: any;

  constructor(config: HttpClientConfig) {
    super(config);
    this.initializeAxios();
  }

  /**
   * Initialize Axios instance with configuration
   */
  private initializeAxios(): void {
    // In real implementation, this would import axios
    // For demo purposes, we'll simulate axios behavior
    this.axiosInstance = {
      request: this.simulateAxiosRequest.bind(this),
      defaults: {
        timeout: this.config.timeout,
        baseURL: this.config.baseURL,
        headers: this.config.headers || {}
      }
    };
  }

  /**
   * Main request method using Axios
   */
  async request<T = any>(config: RequestConfig): Promise<HttpResponse<T>> {
    try {
      // Apply request interceptors
      const processedConfig = await this.applyRequestInterceptors(config);
      
      // Build Axios-compatible config
      const axiosConfig = {
        method: processedConfig.method.toLowerCase(),
        url: this.buildUrl(processedConfig.url),
        data: processedConfig.data,
        headers: this.mergeHeaders(processedConfig.headers),
        timeout: processedConfig.timeout || this.config.timeout,
        retries: processedConfig.retries || this.config.retries
      };

      // Execute request with retry logic
      let lastError: Error;
      const maxRetries = axiosConfig.retries;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const axiosResponse = await this.axiosInstance.request(axiosConfig);
          
          // Convert Axios response to our standard format
          const response: HttpResponse<T> = {
            data: axiosResponse.data,
            status: axiosResponse.status,
            statusText: axiosResponse.statusText,
            headers: axiosResponse.headers || {},
            config: processedConfig
          };

          // Apply response interceptors
          return await this.applyResponseInterceptors(response);
          
        } catch (error) {
          lastError = error as Error;
          
          if (attempt === maxRetries) {
            break;
          }

          // Exponential backoff for retries
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      throw lastError!;
      
    } catch (error) {
      throw this.handleError(error as Error, config);
    }
  }

  /**
   * Simulate Axios request behavior
   */
  private async simulateAxiosRequest(config: any): Promise<any> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));

    // Simulate different response scenarios
    const shouldFail = Math.random() < 0.1; // 10% failure rate
    
    if (shouldFail) {
      throw new Error('Network Error: Connection failed');
    }

    // Mock successful response
    return {
      data: this.generateMockResponse(config),
      status: 200,
      statusText: 'OK',
      headers: {
        'content-type': 'application/json',
        'x-request-id': `req_${Date.now()}`
      }
    };
  }

  /**
   * Generate mock response data
   */
  private generateMockResponse(config: any): any {
    const method = config.method.toUpperCase();
    
    switch (method) {
      case 'GET':
        return {
          id: Math.floor(Math.random() * 1000),
          message: 'GET request successful',
          timestamp: new Date().toISOString(),
          url: config.url
        };
      
      case 'POST':
        return {
          id: Math.floor(Math.random() * 1000),
          message: 'Resource created successfully',
          data: config.data,
          timestamp: new Date().toISOString()
        };
      
      case 'PUT':
        return {
          id: Math.floor(Math.random() * 1000),
          message: 'Resource updated successfully',
          data: config.data,
          timestamp: new Date().toISOString()
        };
      
      case 'DELETE':
        return {
          message: 'Resource deleted successfully',
          timestamp: new Date().toISOString()
        };
      
      default:
        return {
          message: `${method} request successful`,
          timestamp: new Date().toISOString()
        };
    }
  }

  /**
   * Handle and transform errors
   */
  private handleError(error: Error, config: RequestConfig): Error {
    // Create enhanced error with request context
    const enhancedError = new Error(`HTTP Request Failed: ${error.message}`);
    
    // Add request context to error
    (enhancedError as any).config = config;
    (enhancedError as any).isAxiosError = true;
    (enhancedError as any).originalError = error;
    
    return enhancedError;
  }

  /**
   * Add request interceptor (Axios-specific feature)
   */
  addRequestInterceptor(
    onFulfilled: (config: any) => any,
    onRejected?: (error: any) => any
  ): number {
    // In real Axios implementation, this would return interceptor ID
    const interceptorId = Math.floor(Math.random() * 1000);
    
    // Add to our interceptors array
    if (!this.config.interceptors) {
      this.config.interceptors = {};
    }
    if (!this.config.interceptors.request) {
      this.config.interceptors.request = [];
    }
    
    this.config.interceptors.request.push(onFulfilled);
    
    return interceptorId;
  }

  /**
   * Add response interceptor (Axios-specific feature)
   */
  addResponseInterceptor(
    onFulfilled: (response: any) => any,
    onRejected?: (error: any) => any
  ): number {
    const interceptorId = Math.floor(Math.random() * 1000);
    
    if (!this.config.interceptors) {
      this.config.interceptors = {};
    }
    if (!this.config.interceptors.response) {
      this.config.interceptors.response = [];
    }
    
    this.config.interceptors.response.push(onFulfilled);
    
    return interceptorId;
  }

  /**
   * Get current Axios configuration
   */
  getConfig(): any {
    return {
      timeout: this.config.timeout,
      baseURL: this.config.baseURL,
      headers: this.config.headers,
      retries: this.config.retries
    };
  }
} 