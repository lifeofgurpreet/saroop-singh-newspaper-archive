/**
 * Structured Logger - JSON event logging with correlation IDs and metrics
 * Provides comprehensive audit trail and observability
 */

import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';

export class StructuredLogger {
  constructor(options = {}) {
    this.serviceName = options.serviceName || 'adk-restoration';
    this.version = options.version || '1.0.0';
    this.environment = options.environment || process.env.NODE_ENV || 'development';
    this.logDir = options.logDir || path.join(process.cwd(), 'logs');
    
    // Correlation ID tracking
    this.correlationIds = new Map(); // sessionId -> correlationId
    this.requestMetadata = new Map(); // correlationId -> metadata
    
    this.initializeLogger();
  }

  /**
   * Initialize Winston logger with structured format
   */
  initializeLogger() {
    // Custom format for structured logging
    const structuredFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.printf((info) => {
        const logEntry = {
          timestamp: info.timestamp,
          level: info.level,
          message: info.message,
          service: this.serviceName,
          version: this.version,
          environment: this.environment,
          ...info
        };

        // Remove duplicate fields
        delete logEntry.timestamp;
        delete logEntry.level;
        delete logEntry.message;

        return JSON.stringify({
          timestamp: info.timestamp,
          level: info.level,
          message: info.message,
          ...logEntry
        });
      })
    );

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: structuredFormat,
      defaultMeta: {
        service: this.serviceName,
        version: this.version,
        environment: this.environment
      },
      transports: [
        // Console output (development)
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        }),
        
        // Application logs
        new winston.transports.File({
          filename: path.join(this.logDir, 'application.log'),
          maxsize: 50 * 1024 * 1024, // 50MB
          maxFiles: 5,
          tailable: true
        }),
        
        // Error logs
        new winston.transports.File({
          filename: path.join(this.logDir, 'errors.log'),
          level: 'error',
          maxsize: 10 * 1024 * 1024, // 10MB
          maxFiles: 10,
          tailable: true
        }),
        
        // Audit trail
        new winston.transports.File({
          filename: path.join(this.logDir, 'audit.log'),
          maxsize: 100 * 1024 * 1024, // 100MB
          maxFiles: 10,
          tailable: true
        })
      ]
    });

    // Ensure log directory exists
    this.ensureLogDirectory();
  }

  /**
   * Ensure log directory exists
   */
  async ensureLogDirectory() {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create log directory:', error);
    }
  }

  /**
   * Generate correlation ID for request tracking
   */
  generateCorrelationId(sessionId = null) {
    const correlationId = uuidv4();
    
    if (sessionId) {
      this.correlationIds.set(sessionId, correlationId);
    }
    
    return correlationId;
  }

  /**
   * Get correlation ID for session
   */
  getCorrelationId(sessionId) {
    return this.correlationIds.get(sessionId);
  }

  /**
   * Set request metadata for correlation tracking
   */
  setRequestMetadata(correlationId, metadata) {
    this.requestMetadata.set(correlationId, {
      ...this.requestMetadata.get(correlationId),
      ...metadata
    });
  }

  /**
   * Log structured event
   */
  logEvent(level, event, data = {}, correlationId = null) {
    const logData = {
      event,
      correlationId,
      timestamp: new Date().toISOString(),
      ...data
    };

    // Add request metadata if available
    if (correlationId && this.requestMetadata.has(correlationId)) {
      logData.requestMetadata = this.requestMetadata.get(correlationId);
    }

    this.logger.log(level, `Event: ${event}`, logData);
  }

  /**
   * Log job lifecycle events
   */
  logJobEvent(jobId, sessionId, event, data = {}) {
    const correlationId = this.getCorrelationId(sessionId) || this.generateCorrelationId(sessionId);
    
    this.logEvent('info', event, {
      jobId,
      sessionId,
      category: 'job-lifecycle',
      ...data
    }, correlationId);
  }

  /**
   * Log state transitions
   */
  logStateTransition(jobId, fromState, toState, reason, metadata = {}) {
    const correlationId = this.correlationIds.get(jobId);
    
    this.logEvent('info', 'state-transition', {
      jobId,
      fromState,
      toState,
      reason,
      category: 'state-machine',
      ...metadata
    }, correlationId);
  }

  /**
   * Log quality control decisions
   */
  logQCDecision(jobId, sessionId, decision, validationResults = {}) {
    const correlationId = this.getCorrelationId(sessionId);
    
    this.logEvent('info', 'qc-decision', {
      jobId,
      sessionId,
      decision: decision.action,
      confidence: decision.confidence,
      reason: decision.reason,
      qualityScore: decision.qualityScore,
      shouldRetry: decision.shouldRetry,
      category: 'quality-control',
      validationScores: validationResults
    }, correlationId);
  }

  /**
   * Log processing metrics
   */
  logProcessingMetrics(jobId, sessionId, metrics) {
    const correlationId = this.getCorrelationId(sessionId);
    
    this.logEvent('info', 'processing-metrics', {
      jobId,
      sessionId,
      category: 'metrics',
      processingTime: metrics.processingTime,
      stepsCompleted: metrics.stepsCompleted,
      totalSteps: metrics.totalSteps,
      retryCount: metrics.retryCount,
      tokenUsage: metrics.tokenUsage,
      apiCalls: metrics.apiCalls,
      memoryUsage: metrics.memoryUsage,
      qualityScore: metrics.qualityScore
    }, correlationId);
  }

  /**
   * Log API interactions
   */
  logApiCall(service, method, endpoint, duration, status, metadata = {}) {
    this.logEvent('info', 'api-call', {
      service,
      method,
      endpoint,
      duration,
      status,
      category: 'api-interaction',
      ...metadata
    });
  }

  /**
   * Log errors with full context
   */
  logError(error, context = {}) {
    const errorData = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code
      },
      category: 'error',
      ...context
    };

    if (context.correlationId) {
      errorData.correlationId = context.correlationId;
    }

    this.logEvent('error', 'error-occurred', errorData, context.correlationId);
  }

  /**
   * Log performance metrics
   */
  logPerformanceMetric(metric, value, unit = 'ms', tags = {}) {
    this.logEvent('info', 'performance-metric', {
      metric,
      value,
      unit,
      tags,
      category: 'performance'
    });
  }

  /**
   * Log batch processing events
   */
  logBatchEvent(batchId, event, data = {}) {
    this.logEvent('info', event, {
      batchId,
      category: 'batch-processing',
      ...data
    });
  }

  /**
   * Log security events
   */
  logSecurityEvent(event, severity, details = {}) {
    this.logEvent('warn', event, {
      severity,
      category: 'security',
      ...details
    });
  }

  /**
   * Start request logging
   */
  startRequest(sessionId, requestType, metadata = {}) {
    const correlationId = this.generateCorrelationId(sessionId);
    const startTime = Date.now();
    
    this.setRequestMetadata(correlationId, {
      requestType,
      startTime,
      sessionId,
      ...metadata
    });

    this.logEvent('info', 'request-started', {
      sessionId,
      requestType,
      category: 'request-lifecycle',
      ...metadata
    }, correlationId);

    return correlationId;
  }

  /**
   * End request logging
   */
  endRequest(correlationId, status = 'success', results = {}) {
    const metadata = this.requestMetadata.get(correlationId);
    const duration = metadata ? Date.now() - metadata.startTime : 0;

    this.logEvent('info', 'request-completed', {
      status,
      duration,
      category: 'request-lifecycle',
      ...results
    }, correlationId);

    // Cleanup metadata
    if (metadata?.sessionId) {
      this.correlationIds.delete(metadata.sessionId);
    }
    this.requestMetadata.delete(correlationId);
  }

  /**
   * Log business events
   */
  logBusinessEvent(event, data = {}) {
    this.logEvent('info', event, {
      category: 'business-logic',
      ...data
    });
  }

  /**
   * Create child logger with additional context
   */
  createChildLogger(context = {}) {
    return {
      info: (message, data = {}) => this.logEvent('info', message, { ...context, ...data }),
      warn: (message, data = {}) => this.logEvent('warn', message, { ...context, ...data }),
      error: (message, data = {}) => this.logEvent('error', message, { ...context, ...data }),
      debug: (message, data = {}) => this.logEvent('debug', message, { ...context, ...data })
    };
  }

  /**
   * Get logging statistics
   */
  getStats() {
    return {
      activeCorrelations: this.correlationIds.size,
      requestMetadata: this.requestMetadata.size,
      logLevel: this.logger.level,
      serviceName: this.serviceName,
      version: this.version,
      environment: this.environment
    };
  }

  /**
   * Cleanup old correlation data
   */
  cleanup(maxAgeMinutes = 60) {
    const maxAge = maxAgeMinutes * 60 * 1000;
    const now = Date.now();
    
    let cleanedCount = 0;
    
    for (const [correlationId, metadata] of this.requestMetadata.entries()) {
      if (metadata.startTime && (now - metadata.startTime) > maxAge) {
        this.requestMetadata.delete(correlationId);
        cleanedCount++;
        
        // Find and remove correlation ID
        for (const [sessionId, corrId] of this.correlationIds.entries()) {
          if (corrId === correlationId) {
            this.correlationIds.delete(sessionId);
            break;
          }
        }
      }
    }

    if (cleanedCount > 0) {
      this.logEvent('info', 'logger-cleanup', {
        cleanedCorrelations: cleanedCount,
        category: 'maintenance'
      });
    }

    return cleanedCount;
  }

  /**
   * Export logs for analysis
   */
  async exportLogs(startTime, endTime, category = null) {
    // This would typically integrate with log aggregation services
    // For now, we document the interface
    const exportData = {
      startTime,
      endTime,
      category,
      exported: new Date().toISOString(),
      service: this.serviceName
    };

    this.logEvent('info', 'logs-exported', {
      ...exportData,
      category: 'maintenance'
    });

    return exportData;
  }
}