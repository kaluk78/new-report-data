/**
 * Fetch HTTP Client Implementation
 * 
 * NEW IMPLEMENTATION - From abstraction strategy
 * Strategy: REFACTOR_INTO_ABSTRACTION
 * 
 * Use Case: Lightweight client for simple requests
 * Migrated from: src/utils/http-util.ts
 */

import { BaseHttpClient, HttpClientConfig, RequestConfig, HttpResponse } from '../core/http-client';

export class FetchHttpClient extends BaseHttpClient {
  constructor(config: HttpClientConfig) {
    super(config);
  }

  /**
   * Main request method using Fetch API
   */
  async request<T = any>(config: RequestConfig): Promise<HttpResponse<T>> {
    try {
      // Apply request interceptors
      const processedConfig = await this.applyRequestInterceptors(config);
      
      // Build fetch options
      const fetchOptions: RequestInit = {
        method: processedConfig.method,
        headers: this.mergeHeaders(processedConfig.headers),
      };

      // Add body for non-GET requests
      if (processedConfig.data && processedConfig.method !== 'GET') {
        if (typeof processedConfig.data === 'object') {
          fetchOptions.body = JSON.stringify(processedConfig.data);
          // Ensure content-type is set for JSON
          (fetchOptions.headers as any)['Content-Type'] = 'application/json';
        } else {
          fetchOptions.body = processedConfig.data;
        }
      }

      // Add timeout support
      const timeout = processedConfig.timeout || this.config.timeout;
      const controller = new AbortController();
      fetchOptions.signal = controller.signal;

      const timeoutId = setTimeout(() => {
        controller.abort();
      }, timeout);

      // Execute request with retry logic
      let lastError: Error;
      const maxRetries = processedConfig.retries || this.config.retries;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const response = await fetch(this.buildUrl(processedConfig.url), fetchOptions);
          
          clearTimeout(timeoutId);

          // Handle HTTP errors
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          // Parse response data
          const data = await this.parseResponse<T>(response);

          // Build our standard response format
          const httpResponse: HttpResponse<T> = {
            data,
            status: response.status,
            statusText: response.statusText,
            headers: this.parseHeaders(response.headers),
            config: processedConfig
          };

          // Apply response interceptors
          return await this.applyResponseInterceptors(httpResponse);
          
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

      clearTimeout(timeoutId);
      throw lastError!;
      
    } catch (error) {
      throw this.handleError(error as Error, config);
    }
  }

  /**
   * Parse response based on content type
   */
  private async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      return await response.json();
    } else if (contentType.includes('text/')) {
      return await response.text() as any;
    } else if (contentType.includes('application/octet-stream')) {
      return await response.arrayBuffer() as any;
    } else {
      // Try JSON first, fallback to text
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch {
        return text as any;
      }
    }
  }

  /**
   * Convert Headers object to plain object
   */
  private parseHeaders(headers: Headers): Record<string, string> {
    const headerObject: Record<string, string> = {};
    
    headers.forEach((value, key) => {
      headerObject[key.toLowerCase()] = value;
    });
    
    return headerObject;
  }

  /**
   * Handle and transform errors
   */
  private handleError(error: Error, config: RequestConfig): Error {
    let message = error.message;
    
    // Handle specific fetch errors
    if (error.name === 'AbortError') {
      message = `Request timeout after ${config.timeout || this.config.timeout}ms`;
    } else if (error.message.includes('Failed to fetch')) {
      message = 'Network error: Unable to connect to server';
    }

    const enhancedError = new Error(`Fetch Request Failed: ${message}`);
    
    // Add request context to error
    (enhancedError as any).config = config;
    (enhancedError as any).isFetchError = true;
    (enhancedError as any).originalError = error;
    
    return enhancedError;
  }

  /**
   * Upload file using FormData
   */
  async uploadFile<T = any>(
    url: string, 
    file: File | Blob, 
    fieldName: string = 'file',
    additionalFields?: Record<string, string>
  ): Promise<HttpResponse<T>> {
    const formData = new FormData();
    formData.append(fieldName, file);

    // Add additional fields if provided
    if (additionalFields) {
      Object.entries(additionalFields).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    return this.request<T>({
      url,
      method: 'POST',
      data: formData
    });
  }

  /**
   * Download file as blob
   */
  async downloadFile(url: string, filename?: string): Promise<Blob> {
    const response = await this.request<ArrayBuffer>({
      url,
      method: 'GET'
    });

    const blob = new Blob([response.data]);

    // If filename provided and browser supports it, trigger download
    if (filename && typeof window !== 'undefined') {
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    }

    return blob;
  }

  /**
   * Check if fetch is available
   */
  static isSupported(): boolean {
    return typeof fetch !== 'undefined';
  }

  /**
   * Create a simple GET request shorthand
   */
  async quickGet<T = any>(url: string): Promise<T> {
    const response = await this.get<T>(url);
    return response.data;
  }

  /**
   * Create a simple POST request shorthand
   */
  async quickPost<T = any>(url: string, data: any): Promise<T> {
    const response = await this.post<T>(url, data);
    return response.data;
  }
} 