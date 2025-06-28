/**
 * Data Processor Utility
 * 
 * MERGE SOURCE - Performance optimization features
 * Contributed Features:
 * - Performance optimization
 * - Memory management  
 * - Batch processing
 * 
 * This implementation will be merged into src/core/data-processor.ts
 */

export interface ProcessingOptions {
  batchSize: number;
  maxMemoryUsage: number;
  enableOptimization: boolean;
  parallelProcessing: boolean;
}

export class DataProcessor {
  private options: ProcessingOptions;
  private memoryUsage: number = 0;
  private processedCount: number = 0;

  constructor(options: ProcessingOptions) {
    this.options = options;
  }

  /**
   * Batch processing implementation - HIGH PERFORMANCE
   * This is the key feature that will be contributed to the merged implementation
   */
  async processBatch<T>(data: T[], processor: (item: T) => Promise<T>): Promise<T[]> {
    const results: T[] = [];
    const batchSize = this.options.batchSize || 100;

    // Memory-efficient batch processing
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      // Check memory usage before processing
      this.checkMemoryUsage();
      
      if (this.options.parallelProcessing) {
        // Parallel processing within batch
        const batchResults = await Promise.all(
          batch.map(item => this.processWithOptimization(item, processor))
        );
        results.push(...batchResults);
      } else {
        // Sequential processing within batch
        for (const item of batch) {
          const result = await this.processWithOptimization(item, processor);
          results.push(result);
        }
      }

      this.processedCount += batch.length;
      
      // Memory cleanup after each batch
      if (this.memoryUsage > this.options.maxMemoryUsage * 0.8) {
        await this.performMemoryCleanup();
      }

      // Progress reporting
      console.log(`Processed ${this.processedCount}/${data.length} items`);
    }

    return results;
  }

  /**
   * Performance-optimized processing wrapper
   */
  private async processWithOptimization<T>(
    item: T, 
    processor: (item: T) => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await processor(item);
      
      if (this.options.enableOptimization) {
        // Track processing time for optimization
        const processingTime = performance.now() - startTime;
        this.updatePerformanceMetrics(processingTime);
      }
      
      return result;
    } catch (error) {
      console.error('Processing error for item:', item, error);
      throw error;
    }
  }

  /**
   * Memory management - monitors and controls memory usage
   */
  private checkMemoryUsage(): void {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in window.performance) {
      // Browser environment
      const memory = (window.performance as any).memory;
      this.memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
    } else if (typeof process !== 'undefined' && process.memoryUsage) {
      // Node.js environment
      const memory = process.memoryUsage();
      this.memoryUsage = memory.heapUsed / memory.heapTotal;
    }

    if (this.memoryUsage > this.options.maxMemoryUsage) {
      console.warn(`Memory usage high: ${(this.memoryUsage * 100).toFixed(2)}%`);
    }
  }

  /**
   * Memory cleanup operations
   */
  private async performMemoryCleanup(): Promise<void> {
    // Force garbage collection if available
    if (typeof global !== 'undefined' && global.gc) {
      global.gc();
    }

    // Clear any internal caches
    this.clearInternalCaches();

    // Wait for cleanup to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('Memory cleanup performed');
  }

  /**
   * Performance metrics tracking
   */
  private updatePerformanceMetrics(processingTime: number): void {
    // Track average processing time
    // This could be expanded to include more sophisticated metrics
    if (processingTime > 1000) {
      console.warn(`Slow processing detected: ${processingTime}ms`);
    }
  }

  /**
   * Clear internal caches for memory management
   */
  private clearInternalCaches(): void {
    // Clear any cached data structures
    // Implementation would depend on specific caching strategy
  }

  /**
   * Get processing statistics
   */
  getStats(): { processedCount: number; memoryUsage: number } {
    return {
      processedCount: this.processedCount,
      memoryUsage: this.memoryUsage
    };
  }

  /**
   * Reset processor state
   */
  reset(): void {
    this.processedCount = 0;
    this.memoryUsage = 0;
  }
} 