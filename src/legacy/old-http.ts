/**
 * Legacy HTTP Client - TO BE DELETED
 * 
 * DELETE - From HTTP Client Cluster
 * Strategy: REFACTOR_INTO_ABSTRACTION
 * 
 * Legacy implementation with outdated patterns
 * Migrated to: src/core/http-client.ts
 */

export class OldHttpClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Legacy GET implementation
   * DELETE: Replaced by modern HttpClient interface
   */
  get(endpoint: string, callback: (error: Error | null, data?: any) => void): void {
    // Old callback-based approach
    const xhr = new XMLHttpRequest();
    xhr.open('GET', endpoint);
    xhr.setRequestHeader('X-API-Key', this.apiKey);
    
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          try {
            const data = JSON.parse(xhr.responseText);
            callback(null, data);
          } catch (e) {
            callback(new Error('Failed to parse response'));
          }
        } else {
          callback(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
        }
      }
    };

    xhr.onerror = function() {
      callback(new Error('Network error'));
    };

    xhr.send();
  }

  /**
   * Legacy POST implementation
   */
  post(endpoint: string, data: any, callback: (error: Error | null, response?: any) => void): void {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', endpoint);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('X-API-Key', this.apiKey);
    
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            callback(null, response);
          } catch (e) {
            callback(new Error('Failed to parse response'));
          }
        } else {
          callback(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
        }
      }
    };

    xhr.onerror = function() {
      callback(new Error('Network error'));
    };

    xhr.send(JSON.stringify(data));
  }

  /**
   * Legacy synchronous request (bad practice)
   */
  syncGet(endpoint: string): any {
    console.warn('⚠️ Synchronous HTTP request - blocks UI thread');
    
    const xhr = new XMLHttpRequest();
    xhr.open('GET', endpoint, false); // Synchronous
    xhr.setRequestHeader('X-API-Key', this.apiKey);
    xhr.send();

    if (xhr.status === 200) {
      return JSON.parse(xhr.responseText);
    } else {
      throw new Error(`HTTP ${xhr.status}: ${xhr.statusText}`);
    }
  }
} 