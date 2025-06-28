/**
 * Production Logger
 * 
 * KEEP - Specialized implementation
 * Strategy: KEEP_MULTIPLE_SPECIALIZED
 * 
 * Specialization: Production logging
 * Unique Features:
 * - Log aggregation
 * - Error reporting
 * - Metrics collection
 * 
 * Use Cases: Production, Monitoring, Analytics
 * Decision: KEEP - Production-specific features
 */

export interface ProdLogConfig {
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  enableMetrics: boolean;
  enableErrorReporting: boolean;
  aggregationInterval: number;
  maxLogBuffer: number;
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  metadata?: any;
  correlationId?: string;
  userId?: string;
  sessionId?: string;
}

export interface MetricData {
  name: string;
  value: number;
  unit: string;
  tags?: Record<string, string>;
  timestamp: string;
}

export class ProdLogger {
  private config: ProdLogConfig;
  private logBuffer: LogEntry[] = [];
  private metrics: MetricData[] = [];
  private errorCounts: Map<string, number> = new Map();
  private aggregationTimer?: NodeJS.Timeout;

  constructor(config: ProdLogConfig) {
    this.config = config;
    this.startAggregation();
  }

  /**
   * Log aggregation - unique production feature
   */
  private startAggregation(): void {
    this.aggregationTimer = setInterval(() => {
      this.flushLogs();
      this.flushMetrics();
    }, this.config.aggregationInterval);
  }

  /**
   * Info level logging with metadata
   */
  info(message: string, metadata?: any, correlationId?: string): void {
    if (this.shouldLog('info')) {
      this.addToBuffer('INFO', message, metadata, correlationId);
    }
  }

  /**
   * Warning level logging
   */
  warn(message: string, metadata?: any, correlationId?: string): void {
    if (this.shouldLog('warn')) {
      this.addToBuffer('WARN', message, metadata, correlationId);
    }
  }

  /**
   * Error level logging with error reporting
   */
  error(message: string, error?: Error, metadata?: any, correlationId?: string): void {
    if (this.shouldLog('error')) {
      const errorMetadata = {
        ...metadata,
        error: error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : undefined
      };

      this.addToBuffer('ERROR', message, errorMetadata, correlationId);

      // Error reporting - unique production feature
      if (this.config.enableErrorReporting && error) {
        this.reportError(error, message, metadata);
      }
    }
  }

  /**
   * Add log entry to buffer
   */
  private addToBuffer(level: string, message: string, metadata?: any, correlationId?: string): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      metadata,
      correlationId
    };

    this.logBuffer.push(entry);

    // Prevent buffer overflow
    if (this.logBuffer.length > this.config.maxLogBuffer) {
      this.logBuffer.shift(); // Remove oldest entry
    }

    // Immediate console output for errors
    if (level === 'ERROR') {
      console.error(`[${entry.timestamp}] [${level}] ${message}`, metadata || '');
    }
  }

  /**
   * Check if should log based on level
   */
  private shouldLog(level: string): boolean {
    const levels = ['error', 'warn', 'info', 'debug'];
    const configLevelIndex = levels.indexOf(this.config.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex <= configLevelIndex;
  }

  /**
   * Error reporting - unique production feature
   */
  private reportError(error: Error, context: string, metadata?: any): void {
    const errorKey = `${error.name}:${error.message}`;
    const currentCount = this.errorCounts.get(errorKey) || 0;
    this.errorCounts.set(errorKey, currentCount + 1);

    // Report to external error tracking service (mock)
    const errorReport = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context,
      metadata,
      count: currentCount + 1,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    };

    // In real implementation, this would send to services like Sentry, Bugsnag, etc.
    console.error('[ERROR REPORT]', errorReport);
  }

  /**
   * Metrics collection - unique production feature
   */
  recordMetric(name: string, value: number, unit: string = 'count', tags?: Record<string, string>): void {
    if (!this.config.enableMetrics) return;

    const metric: MetricData = {
      name,
      value,
      unit,
      tags,
      timestamp: new Date().toISOString()
    };

    this.metrics.push(metric);
  }

  /**
   * Performance timing metric
   */
  recordTiming(name: string, duration: number, tags?: Record<string, string>): void {
    this.recordMetric(name, duration, 'milliseconds', tags);
  }

  /**
   * Counter metric
   */
  incrementCounter(name: string, tags?: Record<string, string>): void {
    this.recordMetric(name, 1, 'count', tags);
  }

  /**
   * Gauge metric
   */
  recordGauge(name: string, value: number, tags?: Record<string, string>): void {
    this.recordMetric(name, value, 'gauge', tags);
  }

  /**
   * Flush logs to external service
   */
  private flushLogs(): void {
    if (this.logBuffer.length === 0) return;

    const logsToFlush = [...this.logBuffer];
    this.logBuffer = [];

    // In real implementation, send to log aggregation service
    console.log(`[LOG FLUSH] Sending ${logsToFlush.length} log entries to aggregation service`);
    
    // Mock external service call
    this.sendToLogService(logsToFlush);
  }

  /**
   * Flush metrics to external service
   */
  private flushMetrics(): void {
    if (this.metrics.length === 0) return;

    const metricsToFlush = [...this.metrics];
    this.metrics = [];

    // In real implementation, send to metrics service
    console.log(`[METRICS FLUSH] Sending ${metricsToFlush.length} metrics to monitoring service`);
    
    // Mock external service call
    this.sendToMetricsService(metricsToFlush);
  }

  /**
   * Mock external log service
   */
  private async sendToLogService(logs: LogEntry[]): Promise<void> {
    // Simulate network call
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // In production, this would be calls to services like:
    // - ELK Stack (Elasticsearch, Logstash, Kibana)
    // - Splunk
    // - CloudWatch Logs
    // - DataDog
  }

  /**
   * Mock external metrics service
   */
  private async sendToMetricsService(metrics: MetricData[]): Promise<void> {
    // Simulate network call
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // In production, this would be calls to services like:
    // - Prometheus
    // - DataDog
    // - New Relic
    // - CloudWatch Metrics
  }

  /**
   * Health check logging
   */
  logHealthCheck(service: string, status: 'healthy' | 'unhealthy', responseTime?: number): void {
    this.info(`Health check: ${service}`, {
      service,
      status,
      responseTime
    });

    if (this.config.enableMetrics) {
      this.recordMetric(`health.${service}`, status === 'healthy' ? 1 : 0, 'gauge');
      if (responseTime) {
        this.recordTiming(`health.${service}.response_time`, responseTime);
      }
    }
  }

  /**
   * Request logging for API monitoring
   */
  logRequest(method: string, path: string, statusCode: number, duration: number, userId?: string): void {
    this.info(`${method} ${path} ${statusCode}`, {
      method,
      path,
      statusCode,
      duration,
      userId
    });

    if (this.config.enableMetrics) {
      this.recordMetric('api.requests', 1, 'count', {
        method,
        path,
        status_code: statusCode.toString()
      });
      this.recordTiming('api.response_time', duration, { method, path });
    }
  }

  /**
   * Business event logging
   */
  logBusinessEvent(event: string, data?: any, userId?: string): void {
    this.info(`Business event: ${event}`, {
      event,
      data,
      userId
    });

    if (this.config.enableMetrics) {
      this.recordMetric(`business.${event}`, 1, 'count', userId ? { user_id: userId } : undefined);
    }
  }

  /**
   * Get error summary for monitoring
   */
  getErrorSummary(): Array<{ error: string; count: number }> {
    return Array.from(this.errorCounts.entries()).map(([error, count]) => ({
      error,
      count
    }));
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.aggregationTimer) {
      clearInterval(this.aggregationTimer);
    }
    
    // Final flush
    this.flushLogs();
    this.flushMetrics();
  }
} 