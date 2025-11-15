/**
 * Enhanced Rate Limiter with Jitter
 * Implements sophisticated rate limiting for API calls with adaptive delays
 */

import winston from 'winston';

export class RateLimiter {
  constructor(options = {}) {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
          return `[${timestamp}] [RateLimiter] ${level}: ${message}`;
        })
      ),
      transports: [new winston.transports.Console()]
    });

    // Configuration
    this.baseDelayMs = options.baseDelayMs || parseInt(process.env.RATE_LIMIT_DELAY_MS) || 1000;
    this.maxDelayMs = options.maxDelayMs || 30000;
    this.jitterPercent = options.jitterPercent || 0.25; // 25% jitter by default
    this.backoffMultiplier = options.backoffMultiplier || 1.5;
    this.maxRetries = options.maxRetries || 3;
    
    // Adaptive rate limiting
    this.enableAdaptive = options.enableAdaptive !== false;
    this.successWindow = options.successWindow || 10; // Track last 10 requests
    this.errorThreshold = options.errorThreshold || 0.3; // 30% error rate triggers slowdown
    
    // Request tracking
    this.requestHistory = [];
    this.currentDelayMs = this.baseDelayMs;
    this.consecutiveErrors = 0;
    this.lastRequestTime = 0;
    
    // API-specific limits
    this.apiLimits = new Map();
    this.setupDefaultApiLimits();
  }

  setupDefaultApiLimits() {
    // Gemini API limits
    this.apiLimits.set('gemini', {
      requestsPerMinute: 60,
      requestsPerHour: 1500,
      requestsPerDay: 50000,
      windowMs: 60000, // 1 minute
      requestHistory: [],
      currentDelay: 1000
    });

    // Files API limits (more conservative)
    this.apiLimits.set('files', {
      requestsPerMinute: 30,
      requestsPerHour: 500,
      requestsPerDay: 10000,
      windowMs: 60000,
      requestHistory: [],
      currentDelay: 2000
    });

    // Batch API limits
    this.apiLimits.set('batch', {
      requestsPerMinute: 5,
      requestsPerHour: 100,
      requestsPerDay: 1000,
      windowMs: 60000,
      requestHistory: [],
      currentDelay: 10000
    });
  }

  /**
   * Wait with intelligent rate limiting and jitter
   */
  async waitWithRateLimit(apiType = 'gemini', context = {}) {
    const startTime = Date.now();
    
    try {
      // Check API-specific limits
      const delayFromApiLimits = await this.checkApiLimits(apiType);
      
      // Calculate adaptive delay
      const adaptiveDelay = this.calculateAdaptiveDelay();
      
      // Apply jitter
      const baseDelay = Math.max(delayFromApiLimits, adaptiveDelay);
      const jitteredDelay = this.applyJitter(baseDelay);
      
      // Ensure minimum time between requests
      const timeSinceLastRequest = Date.now() - this.lastRequestTime;
      const minimumInterval = this.getMinimumInterval(apiType);
      const intervalDelay = Math.max(0, minimumInterval - timeSinceLastRequest);
      
      const totalDelay = Math.max(jitteredDelay, intervalDelay);
      
      if (totalDelay > 0) {
        this.logger.debug(`Rate limiting: waiting ${totalDelay}ms for ${apiType} (base: ${baseDelay}ms, jitter: ${jitteredDelay - baseDelay}ms)`);
        await this.sleep(totalDelay);
      }
      
      this.lastRequestTime = Date.now();
      
      return {
        delayApplied: totalDelay,
        reason: totalDelay > 0 ? 'rate_limit' : 'no_delay',
        apiType: apiType,
        adaptiveDelay: adaptiveDelay,
        jitter: jitteredDelay - baseDelay
      };
      
    } catch (error) {
      this.logger.error(`Rate limiting failed: ${error.message}`);
      // Apply conservative delay on error
      await this.sleep(this.baseDelayMs);
      throw error;
    }
  }

  /**
   * Check API-specific rate limits
   */
  async checkApiLimits(apiType) {
    const limits = this.apiLimits.get(apiType);
    if (!limits) {
      this.logger.warn(`Unknown API type: ${apiType}, using default limits`);
      return this.currentDelayMs;
    }

    const now = Date.now();
    const windowStart = now - limits.windowMs;
    
    // Clean old requests from history
    limits.requestHistory = limits.requestHistory.filter(time => time > windowStart);
    
    // Check if we're at the limit
    if (limits.requestHistory.length >= limits.requestsPerMinute) {
      const oldestRequest = Math.min(...limits.requestHistory);
      const waitTime = limits.windowMs - (now - oldestRequest);
      
      if (waitTime > 0) {
        this.logger.info(`API rate limit reached for ${apiType}, waiting ${waitTime}ms`);
        return waitTime;
      }
    }
    
    // Record this request
    limits.requestHistory.push(now);
    
    return limits.currentDelay;
  }

  /**
   * Calculate adaptive delay based on recent success/error rates
   */
  calculateAdaptiveDelay() {
    if (!this.enableAdaptive) {
      return this.currentDelayMs;
    }

    // Clean old history (keep last hour)
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    this.requestHistory = this.requestHistory.filter(req => req.timestamp > oneHourAgo);

    if (this.requestHistory.length < 5) {
      return this.currentDelayMs; // Not enough data
    }

    // Calculate recent error rate
    const recentRequests = this.requestHistory.slice(-this.successWindow);
    const errorCount = recentRequests.filter(req => req.success === false).length;
    const errorRate = errorCount / recentRequests.length;

    if (errorRate > this.errorThreshold) {
      // High error rate - increase delay
      this.currentDelayMs = Math.min(
        this.currentDelayMs * this.backoffMultiplier,
        this.maxDelayMs
      );
      this.logger.info(`High error rate detected (${(errorRate * 100).toFixed(1)}%), increasing delay to ${this.currentDelayMs}ms`);
      
    } else if (errorRate < 0.1 && this.currentDelayMs > this.baseDelayMs) {
      // Low error rate - decrease delay gradually
      this.currentDelayMs = Math.max(
        this.currentDelayMs / 1.1,
        this.baseDelayMs
      );
      this.logger.debug(`Low error rate, reducing delay to ${this.currentDelayMs}ms`);
    }

    return Math.round(this.currentDelayMs);
  }

  /**
   * Apply jitter to delay to avoid thundering herd
   */
  applyJitter(baseDelay) {
    if (this.jitterPercent <= 0) {
      return baseDelay;
    }

    // Use exponential jitter (AWS-style)
    const jitterAmount = baseDelay * this.jitterPercent;
    const randomJitter = (Math.random() - 0.5) * 2 * jitterAmount;
    
    return Math.max(100, Math.round(baseDelay + randomJitter)); // Minimum 100ms
  }

  /**
   * Get minimum interval between requests for API type
   */
  getMinimumInterval(apiType) {
    const limits = this.apiLimits.get(apiType);
    if (!limits) return 500;
    
    // Calculate minimum interval to stay within rate limits
    return Math.ceil(limits.windowMs / limits.requestsPerMinute);
  }

  /**
   * Record request outcome for adaptive learning
   */
  recordRequest(apiType, success, responseTime, error = null) {
    const requestRecord = {
      timestamp: Date.now(),
      apiType: apiType,
      success: success,
      responseTime: responseTime,
      error: error?.message || null
    };

    this.requestHistory.push(requestRecord);

    // Update consecutive errors counter
    if (success) {
      this.consecutiveErrors = 0;
    } else {
      this.consecutiveErrors++;
      
      // Immediate backoff on consecutive errors
      if (this.consecutiveErrors >= 3) {
        this.currentDelayMs = Math.min(
          this.currentDelayMs * (this.backoffMultiplier ** this.consecutiveErrors),
          this.maxDelayMs
        );
        this.logger.warn(`${this.consecutiveErrors} consecutive errors, increasing delay to ${this.currentDelayMs}ms`);
      }
    }

    // Update API-specific delay
    const limits = this.apiLimits.get(apiType);
    if (limits) {
      if (!success && error) {
        // Check for specific error types
        if (error.message.includes('rate limit') || error.message.includes('quota')) {
          limits.currentDelay = Math.min(limits.currentDelay * 2, 30000);
        } else if (error.message.includes('timeout')) {
          limits.currentDelay = Math.min(limits.currentDelay * 1.5, 20000);
        }
      } else if (success && responseTime < 2000) {
        // Fast successful response - can reduce delay slightly
        limits.currentDelay = Math.max(limits.currentDelay * 0.95, this.baseDelayMs);
      }
    }

    this.logger.debug(`Request recorded: ${apiType}, success: ${success}, time: ${responseTime}ms`);
  }

  /**
   * Execute function with rate limiting and retry logic
   */
  async executeWithRateLimit(fn, apiType = 'gemini', context = {}) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      const startTime = Date.now();
      
      try {
        // Apply rate limiting
        await this.waitWithRateLimit(apiType, { ...context, attempt });
        
        // Execute function
        const result = await fn();
        
        // Record successful request
        const responseTime = Date.now() - startTime;
        this.recordRequest(apiType, true, responseTime);
        
        return result;
        
      } catch (error) {
        lastError = error;
        const responseTime = Date.now() - startTime;
        this.recordRequest(apiType, false, responseTime, error);
        
        this.logger.warn(`Attempt ${attempt}/${this.maxRetries} failed for ${apiType}: ${error.message}`);
        
        if (attempt < this.maxRetries) {
          // Progressive backoff for retries
          const retryDelay = this.calculateRetryDelay(attempt, error);
          this.logger.info(`Retrying in ${retryDelay}ms...`);
          await this.sleep(retryDelay);
        }
      }
    }
    
    this.logger.error(`All ${this.maxRetries} attempts failed for ${apiType}`);
    throw lastError;
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  calculateRetryDelay(attempt, error) {
    // Base retry delay with exponential backoff
    let baseDelay = this.baseDelayMs * Math.pow(2, attempt - 1);
    
    // Add error-specific adjustments
    if (error.message.includes('rate limit')) {
      baseDelay *= 3; // Longer delay for rate limit errors
    } else if (error.message.includes('timeout')) {
      baseDelay *= 2; // Medium delay for timeouts
    }
    
    // Apply jitter and cap
    const jitteredDelay = this.applyJitter(baseDelay);
    return Math.min(jitteredDelay, this.maxDelayMs);
  }

  /**
   * Get current rate limiting status
   */
  getStatus() {
    const recentRequests = this.requestHistory.slice(-this.successWindow);
    const errorCount = recentRequests.filter(req => req.success === false).length;
    
    return {
      currentDelayMs: this.currentDelayMs,
      baseDelayMs: this.baseDelayMs,
      consecutiveErrors: this.consecutiveErrors,
      recentErrorRate: recentRequests.length > 0 ? errorCount / recentRequests.length : 0,
      totalRequests: this.requestHistory.length,
      apiLimits: Object.fromEntries(
        Array.from(this.apiLimits.entries()).map(([api, limits]) => [
          api,
          {
            currentDelay: limits.currentDelay,
            recentRequests: limits.requestHistory.length,
            requestsPerMinute: limits.requestsPerMinute
          }
        ])
      )
    };
  }

  /**
   * Reset rate limiting state
   */
  reset() {
    this.currentDelayMs = this.baseDelayMs;
    this.consecutiveErrors = 0;
    this.requestHistory = [];
    this.lastRequestTime = 0;
    
    // Reset API-specific limits
    for (const limits of this.apiLimits.values()) {
      limits.requestHistory = [];
      limits.currentDelay = this.baseDelayMs;
    }
    
    this.logger.info('Rate limiter state reset');
  }

  /**
   * Clean up old request history
   */
  cleanup(maxAgeHours = 24) {
    const cutoff = Date.now() - (maxAgeHours * 60 * 60 * 1000);
    
    const originalLength = this.requestHistory.length;
    this.requestHistory = this.requestHistory.filter(req => req.timestamp > cutoff);
    
    // Clean API-specific histories
    for (const limits of this.apiLimits.values()) {
      limits.requestHistory = limits.requestHistory.filter(time => time > cutoff);
    }
    
    const cleanedCount = originalLength - this.requestHistory.length;
    if (cleanedCount > 0) {
      this.logger.debug(`Cleaned up ${cleanedCount} old request records`);
    }
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}