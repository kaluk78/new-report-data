/**
 * Process Utility Module
 * 
 * TO BE DELETED - Part of data processing consolidation
 * This file will be removed as part of the MERGE_BEST_FEATURES strategy
 * 
 * Functionality will be moved to src/core/data-processor.ts
 */

export interface ProcessConfig {
  timeout: number;
  retries: number;
  batchSize: number;
}

export class ProcessUtil {
  private config: ProcessConfig;

  constructor(config: ProcessConfig) {
    this.config = config;
  }

  /**
   * Process array of items with basic batching
   */
  async processArray<T>(items: T[], processor: (item: T) => Promise<T>): Promise<T[]> {
    const results: T[] = [];
    const batchSize = this.config.batchSize || 10;

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      const batchResults = await Promise.all(
        batch.map(item => this.processWithTimeout(item, processor))
      );
      
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Process single item with timeout
   */
  private async processWithTimeout<T>(item: T, processor: (item: T) => Promise<T>): Promise<T> {
    return new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Processing timeout'));
      }, this.config.timeout);

      try {
        const result = await processor(item);
        clearTimeout(timeout);
        resolve(result);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  /**
   * Retry failed processing
   */
  async processWithRetry<T>(item: T, processor: (item: T) => Promise<T>): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt < this.config.retries; attempt++) {
      try {
        return await this.processWithTimeout(item, processor);
      } catch (error) {
        lastError = error as Error;
        console.warn(`Attempt ${attempt + 1} failed:`, error);
      }
    }

    throw lastError!;
  }

  /**
   * Get processing statistics
   */
  getStats(): { processed: number; failed: number } {
    // Mock stats
    return { processed: 0, failed: 0 };
  }
} 