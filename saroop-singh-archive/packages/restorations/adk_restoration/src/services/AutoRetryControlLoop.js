/**
 * Auto-Retry Control Loop - QC-driven retry system with intelligent parameter adjustments
 * Integrates with QC Decision Engine and Job State Machine for automated quality control
 */

export class AutoRetryControlLoop {
  constructor(qcDecisionEngine, jobStateMachine, structuredLogger) {
    this.qcEngine = qcDecisionEngine;
    this.stateMachine = jobStateMachine;
    this.logger = structuredLogger;
    
    this.retryHistory = new Map(); // jobId -> retryAttempts[]
    this.circuitBreakers = new Map(); // service -> circuit breaker state
    this.rateLimiters = new Map(); // service -> rate limiter
    
    // Configuration
    this.maxRetryAttempts = 3;
    this.retryDelayMs = 2000;
    this.circuitBreakerThreshold = 5; // failures before opening circuit
    this.circuitBreakerTimeout = 60000; // 1 minute
  }

  /**
   * Main retry control loop - evaluates and executes retries
   */
  async processRetryDecision(jobId, validationResults, context = {}) {
    try {
      const correlationId = this.logger.startRequest(context.sessionId, 'retry-evaluation');
      
      // Get QC decision
      const qcDecision = await this.qcEngine.decide(context.sessionId, validationResults, context);
      
      this.logger.logQCDecision(jobId, context.sessionId, qcDecision, validationResults);
      
      // Handle retry decision
      if (qcDecision.shouldRetry) {
        return await this.executeRetry(jobId, qcDecision, context, correlationId);
      } else {
        return await this.handleNonRetryDecision(jobId, qcDecision, context, correlationId);
      }
      
    } catch (error) {
      this.logger.logError(error, { jobId, context: 'retry-control-loop' });
      return {
        action: 'MANUAL_REVIEW',
        reason: 'Retry system error',
        error: error.message
      };
    }
  }

  /**
   * Execute retry with parameter adjustments
   */
  async executeRetry(jobId, qcDecision, context, correlationId) {
    try {
      // Check circuit breaker
      if (this.isCircuitOpen('retry-system')) {
        this.logger.logEvent('warn', 'circuit-breaker-open', {
          service: 'retry-system',
          jobId
        });
        
        return {
          action: 'MANUAL_REVIEW',
          reason: 'Circuit breaker open - too many retry failures'
        };
      }

      // Check rate limits
      if (!this.checkRateLimit('retry-execution', jobId)) {
        this.logger.logEvent('warn', 'rate-limit-exceeded', {
          service: 'retry-execution',
          jobId
        });
        
        return {
          action: 'DELAY_RETRY',
          reason: 'Rate limit exceeded',
          delayMs: this.retryDelayMs * 2
        };
      }

      const retryCount = this.getRetryCount(jobId);
      const retryAttempt = {
        attemptNumber: retryCount + 1,
        timestamp: new Date().toISOString(),
        previousQualityScore: qcDecision.qualityScore,
        adjustments: qcDecision.retryAdjustments || {},
        reason: qcDecision.reason
      };

      // Store retry attempt
      this.recordRetryAttempt(jobId, retryAttempt);

      this.logger.logEvent('info', 'retry-initiated', {
        jobId,
        attemptNumber: retryAttempt.attemptNumber,
        adjustments: retryAttempt.adjustments,
        category: 'retry-control'
      }, correlationId);

      // Apply parameter adjustments
      const adjustedParameters = await this.applyRetryAdjustments(
        context.originalParameters || {},
        qcDecision.retryAdjustments,
        retryAttempt.attemptNumber
      );

      // Update job state for retry
      await this.stateMachine.transitionTo(
        jobId, 
        'QUEUED', 
        `Retry attempt ${retryAttempt.attemptNumber}: ${qcDecision.reason}`,
        {
          retryAttempt: retryAttempt.attemptNumber,
          adjustedParameters,
          previousScore: qcDecision.qualityScore
        }
      );

      return {
        action: 'RETRY_INITIATED',
        attemptNumber: retryAttempt.attemptNumber,
        adjustedParameters,
        reason: qcDecision.reason,
        correlationId
      };

    } catch (error) {
      this.recordCircuitBreakerFailure('retry-system');
      this.logger.logError(error, { jobId, context: 'retry-execution' });
      
      return {
        action: 'RETRY_FAILED',
        reason: 'Retry execution error',
        error: error.message
      };
    }
  }

  /**
   * Handle non-retry QC decisions
   */
  async handleNonRetryDecision(jobId, qcDecision, context, correlationId) {
    this.logger.logEvent('info', 'retry-decision-final', {
      jobId,
      decision: qcDecision.action,
      reason: qcDecision.reason,
      category: 'retry-control'
    }, correlationId);

    switch (qcDecision.action) {
      case 'APPROVE':
      case 'APPROVE_WITH_NOTES':
        await this.stateMachine.transitionTo(jobId, 'COMPLETED', qcDecision.reason);
        break;
        
      case 'MANUAL_REVIEW':
        await this.stateMachine.transitionTo(jobId, 'MANUAL_REVIEW', qcDecision.reason);
        break;
        
      case 'REJECT':
        await this.stateMachine.transitionTo(jobId, 'FAILED', qcDecision.reason);
        break;
    }

    return {
      action: qcDecision.action,
      reason: qcDecision.reason,
      correlationId
    };
  }

  /**
   * Apply parameter adjustments for retry attempt
   */
  async applyRetryAdjustments(originalParameters, adjustments, attemptNumber) {
    const adjusted = { ...originalParameters };

    // Temperature adjustments
    if (adjustments.temperature_delta) {
      adjusted.temperature = Math.max(
        0.1, 
        (originalParameters.temperature || 0.5) + adjustments.temperature_delta
      );
    }

    // Step modifications
    if (adjustments.steps_modification) {
      switch (adjustments.steps_modification) {
        case 'remove_risky':
          adjusted.steps = this.removeRiskySteps(originalParameters.steps || []);
          break;
          
        case 'simplify_approach':
          adjusted.steps = this.simplifySteps(originalParameters.steps || []);
          break;
          
        case 'basic_restoration_only':
          adjusted.steps = this.getBasicRestorationSteps();
          break;
      }
    }

    // Focus area adjustments
    if (adjustments.focus_areas && adjustments.focus_areas.length > 0) {
      adjusted.focusAreas = adjustments.focus_areas;
      adjusted.enhancePrimaryFocus = true;
    }

    // Attempt-specific adjustments
    adjusted.retryAttempt = attemptNumber;
    adjusted.conservative = attemptNumber > 1; // More conservative on later attempts
    adjusted.maxSteps = Math.max(3, (originalParameters.maxSteps || 8) - attemptNumber);

    this.logger.logEvent('debug', 'parameters-adjusted', {
      original: originalParameters,
      adjusted,
      adjustments,
      attemptNumber,
      category: 'parameter-adjustment'
    });

    return adjusted;
  }

  /**
   * Remove risky restoration steps
   */
  removeRiskySteps(steps) {
    const riskyStepTypes = ['creative_enhancement', 'colorize', 'reconstruct_missing'];
    return steps.filter(step => !riskyStepTypes.includes(step.type));
  }

  /**
   * Simplify restoration steps
   */
  simplifySteps(steps) {
    // Keep only essential steps
    const essentialTypes = ['defect_removal', 'enhance_sharpness', 'adjust_brightness', 'adjust_contrast'];
    return steps.filter(step => essentialTypes.includes(step.type));
  }

  /**
   * Get basic restoration steps for conservative retry
   */
  getBasicRestorationSteps() {
    return [
      { type: 'defect_removal', priority: 1 },
      { type: 'enhance_sharpness', priority: 2 },
      { type: 'adjust_brightness', priority: 3 }
    ];
  }

  /**
   * Record retry attempt in history
   */
  recordRetryAttempt(jobId, retryAttempt) {
    if (!this.retryHistory.has(jobId)) {
      this.retryHistory.set(jobId, []);
    }
    
    this.retryHistory.get(jobId).push(retryAttempt);
  }

  /**
   * Get retry count for job
   */
  getRetryCount(jobId) {
    const history = this.retryHistory.get(jobId);
    return history ? history.length : 0;
  }

  /**
   * Get retry history for job
   */
  getRetryHistory(jobId) {
    return this.retryHistory.get(jobId) || [];
  }

  /**
   * Circuit breaker implementation
   */
  isCircuitOpen(service) {
    const breaker = this.circuitBreakers.get(service);
    if (!breaker) {
      return false;
    }

    // Check if timeout has passed
    if (breaker.openedAt && (Date.now() - breaker.openedAt) > this.circuitBreakerTimeout) {
      // Move to half-open state
      breaker.state = 'half-open';
      breaker.failures = 0;
      this.logger.logEvent('info', 'circuit-breaker-half-open', { service });
    }

    return breaker.state === 'open';
  }

  /**
   * Record circuit breaker failure
   */
  recordCircuitBreakerFailure(service) {
    if (!this.circuitBreakers.has(service)) {
      this.circuitBreakers.set(service, {
        failures: 0,
        state: 'closed',
        openedAt: null
      });
    }

    const breaker = this.circuitBreakers.get(service);
    breaker.failures++;

    if (breaker.failures >= this.circuitBreakerThreshold) {
      breaker.state = 'open';
      breaker.openedAt = Date.now();
      
      this.logger.logEvent('warn', 'circuit-breaker-opened', {
        service,
        failures: breaker.failures,
        category: 'circuit-breaker'
      });
    }
  }

  /**
   * Record circuit breaker success
   */
  recordCircuitBreakerSuccess(service) {
    const breaker = this.circuitBreakers.get(service);
    if (breaker) {
      if (breaker.state === 'half-open') {
        // Close the circuit
        breaker.state = 'closed';
        breaker.failures = 0;
        breaker.openedAt = null;
        
        this.logger.logEvent('info', 'circuit-breaker-closed', { service });
      }
    }
  }

  /**
   * Rate limiting implementation
   */
  checkRateLimit(service, key) {
    const rateLimitKey = `${service}:${key}`;
    
    if (!this.rateLimiters.has(rateLimitKey)) {
      this.rateLimiters.set(rateLimitKey, {
        count: 0,
        resetTime: Date.now() + 60000 // 1 minute window
      });
    }

    const limiter = this.rateLimiters.get(rateLimitKey);
    
    // Reset if window has passed
    if (Date.now() > limiter.resetTime) {
      limiter.count = 0;
      limiter.resetTime = Date.now() + 60000;
    }

    // Check limit (max 5 retries per minute per job)
    if (limiter.count >= 5) {
      return false;
    }

    limiter.count++;
    return true;
  }

  /**
   * Get retry statistics
   */
  getRetryStatistics() {
    const stats = {
      totalJobs: this.retryHistory.size,
      totalRetries: 0,
      jobsWithRetries: 0,
      averageRetryCount: 0,
      maxRetryCount: 0,
      circuitBreakerStates: {},
      retryReasons: {}
    };

    let totalRetries = 0;
    let maxRetries = 0;

    for (const [jobId, attempts] of this.retryHistory.entries()) {
      const retryCount = attempts.length;
      totalRetries += retryCount;
      
      if (retryCount > 0) {
        stats.jobsWithRetries++;
        maxRetries = Math.max(maxRetries, retryCount);
      }

      // Count retry reasons
      attempts.forEach(attempt => {
        const reason = attempt.reason || 'unknown';
        stats.retryReasons[reason] = (stats.retryReasons[reason] || 0) + 1;
      });
    }

    stats.totalRetries = totalRetries;
    stats.maxRetryCount = maxRetries;
    stats.averageRetryCount = stats.totalJobs > 0 ? 
      Math.round((totalRetries / stats.totalJobs) * 100) / 100 : 0;

    // Circuit breaker states
    for (const [service, breaker] of this.circuitBreakers.entries()) {
      stats.circuitBreakerStates[service] = {
        state: breaker.state,
        failures: breaker.failures,
        openedAt: breaker.openedAt
      };
    }

    return stats;
  }

  /**
   * Cleanup old retry history
   */
  cleanupRetryHistory(maxAgeHours = 24) {
    const maxAge = maxAgeHours * 60 * 60 * 1000;
    const now = Date.now();
    let cleanedCount = 0;

    for (const [jobId, attempts] of this.retryHistory.entries()) {
      const lastAttempt = attempts[attempts.length - 1];
      const age = now - new Date(lastAttempt.timestamp).getTime();
      
      if (age > maxAge) {
        this.retryHistory.delete(jobId);
        cleanedCount++;
      }
    }

    // Clean up rate limiters
    for (const [key, limiter] of this.rateLimiters.entries()) {
      if (now > limiter.resetTime + 60000) { // 1 minute past reset
        this.rateLimiters.delete(key);
      }
    }

    if (cleanedCount > 0) {
      this.logger.logEvent('info', 'retry-history-cleanup', {
        cleanedJobs: cleanedCount,
        category: 'maintenance'
      });
    }

    return cleanedCount;
  }

  /**
   * Reset circuit breaker (manual intervention)
   */
  resetCircuitBreaker(service) {
    if (this.circuitBreakers.has(service)) {
      this.circuitBreakers.get(service).state = 'closed';
      this.circuitBreakers.get(service).failures = 0;
      this.circuitBreakers.get(service).openedAt = null;
      
      this.logger.logEvent('info', 'circuit-breaker-reset', {
        service,
        category: 'manual-intervention'
      });
    }
  }

  /**
   * Manual retry trigger (bypass normal QC flow)
   */
  async manualRetry(jobId, reason = 'Manual retry requested', adjustments = {}) {
    try {
      const retryAttempt = {
        attemptNumber: this.getRetryCount(jobId) + 1,
        timestamp: new Date().toISOString(),
        reason,
        adjustments,
        manual: true
      };

      this.recordRetryAttempt(jobId, retryAttempt);

      await this.stateMachine.transitionTo(
        jobId,
        'QUEUED',
        `Manual retry: ${reason}`,
        { 
          retryAttempt: retryAttempt.attemptNumber,
          adjustedParameters: adjustments,
          manual: true
        }
      );

      this.logger.logEvent('info', 'manual-retry-initiated', {
        jobId,
        reason,
        attemptNumber: retryAttempt.attemptNumber,
        category: 'manual-intervention'
      });

      return retryAttempt;

    } catch (error) {
      this.logger.logError(error, { jobId, context: 'manual-retry' });
      throw error;
    }
  }
}