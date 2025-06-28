/**
 * HTTP Utilities - TO BE MIGRATED
 * 
 * MIGRATE - From HTTP Client Cluster
 * Strategy: REFACTOR_INTO_ABSTRACTION
 * 
 * This will be migrated to: src/clients/fetch-client.ts
 * Lightweight client for simple requests
 */

export class HttpUtil {
  /**
   * Simple GET request using fetch
   * MIGRATE: Will become part of FetchHttpClient
   */
  static async get<T>(url: string, headers?: Record<string, string>): Promise<T> {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Simple POST request using fetch
   */
  static async post<T>(url: string, data: any, headers?: Record<string, string>): Promise<T> {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * PUT request
   */
  static async put<T>(url: string, data: any, headers?: Record<string, string>): Promise<T> {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * DELETE request
   */
  static async delete<T>(url: string, headers?: Record<string, string>): Promise<T> {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Handle empty response for DELETE
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  /**
   * Download file
   * MIGRATE: This functionality will be enhanced in FetchHttpClient
   */
  static async downloadFile(url: string, filename?: string): Promise<Blob> {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Download failed: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();

    // Trigger download if filename provided and in browser
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
   * Upload file
   */
  static async uploadFile<T>(url: string, file: File, fieldName: string = 'file'): Promise<T> {
    const formData = new FormData();
    formData.append(fieldName, file);

    const response = await fetch(url, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Check if URL is reachable
   */
  static async isReachable(url: string, timeout: number = 5000): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }
} 