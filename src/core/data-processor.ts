/**
 * Unified Data Processor
 * 
 * MERGED IMPLEMENTATION - Combines best features
 * Strategy: MERGE_BEST_FEATURES
 * 
 * Merged Features:
 * - Batch processing (from utils/data-processor.ts)
 * - Error handling (from services/processor.ts)
 * - Memory management (from utils/data-processor.ts)
 * - Validation (from services/processor.ts)
 * - Performance monitoring (NEW - combining insights from both)
 * 
 * This replaces both src/utils/data-processor.ts and src/services/processor.ts
 */

export interface ProcessingOptions {
  batchSize: number;
  maxMemoryUsage: number;
  enableOptimization: boolean;
  parallelProcessing: boolean;
  maxRetries: number;
  enableValidation: boolean;
}

export interface ValidationRule<T> {
  field: keyof T;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'object';
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean;
}

export interface ProcessingResult<T> {
  success: boolean;
  data?: T[];
  errors: string[];
  warnings: string[];
  processingTime: number;
  itemsProcessed: number;
  memoryUsage: number;
}

export interface Logger {
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, meta?: any): void;
}

export class UnifiedDataProcessor {
  private options: ProcessingOptions;
  private logger: Logger;
  private validationRules: Map<string, ValidationRule<any>[]> = new Map();
  private memoryUsage: number = 0;
  private processedCount: number = 0;
  private performanceMetrics: { totalTime: number; averageTime: number; slowItems: number } = {
    totalTime: 0,
    averageTime: 0,
    slowItems: 0
  };

  constructor(options: ProcessingOptions, logger?: Logger) {
    this.options = options;
    this.logger = logger || new ConsoleLogger();
  }

  /**
   * Main processing method - combines batch processing with error handling
   * Features from both source implementations merged here
   */
  async process<T>(
    data: T[],
    processor: (item: T) => Promise<T>,
    dataType?: string
  ): Promise<ProcessingResult<T>> {
    const startTime = performance.now();
    const results: T[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      this.logger.info('Starting unified data processing', {
        itemCount: data.length,
        dataType,
        batchSize: this.options.batchSize,
        timestamp: new Date().toISOString()
      });

      // Pre-processing validation if enabled
      if (this.options.enableValidation && dataType) {
        const validationResult = this.validateDataBatch(data, dataType);
        if (!validationResult.isValid) {
          errors.push(...validationResult.errors);
          warnings.push(...validationResult.warnings);
        }

        // If validation fails completely, return early
        if (errors.length > 0 && validationResult.errors.length === data.length) {
          this.logger.error('Batch validation failed completely', { errors });
          return this.createResult(false, [], errors, warnings, startTime, 0);
        }
      }

      // Process data in batches with error handling
      const batchSize = this.options.batchSize || 100;
      
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        
        // Memory management check before each batch
        this.checkMemoryUsage();
        
        try {
          const batchResults = await this.processBatchWithErrorHandling(
            batch, 
            processor, 
            dataType
          );
          
          results.push(...batchResults.successes);
          errors.push(...batchResults.errors);
          warnings.push(...batchResults.warnings);
          
          this.processedCount += batch.length;
          
          // Memory cleanup if needed
          if (this.memoryUsage > this.options.maxMemoryUsage * 0.8) {
            await this.performMemoryCleanup();
          }

          // Progress reporting
          const progress = ((i + batch.length) / data.length * 100).toFixed(1);
          this.logger.info(`Batch completed: ${progress}% (${this.processedCount}/${data.length})`);
          
        } catch (batchError) {
          const errorMessage = batchError instanceof Error ? batchError.message : 'Unknown batch error';
          this.logger.error('Batch processing failed', { 
            batchIndex: Math.floor(i / batchSize),
            error: errorMessage 
          });
          errors.push(`Batch ${Math.floor(i / batchSize)} failed: ${errorMessage}`);
        }
      }

      const processingTime = performance.now() - startTime;
      this.updatePerformanceMetrics(processingTime);

      this.logger.info('Processing completed', {
        totalItems: data.length,
        successfulItems: results.length,
        errors: errors.length,
        warnings: warnings.length,
        processingTime,
        averageTime: this.performanceMetrics.averageTime
      });

      return this.createResult(
        errors.length < data.length, // Success if not all items failed
        results,
        errors,
        warnings,
        startTime,
        results.length
      );

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Processing failed completely', { error: errorMessage });
      
      return this.createResult(
        false,
        [],
        [`Processing failed: ${errorMessage}`],
        warnings,
        startTime,
        0
      );
    }
  }

  /**
   * Process a single batch with error handling and retries
   * Combines batch processing (utils) with error handling (services)
   */
  private async processBatchWithErrorHandling<T>(
    batch: T[],
    processor: (item: T) => Promise<T>,
    dataType?: string
  ): Promise<{ successes: T[]; errors: string[]; warnings: string[] }> {
    const successes: T[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    if (this.options.parallelProcessing) {
      // Parallel processing with individual error handling
      const results = await Promise.allSettled(
        batch.map(item => this.processItemWithRetry(item, processor, dataType))
      );

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          if (result.value.success) {
            successes.push(result.value.data!);
            warnings.push(...result.value.warnings);
          } else {
            errors.push(...result.value.errors);
          }
        } else {
          errors.push(`Item ${index} failed: ${result.reason}`);
        }
      });
    } else {
      // Sequential processing with error handling
      for (let i = 0; i < batch.length; i++) {
        try {
          const result = await this.processItemWithRetry(batch[i], processor, dataType);
          if (result.success) {
            successes.push(result.data!);
            warnings.push(...result.warnings);
          } else {
            errors.push(...result.errors);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Item ${i} failed: ${errorMessage}`);
        }
      }
    }

    return { successes, errors, warnings };
  }

  /**
   * Process individual item with retry logic and validation
   * Combines performance optimization with error handling
   */
  private async processItemWithRetry<T>(
    item: T,
    processor: (item: T) => Promise<T>,
    dataType?: string
  ): Promise<{ success: boolean; data?: T; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Item validation if enabled
    if (this.options.enableValidation && dataType) {
      const validation = this.validateData(item, dataType);
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors,
          warnings: validation.warnings
        };
      }
      warnings.push(...validation.warnings);
    }

    // Process with retry logic
    let lastError: Error;
    const maxRetries = this.options.maxRetries || 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const startTime = performance.now();
        const result = await processor(item);
        
        // Performance tracking
        if (this.options.enableOptimization) {
          const processingTime = performance.now() - startTime;
          this.trackItemPerformance(processingTime);
        }

        return {
          success: true,
          data: result,
          errors,
          warnings
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt === maxRetries) {
          break;
        }

        // Exponential backoff
        const delay = Math.pow(2, attempt) * 100;
        this.logger.warn(`Item processing attempt ${attempt} failed, retrying in ${delay}ms`, {
          error: lastError.message,
          attempt,
          maxRetries
        });

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    errors.push(`Item processing failed after ${maxRetries} attempts: ${lastError!.message}`);
    return { success: false, errors, warnings };
  }

  /**
   * Memory management from utils/data-processor.ts
   */
  private checkMemoryUsage(): void {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in window.performance) {
      const memory = (window.performance as any).memory;
      this.memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
    } else if (typeof process !== 'undefined' && process.memoryUsage) {
      const memory = process.memoryUsage();
      this.memoryUsage = memory.heapUsed / memory.heapTotal;
    }

    if (this.memoryUsage > this.options.maxMemoryUsage) {
      this.logger.warn(`Memory usage high: ${(this.memoryUsage * 100).toFixed(2)}%`);
    }
  }

  /**
   * Memory cleanup from utils/data-processor.ts
   */
  private async performMemoryCleanup(): Promise<void> {
    if (typeof global !== 'undefined' && global.gc) {
      global.gc();
    }

    await new Promise(resolve => setTimeout(resolve, 100));
    this.logger.info('Memory cleanup performed');
  }

  /**
   * Validation from services/processor.ts
   */
  private validateData<T>(data: T, dataType: string): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!data) {
      errors.push('Data is null or undefined');
      return { isValid: false, errors, warnings };
    }

    if (this.validationRules.has(dataType)) {
      const rules = this.validationRules.get(dataType)!;
      
      for (const rule of rules) {
        const value = (data as any)[rule.field];
        
        if (rule.required && (value === undefined || value === null)) {
          errors.push(`Field '${String(rule.field)}' is required`);
          continue;
        }

        if (value !== undefined && rule.type && typeof value !== rule.type) {
          errors.push(`Field '${String(rule.field)}' must be of type ${rule.type}`);
        }

        if (typeof value === 'string') {
          if (rule.minLength && value.length < rule.minLength) {
            errors.push(`Field '${String(rule.field)}' must be at least ${rule.minLength} characters`);
          }
          if (rule.maxLength && value.length > rule.maxLength) {
            warnings.push(`Field '${String(rule.field)}' is longer than recommended`);
          }
        }

        if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
          errors.push(`Field '${String(rule.field)}' does not match required pattern`);
        }

        if (rule.custom && !rule.custom(value)) {
          errors.push(`Field '${String(rule.field)}' failed custom validation`);
        }
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Batch validation
   */
  private validateDataBatch<T>(data: T[], dataType: string): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    data.forEach((item, index) => {
      const validation = this.validateData(item, dataType);
      if (!validation.isValid) {
        errors.push(`Item ${index}: ${validation.errors.join(', ')}`);
      }
      warnings.push(...validation.warnings.map(w => `Item ${index}: ${w}`));
    });

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Performance tracking - NEW feature combining insights from both
   */
  private trackItemPerformance(processingTime: number): void {
    this.performanceMetrics.totalTime += processingTime;
    this.performanceMetrics.averageTime = this.performanceMetrics.totalTime / this.processedCount;
    
    if (processingTime > 1000) {
      this.performanceMetrics.slowItems++;
      this.logger.warn(`Slow processing detected: ${processingTime.toFixed(2)}ms`);
    }
  }

  /**
   * Update overall performance metrics
   */
  private updatePerformanceMetrics(totalProcessingTime: number): void {
    this.performanceMetrics.totalTime = totalProcessingTime;
    if (this.processedCount > 0) {
      this.performanceMetrics.averageTime = totalProcessingTime / this.processedCount;
    }
  }

  /**
   * Create standardized result object
   */
  private createResult<T>(
    success: boolean,
    data: T[],
    errors: string[],
    warnings: string[],
    startTime: number,
    itemsProcessed: number
  ): ProcessingResult<T> {
    return {
      success,
      data,
      errors,
      warnings,
      processingTime: performance.now() - startTime,
      itemsProcessed,
      memoryUsage: this.memoryUsage
    };
  }

  /**
   * Public API methods
   */
  addValidationRules<T>(dataType: string, rules: ValidationRule<T>[]): void {
    this.validationRules.set(dataType, rules);
  }

  getPerformanceMetrics(): typeof this.performanceMetrics {
    return { ...this.performanceMetrics };
  }

  reset(): void {
    this.processedCount = 0;
    this.memoryUsage = 0;
    this.performanceMetrics = { totalTime: 0, averageTime: 0, slowItems: 0 };
  }
}

/**
 * Console Logger implementation
 */
export class ConsoleLogger implements Logger {
  info(message: string, meta?: any): void {
    console.log(`[INFO] ${message}`, meta || '');
  }

  warn(message: string, meta?: any): void {
    console.warn(`[WARN] ${message}`, meta || '');
  }

  error(message: string, meta?: any): void {
    console.error(`[ERROR] ${message}`, meta || '');
  }
} 