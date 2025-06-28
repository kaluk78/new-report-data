/**
 * Debug Logger - Development Debugging
 * 
 * KEEP - Specialized implementation
 * Strategy: KEEP_MULTIPLE_SPECIALIZED
 * 
 * Specialization: Development debugging
 * Unique Features:
 * - Stack trace analysis
 * - Variable inspection
 * - Performance profiling
 * 
 * Use Cases: Development, Testing, Debugging
 * Decision: KEEP - Unique debugging capabilities
 */

export interface DebugConfig {
  enableStackTrace: boolean;
  enableVariableInspection: boolean;
  enablePerformanceProfiling: boolean;
  maxStackDepth: number;
}

export interface DebugContext {
  function: string;
  file: string;
  line: number;
  variables?: Record<string, any>;
}

export class DebugLogger {
  private config: DebugConfig;
  private performanceMarks: Map<string, number> = new Map();

  constructor(config: DebugConfig) {
    this.config = config;
  }

  /**
   * Debug log with stack trace analysis
   */
  debug(message: string, context?: DebugContext, variables?: Record<string, any>): void {
    const timestamp = new Date().toISOString();
    const debugInfo: any = {
      timestamp,
      level: 'DEBUG',
      message
    };

    // Add stack trace if enabled
    if (this.config.enableStackTrace) {
      debugInfo.stackTrace = this.getStackTrace();
    }

    // Add context information
    if (context) {
      debugInfo.context = context;
    }

    // Add variable inspection if enabled
    if (this.config.enableVariableInspection && variables) {
      debugInfo.variables = this.inspectVariables(variables);
    }

    console.debug('[DEBUG]', debugInfo);
  }

  /**
   * Stack trace analysis - unique debugging capability
   */
  private getStackTrace(): string[] {
    const stack = new Error().stack;
    if (!stack) return [];

    const stackLines = stack.split('\n').slice(2); // Remove Error and this function
    return stackLines
      .slice(0, this.config.maxStackDepth)
      .map(line => line.trim())
      .filter(line => line.length > 0);
  }

  /**
   * Variable inspection - unique debugging capability
   */
  private inspectVariables(variables: Record<string, any>): Record<string, any> {
    const inspected: Record<string, any> = {};

    for (const [key, value] of Object.entries(variables)) {
      inspected[key] = {
        type: typeof value,
        value: this.formatValue(value),
        size: this.getValueSize(value)
      };
    }

    return inspected;
  }

  /**
   * Format value for debugging display
   */
  private formatValue(value: any): any {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'function') return `[Function: ${value.name || 'anonymous'}]`;
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return `[Array(${value.length})]`;
      }
      return `[Object: ${Object.keys(value).length} keys]`;
    }
    if (typeof value === 'string' && value.length > 100) {
      return `${value.substring(0, 100)}... (${value.length} chars)`;
    }
    return value;
  }

  /**
   * Get memory size of value
   */
  private getValueSize(value: any): string {
    try {
      const jsonString = JSON.stringify(value);
      const bytes = new Blob([jsonString]).size;
      return this.formatBytes(bytes);
    } catch {
      return 'unknown';
    }
  }

  /**
   * Format bytes to human readable
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * Performance profiling - unique debugging capability
   */
  startProfiling(label: string): void {
    if (!this.config.enablePerformanceProfiling) return;
    
    this.performanceMarks.set(label, performance.now());
    console.debug(`[PROFILE START] ${label}`);
  }

  /**
   * End performance profiling
   */
  endProfiling(label: string): number | null {
    if (!this.config.enablePerformanceProfiling) return null;
    
    const startTime = this.performanceMarks.get(label);
    if (!startTime) {
      console.warn(`[PROFILE] No start mark found for: ${label}`);
      return null;
    }

    const duration = performance.now() - startTime;
    this.performanceMarks.delete(label);
    
    console.debug(`[PROFILE END] ${label}: ${duration.toFixed(2)}ms`);
    return duration;
  }

  /**
   * Log function entry with arguments
   */
  functionEntry(functionName: string, args: any[]): void {
    this.debug(`Entering function: ${functionName}`, {
      function: functionName,
      file: 'unknown',
      line: 0
    }, {
      arguments: args
    });
  }

  /**
   * Log function exit with return value
   */
  functionExit(functionName: string, returnValue: any): void {
    this.debug(`Exiting function: ${functionName}`, {
      function: functionName,
      file: 'unknown',
      line: 0
    }, {
      returnValue
    });
  }

  /**
   * Debug assertion
   */
  assert(condition: boolean, message: string, context?: any): void {
    if (!condition) {
      console.error('[DEBUG ASSERTION FAILED]', {
        message,
        context,
        stackTrace: this.config.enableStackTrace ? this.getStackTrace() : undefined
      });
    }
  }

  /**
   * Memory usage debugging
   */
  logMemoryUsage(label?: string): void {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in window.performance) {
      const memory = (window.performance as any).memory;
      console.debug(`[MEMORY${label ? ` ${label}` : ''}]`, {
        used: this.formatBytes(memory.usedJSHeapSize),
        total: this.formatBytes(memory.totalJSHeapSize),
        limit: this.formatBytes(memory.jsHeapSizeLimit),
        usage: `${((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100).toFixed(2)}%`
      });
    } else if (typeof process !== 'undefined' && process.memoryUsage) {
      const memory = process.memoryUsage();
      console.debug(`[MEMORY${label ? ` ${label}` : ''}]`, {
        rss: this.formatBytes(memory.rss),
        heapTotal: this.formatBytes(memory.heapTotal),
        heapUsed: this.formatBytes(memory.heapUsed),
        external: this.formatBytes(memory.external),
        usage: `${((memory.heapUsed / memory.heapTotal) * 100).toFixed(2)}%`
      });
    }
  }
} 