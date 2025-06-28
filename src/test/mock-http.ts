/**
 * Mock HTTP for Testing - TO BE MIGRATED
 * 
 * MIGRATE - From HTTP Client Cluster
 * Strategy: REFACTOR_INTO_ABSTRACTION
 * 
 * This will be migrated to: src/clients/mock-client.ts
 * Testing and development mock client
 */

interface MockRequest {
  method: string;
  url: string;
  data?: any;
  headers?: Record<string, string>;
  timestamp: number;
}

interface MockResponse {
  status: number;
  data: any;
  headers?: Record<string, string>;
}

export class MockHttp {
  private static requests: MockRequest[] = [];
  private static responses: Map<string, MockResponse> = new Map();

  /**
   * Mock GET request
   * MIGRATE: Will become part of MockHttpClient
   */
  static async get<T>(url: string, headers?: Record<string, string>): Promise<T> {
    const request: MockRequest = {
      method: 'GET',
      url,
      headers,
      timestamp: Date.now()
    };
    
    this.requests.push(request);
    
    const mockKey = `GET:${url}`;
    const mockResponse = this.responses.get(mockKey);
    
    if (mockResponse) {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
      
      if (mockResponse.status >= 400) {
        throw new Error(`HTTP ${mockResponse.status}: Mock error response`);
      }
      
      return mockResponse.data;
    }
    
    // Default mock response
    return {
      id: Math.floor(Math.random() * 1000),
      message: 'Mock GET response',
      url,
      timestamp: new Date().toISOString()
    } as T;
  }

  /**
   * Mock POST request
   */
  static async post<T>(url: string, data: any, headers?: Record<string, string>): Promise<T> {
    const request: MockRequest = {
      method: 'POST',
      url,
      data,
      headers,
      timestamp: Date.now()
    };
    
    this.requests.push(request);
    
    const mockKey = `POST:${url}`;
    const mockResponse = this.responses.get(mockKey);
    
    if (mockResponse) {
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 150));
      
      if (mockResponse.status >= 400) {
        throw new Error(`HTTP ${mockResponse.status}: Mock error response`);
      }
      
      return mockResponse.data;
    }
    
    // Default mock response
    return {
      id: Math.floor(Math.random() * 1000),
      message: 'Mock POST response',
      created: true,
      data,
      timestamp: new Date().toISOString()
    } as T;
  }

  /**
   * Set mock response for specific request
   * MIGRATE: Enhanced version will be in MockHttpClient
   */
  static setMockResponse(method: string, url: string, response: MockResponse): void {
    const key = `${method.toUpperCase()}:${url}`;
    this.responses.set(key, response);
  }

  /**
   * Get request history for testing
   */
  static getRequestHistory(): MockRequest[] {
    return [...this.requests];
  }

  /**
   * Clear request history
   */
  static clearHistory(): void {
    this.requests = [];
  }

  /**
   * Get last request
   */
  static getLastRequest(): MockRequest | null {
    return this.requests[this.requests.length - 1] || null;
  }

  /**
   * Check if specific request was made
   */
  static wasRequestMade(method: string, url: string): boolean {
    return this.requests.some(req => 
      req.method.toUpperCase() === method.toUpperCase() && req.url === url
    );
  }

  /**
   * Simulate network error
   */
  static simulateNetworkError(method: string, url: string): void {
    this.setMockResponse(method, url, {
      status: 500,
      data: { error: 'Network Error', message: 'Simulated network failure' }
    });
  }

  /**
   * Simulate timeout
   */
  static simulateTimeout(method: string, url: string, delay: number = 10000): void {
    const originalSetTimeout = global.setTimeout;
    this.setMockResponse(method, url, {
      status: 408,
      data: { error: 'Timeout', message: 'Request timeout' }
    });
  }

  /**
   * Reset all mocks
   */
  static reset(): void {
    this.requests = [];
    this.responses.clear();
  }
} 