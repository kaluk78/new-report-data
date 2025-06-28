/**
 * API Utilities - TO BE DELETED
 * 
 * DELETE - From HTTP Client Cluster
 * Strategy: REFACTOR_INTO_ABSTRACTION
 * 
 * Utility functions that will be integrated into HttpClient abstraction
 * Migrated to: src/core/http-client.ts
 */

export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

export class ApiUtil {
  /**
   * Build query string from object
   * DELETE: This will be part of HttpClient utilities
   */
  static buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    
    return searchParams.toString();
  }

  /**
   * Handle API response
   */
  static handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    return response.json().then(data => ({
      data,
      status: response.status,
      message: response.statusText
    }));
  }

  /**
   * Create API endpoint URL
   */
  static createEndpoint(base: string, path: string, params?: Record<string, any>): string {
    const url = new URL(path, base);
    
    if (params) {
      const queryString = this.buildQueryString(params);
      if (queryString) {
        url.search = queryString;
      }
    }
    
    return url.toString();
  }

  /**
   * Retry mechanism for failed requests
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          break;
        }
        
        // Exponential backoff
        const waitTime = delay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    throw lastError!;
  }

  /**
   * Parse error response
   */
  static parseError(error: any): { message: string; code?: string } {
    if (error.response) {
      return {
        message: error.response.data?.message || error.response.statusText,
        code: error.response.data?.code
      };
    }
    
    return {
      message: error.message || 'Unknown error occurred'
    };
  }
} 