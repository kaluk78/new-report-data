/**
 * Mock HTTP Client Implementation
 * 
 * NEW IMPLEMENTATION - From abstraction strategy
 * Strategy: REFACTOR_INTO_ABSTRACTION
 * 
 * Use Case: Testing and development
 * Migrated from: src/test/mock-http.ts
 */

import { BaseHttpClient, HttpClientConfig, RequestConfig, HttpResponse } from '../core/http-client';

interface MockResponse {
  status: number;
  data: any;
  headers?: Record<string, string>;
  delay?: number;
}

interface MockRule {
  method: string;
  url: string | RegExp;
  response: MockResponse | ((config: RequestConfig) => MockResponse);
}

export class MockHttpClient extends BaseHttpClient {
  private mockRules: MockRule[] = [];
  private requestHistory: RequestConfig[] = [];

  constructor(config: HttpClientConfig) {
    super(config);
    this.setupDefaultMocks();
  }

  /**
   * Main request method using mock responses
   */
  async request<T = any>(config: RequestConfig): Promise<HttpResponse<T>> {
    try {
      // Apply request interceptors
      const processedConfig = await this.applyRequestInterceptors(config);
      
      // Store request in history
      this.requestHistory.push(processedConfig);

      // Find matching mock rule
      const mockRule = this.findMatchingRule(processedConfig);
      
      if (!mockRule) {
        throw new Error(`No mock configured for ${processedConfig.method} ${processedConfig.url}`);
      }

      // Get mock response
      const mockResponse = typeof mockRule.response === 'function' 
        ? mockRule.response(processedConfig) 
        : mockRule.response;

      // Simulate network delay
      if (mockResponse.delay) {
        await new Promise(resolve => setTimeout(resolve, mockResponse.delay));
      }

      // Build response
      const response: HttpResponse<T> = {
        data: mockResponse.data,
        status: mockResponse.status,
        statusText: this.getStatusText(mockResponse.status),
        headers: mockResponse.headers || {},
        config: processedConfig
      };

      // Apply response interceptors
      return await this.applyResponseInterceptors(response);
      
    } catch (error) {
      throw this.handleError(error as Error, config);
    }
  }

  /**
   * Setup default mock responses
   */
  private setupDefaultMocks(): void {
    // Default GET response
    this.addMock('GET', /.*/, {
      status: 200,
      data: {
        message: 'Mock GET response',
        timestamp: new Date().toISOString(),
        method: 'GET'
      },
      delay: 100
    });

    // Default POST response
    this.addMock('POST', /.*/, (config) => ({
      status: 201,
      data: {
        message: 'Mock POST response',
        created: true,
        data: config.data,
        timestamp: new Date().toISOString()
      },
      delay: 150
    }));

    // Default PUT response
    this.addMock('PUT', /.*/, (config) => ({
      status: 200,
      data: {
        message: 'Mock PUT response',
        updated: true,
        data: config.data,
        timestamp: new Date().toISOString()
      },
      delay: 120
    }));

    // Default DELETE response
    this.addMock('DELETE', /.*/, {
      status: 204,
      data: null,
      delay: 80
    });

    // Error simulation for specific paths
    this.addMock('GET', '/error', {
      status: 500,
      data: {
        error: 'Internal Server Error',
        message: 'Mock error response'
      },
      delay: 50
    });

    this.addMock('GET', '/not-found', {
      status: 404,
      data: {
        error: 'Not Found',
        message: 'Resource not found'
      }
    });
  }

  /**
   * Add a mock rule
   */
  addMock(
    method: string, 
    url: string | RegExp, 
    response: MockResponse | ((config: RequestConfig) => MockResponse)
  ): void {
    this.mockRules.unshift({ // Add to beginning for priority
      method: method.toUpperCase(),
      url,
      response
    });
  }

  /**
   * Remove all mocks for a specific method and URL
   */
  removeMock(method: string, url: string | RegExp): void {
    this.mockRules = this.mockRules.filter(rule => 
      !(rule.method === method.toUpperCase() && this.urlMatches(rule.url, url))
    );
  }

  /**
   * Clear all mocks
   */
  clearMocks(): void {
    this.mockRules = [];
  }

  /**
   * Find matching mock rule for request
   */
  private findMatchingRule(config: RequestConfig): MockRule | null {
    return this.mockRules.find(rule => 
      rule.method === config.method.toUpperCase() && 
      this.urlMatches(rule.url, config.url)
    ) || null;
  }

  /**
   * Check if URL matches rule
   */
  private urlMatches(ruleUrl: string | RegExp, requestUrl: string): boolean {
    if (typeof ruleUrl === 'string') {
      return ruleUrl === requestUrl;
    }
    return ruleUrl.test(requestUrl);
  }

  /**
   * Get HTTP status text
   */
  private getStatusText(status: number): string {
    const statusTexts: Record<number, string> = {
      200: 'OK',
      201: 'Created',
      204: 'No Content',
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable'
    };
    
    return statusTexts[status] || 'Unknown';
  }

  /**
   * Handle and transform errors
   */
  private handleError(error: Error, config: RequestConfig): Error {
    const enhancedError = new Error(`Mock Request Failed: ${error.message}`);
    
    (enhancedError as any).config = config;
    (enhancedError as any).isMockError = true;
    (enhancedError as any).originalError = error;
    
    return enhancedError;
  }

  /**
   * Get request history for testing
   */
  getRequestHistory(): RequestConfig[] {
    return [...this.requestHistory];
  }

  /**
   * Clear request history
   */
  clearHistory(): void {
    this.requestHistory = [];
  }

  /**
   * Get last request for testing
   */
  getLastRequest(): RequestConfig | null {
    return this.requestHistory[this.requestHistory.length - 1] || null;
  }

  /**
   * Check if specific request was made
   */
  wasRequestMade(method: string, url: string): boolean {
    return this.requestHistory.some(req => 
      req.method.toUpperCase() === method.toUpperCase() && req.url === url
    );
  }

  /**
   * Simulate network failure
   */
  simulateNetworkError(method: string, url: string | RegExp): void {
    this.addMock(method, url, () => {
      throw new Error('Network Error: Connection failed');
    });
  }

  /**
   * Simulate slow response
   */
  simulateSlowResponse(method: string, url: string | RegExp, delay: number): void {
    this.addMock(method, url, {
      status: 200,
      data: { message: 'Slow response', delay },
      delay
    });
  }
} 