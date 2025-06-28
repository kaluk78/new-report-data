/**
 * Services Processor
 * 
 * MERGE SOURCE - Error handling and validation features
 * Contributed Features:
 * - Error handling
 * - Validation
 * - Logging
 * 
 * This implementation will be merged into src/core/data-processor.ts
 */

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
  data?: T;
  errors: string[];
  warnings: string[];
  processingTime: number;
}

export class ServiceProcessor {
  private logger: Logger;
  private validationRules: Map<string, ValidationRule<any>[]> = new Map();

  constructor(logger?: Logger) {
    this.logger = logger || new ConsoleLogger();
  }

  /**
   * Process data with comprehensive error handling
   * This error handling pattern will be contributed to the merged implementation
   */
  async processWithErrorHandling<T>(
    data: T,
    processor: (item: T) => Promise<T>,
    dataType?: string
  ): Promise<ProcessingResult<T>> {
    const startTime = performance.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      this.logger.info('Starting data processing', { dataType, timestamp: new Date().toISOString() });

      // Pre-processing validation
      const validationResult = this.validateData(data, dataType);
      if (!validationResult.isValid) {
        errors.push(...validationResult.errors);
        warnings.push(...validationResult.warnings);
      }

      // If validation fails, return early
      if (errors.length > 0) {
        this.logger.error('Validation failed', { errors, data });
        return {
          success: false,
          errors,
          warnings,
          processingTime: performance.now() - startTime
        };
      }

      // Process the data with error boundary
      const result = await this.executeWithRetry(processor, data, 3);

      // Post-processing validation
      const postValidation = this.validateData(result, dataType);
      if (!postValidation.isValid) {
        warnings.push(...postValidation.warnings);
      }

      const processingTime = performance.now() - startTime;
      this.logger.info('Processing completed successfully', { 
        processingTime, 
        dataType,
        warningsCount: warnings.length 
      });

      return {
        success: true,
        data: result,
        errors,
        warnings,
        processingTime
      };

    } catch (error) {
      const processingTime = performance.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.logger.error('Processing failed', { 
        error: errorMessage, 
        stack: error instanceof Error ? error.stack : undefined,
        processingTime,
        dataType 
      });

      errors.push(`Processing failed: ${errorMessage}`);

      return {
        success: false,
        errors,
        warnings,
        processingTime
      };
    }
  }

  /**
   * Validation system - will be contributed to merged implementation
   */
  private validateData<T>(data: T, dataType?: string): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!data) {
      errors.push('Data is null or undefined');
      return { isValid: false, errors, warnings };
    }

    // Apply validation rules if they exist for this data type
    if (dataType && this.validationRules.has(dataType)) {
      const rules = this.validationRules.get(dataType)!;
      
      for (const rule of rules) {
        const value = (data as any)[rule.field];
        
        // Required field check
        if (rule.required && (value === undefined || value === null)) {
          errors.push(`Field '${String(rule.field)}' is required`);
          continue;
        }

        // Type check
        if (value !== undefined && rule.type && typeof value !== rule.type) {
          errors.push(`Field '${String(rule.field)}' must be of type ${rule.type}`);
        }

        // String length checks
        if (typeof value === 'string') {
          if (rule.minLength && value.length < rule.minLength) {
            errors.push(`Field '${String(rule.field)}' must be at least ${rule.minLength} characters`);
          }
          if (rule.maxLength && value.length > rule.maxLength) {
            warnings.push(`Field '${String(rule.field)}' is longer than recommended ${rule.maxLength} characters`);
          }
        }

        // Pattern check
        if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
          errors.push(`Field '${String(rule.field)}' does not match required pattern`);
        }

        // Custom validation
        if (rule.custom && !rule.custom(value)) {
          errors.push(`Field '${String(rule.field)}' failed custom validation`);
        }
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Retry mechanism with exponential backoff
   */
  private async executeWithRetry<T>(
    processor: (item: T) => Promise<T>,
    data: T,
    maxRetries: number
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await processor(data);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt === maxRetries) {
          throw lastError;
        }

        // Exponential backoff
        const delay = Math.pow(2, attempt) * 100;
        this.logger.warn(`Processing attempt ${attempt} failed, retrying in ${delay}ms`, {
          error: lastError.message,
          attempt,
          maxRetries
        });

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  /**
   * Add validation rules for a data type
   */
  addValidationRules<T>(dataType: string, rules: ValidationRule<T>[]): void {
    this.validationRules.set(dataType, rules);
  }

  /**
   * Get processing statistics
   */
  getValidationRules(dataType: string): ValidationRule<any>[] | undefined {
    return this.validationRules.get(dataType);
  }
}

/**
 * Logger interface and implementations
 */
export interface Logger {
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, meta?: any): void;
}

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