/**
 * Request Helper - TO BE DELETED
 * 
 * DELETE - From HTTP Client Cluster
 * Strategy: REFACTOR_INTO_ABSTRACTION
 * 
 * This file will be replaced by the new HTTP client abstraction
 * Migrated to: src/core/http-client.ts
 */

export interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
  data?: any;
  headers?: Record<string, string>;
  timeout?: number;
}

export class RequestHelper {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL: string = '', defaultHeaders: Record<string, string> = {}) {
    this.baseURL = baseURL;
    this.defaultHeaders = defaultHeaders;
  }

  /**
   * Make HTTP request
   * DELETE: This functionality will be moved to HttpClient abstraction
   */
  async makeRequest<T>(options: RequestOptions): Promise<T> {
    const url = this.buildUrl(options.url);
    const headers = { ...this.defaultHeaders, ...options.headers };

    // Simple fetch implementation
    const response = await fetch(url, {
      method: options.method,
      headers,
      body: options.data ? JSON.stringify(options.data) : undefined
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * GET request helper
   */
  async get<T>(url: string, headers?: Record<string, string>): Promise<T> {
    return this.makeRequest<T>({ method: 'GET', url, headers });
  }

  /**
   * POST request helper
   */
  async post<T>(url: string, data: any, headers?: Record<string, string>): Promise<T> {
    return this.makeRequest<T>({ method: 'POST', url, data, headers });
  }

  /**
   * Build full URL
   */
  private buildUrl(path: string): string {
    if (path.startsWith('http')) {
      return path;
    }
    return `${this.baseURL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  }

  /**
   * Set authentication header
   */
  setAuthToken(token: string): void {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }
} 