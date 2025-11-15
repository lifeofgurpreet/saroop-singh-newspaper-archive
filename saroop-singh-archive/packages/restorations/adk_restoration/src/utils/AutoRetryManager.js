/**
 * Auto-Retry Manager - Handles automatic retry logic on QC failure
 * Implements parameter adjustment and intelligent retry strategies
 */

import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import winston from 'winston';

export class AutoRetryManager {
  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
          return `[${timestamp}] [AutoRetryManager] ${level}: ${message}`;
        })
      ),
      transports: [new winston.transports.Console()]
    });

    // Load QC thresholds
    this.loadQCThresholds();
    
    // Retry configuration
    this.maxRetries = parseInt(process.env.MAX_AUTO_RETRIES) || 3;
    this.retryHistory = new Map(); // sessionId -> retry attempts
  }

  async loadQCThresholds() {
    try {
      const configPath = path.join(process.cwd(), 'eval', 'qc_thresholds.yaml');
      const yamlContent = await fs.readFile(configPath, 'utf8');
      this.qcThresholds = yaml.load(yamlContent);
      this.logger.info('QC thresholds loaded successfully');
    } catch (error) {
      this.logger.error(`Failed to load QC thresholds: ${error.message}`);
      // Use default thresholds
      this.qcThresholds = this.getDefaultThresholds();
    }
  }

  getDefaultThresholds() {
    return {
      overall_thresholds: {
        minimum_acceptable_score: 70,
        good_quality_threshold: 80,
        excellent_quality_threshold: 90
      },
      retry_conditions: {
        auto_retry: [
          "overall_score between 55-69 AND attempts < 3",
          "defect_removal < 70 AND defects_severe = true",
          "enhancement_quality < 65 AND mode = 'ENHANCE'"
        ]
      },
      retry_strategies: {
        low_preservation: {
          reduce_temperature: 0.1,
          increase_conservation: true,
          reduce_enhancement_steps: 1
        },
        low_defect_removal: {
          increase_defect_focus: true,
          adjust_prompts: "more_specific",
          increase_iterations: 1
        },
        low_naturalness: {
          reduce_temperature: 0.15,
          simplify_enhancements: true,
          focus_on_authenticity: true
        }
      }
    };
  }

  /**
   * Determine if a session should be automatically retried
   */
  shouldAutoRetry(sessionId, validationResult, sessionData) {
    // Check if max retries exceeded
    const retryCount = this.getRetryCount(sessionId);
    if (retryCount >= this.maxRetries) {
      this.logger.info(`Max retries exceeded for session ${sessionId}: ${retryCount}`);
      return { shouldRetry: false, reason: 'max_retries_exceeded' };
    }

    // Check overall score threshold
    const overallScore = validationResult.overallScore;
    const minScore = this.qcThresholds.overall_thresholds.minimum_acceptable_score;

    if (overallScore >= minScore) {
      this.logger.info(`Score acceptable, no retry needed: ${overallScore} >= ${minScore}`);
      return { shouldRetry: false, reason: 'score_acceptable' };
    }

    // Check if score is within retry range
    if (overallScore < 55) {
      this.logger.info(`Score too low for retry: ${overallScore} < 55`);
      return { shouldRetry: false, reason: 'score_too_low' };
    }

    // Check for critical issues that should not be retried
    const criticalIssues = validationResult.issues?.filter(issue => 
      issue.severity === 'critical' || issue.severity === 'blocker'
    ) || [];

    const blockingIssues = ['face_distortion', 'historical_inaccuracy', 'complete_loss_of_detail'];
    const hasBlockingIssue = criticalIssues.some(issue => 
      blockingIssues.includes(issue.type)
    );

    if (hasBlockingIssue) {
      this.logger.info(`Blocking issue found, no retry: ${criticalIssues.map(i => i.type).join(', ')}`);
      return { shouldRetry: false, reason: 'blocking_issue', issues: criticalIssues };
    }

    // Check specific retry conditions
    const mode = sessionData.mode || 'RESTORE';
    const retryReasons = this.identifyRetryReasons(validationResult, sessionData, mode);

    if (retryReasons.length === 0) {
      this.logger.info(`No specific retry conditions met for session ${sessionId}`);
      return { shouldRetry: false, reason: 'no_retry_conditions' };
    }

    this.logger.info(`Auto-retry recommended for session ${sessionId}: ${retryReasons.join(', ')}`);
    return { 
      shouldRetry: true, 
      reasons: retryReasons,
      currentAttempt: retryCount,
      maxAttempts: this.maxRetries
    };
  }

  /**
   * Identify specific reasons for retry
   */
  identifyRetryReasons(validationResult, sessionData, mode) {
    const reasons = [];
    const criteria = validationResult.criteria || {};

    // Low preservation score
    if (criteria.preservationOfOriginal?.score < 80) {
      reasons.push('low_preservation');
    }

    // Low defect removal (especially if severe defects were detected)
    if (criteria.defectRemoval?.score < 70) {
      const hasSevereDefects = sessionData.analysis?.defects?.some(d => 
        d.severity === 'severe' || d.severity === 'critical'
      );
      if (hasSevereDefects) {
        reasons.push('low_defect_removal');
      }
    }

    // Low naturalness score
    if (criteria.naturalness?.score < 75) {
      reasons.push('low_naturalness');
    }

    // Mode-specific conditions
    if (mode === 'ENHANCE' && criteria.enhancementQuality?.score < 65) {
      reasons.push('low_enhancement_quality');
    }

    if (mode === 'RESTORE' && criteria.preservationOfOriginal?.score < 85) {
      reasons.push('insufficient_preservation');
    }

    return reasons;
  }

  /**
   * Generate adjusted parameters for retry
   */
  generateRetryParameters(sessionId, validationResult, originalPlan, retryReasons) {
    const retryCount = this.getRetryCount(sessionId);
    const adjustments = {
      parameterChanges: [],
      planModifications: [],
      strategicChanges: [],
      metadata: {
        retryAttempt: retryCount + 1,
        originalScore: validationResult.overallScore,
        retryReasons: retryReasons,
        adjustmentStrategy: 'adaptive'
      }
    };

    this.logger.info(`Generating retry parameters for attempt ${retryCount + 1}: ${retryReasons.join(', ')}`);

    // Apply reason-specific adjustments
    for (const reason of retryReasons) {
      this.applyReasonSpecificAdjustments(reason, adjustments, originalPlan, retryCount);
    }

    // Apply general retry adjustments
    this.applyGeneralRetryAdjustments(adjustments, retryCount, validationResult);

    return adjustments;
  }

  applyReasonSpecificAdjustments(reason, adjustments, originalPlan, retryCount) {
    const strategies = this.qcThresholds.retry_strategies;

    switch (reason) {
      case 'low_preservation':
        if (strategies.low_preservation) {
          adjustments.parameterChanges.push({
            parameter: 'temperature',
            change: 'reduce',
            value: strategies.low_preservation.reduce_temperature,
            reason: 'Reduce creative freedom to preserve original character'
          });

          adjustments.strategicChanges.push({
            change: 'increase_conservation',
            value: true,
            reason: 'Focus on conservative restoration approach'
          });

          if (originalPlan.steps.length > 5) {
            adjustments.planModifications.push({
              change: 'reduce_enhancement_steps',
              value: 1,
              reason: 'Simplify plan to reduce risk of over-processing'
            });
          }
        }
        break;

      case 'low_defect_removal':
        adjustments.strategicChanges.push({
          change: 'increase_defect_focus',
          value: true,
          reason: 'Prioritize defect removal over enhancement'
        });

        adjustments.planModifications.push({
          change: 'adjust_prompts',
          value: 'more_specific',
          reason: 'Use more specific defect-targeting prompts'
        });

        if (retryCount < 2) {
          adjustments.planModifications.push({
            change: 'increase_iterations',
            value: 1,
            reason: 'Add extra defect removal pass'
          });
        }
        break;

      case 'low_naturalness':
        adjustments.parameterChanges.push({
          parameter: 'temperature',
          change: 'reduce',
          value: strategies.low_naturalness?.reduce_temperature || 0.15,
          reason: 'Reduce artificial-looking enhancements'
        });

        adjustments.strategicChanges.push({
          change: 'simplify_enhancements',
          value: true,
          reason: 'Use more subtle enhancement techniques'
        });

        adjustments.strategicChanges.push({
          change: 'focus_on_authenticity',
          value: true,
          reason: 'Prioritize historical authenticity'
        });
        break;

      case 'low_enhancement_quality':
        adjustments.parameterChanges.push({
          parameter: 'temperature',
          change: 'increase',
          value: 0.1,
          reason: 'Allow slightly more creative enhancement'
        });

        adjustments.planModifications.push({
          change: 'refine_enhancement_steps',
          value: true,
          reason: 'Focus on quality improvement techniques'
        });
        break;
    }
  }

  applyGeneralRetryAdjustments(adjustments, retryCount, validationResult) {
    // Progressive adjustments based on retry count
    if (retryCount === 0) {
      // First retry: minor adjustments
      adjustments.strategicChanges.push({
        change: 'moderate_adjustment',
        value: true,
        reason: 'First retry with moderate parameter changes'
      });
    } else if (retryCount === 1) {
      // Second retry: more significant changes
      adjustments.strategicChanges.push({
        change: 'significant_adjustment', 
        value: true,
        reason: 'Second retry with more aggressive changes'
      });

      // Reduce complexity
      adjustments.planModifications.push({
        change: 'simplify_approach',
        value: true,
        reason: 'Simplify restoration approach for better reliability'
      });
    } else {
      // Final retry: conservative approach
      adjustments.strategicChanges.push({
        change: 'conservative_approach',
        value: true,
        reason: 'Final retry with most conservative settings'
      });

      adjustments.parameterChanges.push({
        parameter: 'temperature',
        change: 'set',
        value: 0.2,
        reason: 'Use very conservative temperature for final attempt'
      });
    }

    // Add jitter to avoid identical results
    const jitter = 0.05 + (Math.random() * 0.1); // 0.05-0.15
    adjustments.parameterChanges.push({
      parameter: 'jitter',
      change: 'add',
      value: jitter,
      reason: 'Add randomness to avoid identical results'
    });
  }

  /**
   * Apply parameter adjustments to a plan
   */
  applyAdjustmentsToPlan(originalPlan, adjustments) {
    const adjustedPlan = JSON.parse(JSON.stringify(originalPlan)); // Deep clone
    
    // Apply parameter changes
    for (const change of adjustments.parameterChanges) {
      this.applyParameterChange(adjustedPlan, change);
    }

    // Apply plan modifications  
    for (const modification of adjustments.planModifications) {
      this.applyPlanModification(adjustedPlan, modification);
    }

    // Apply strategic changes
    for (const strategicChange of adjustments.strategicChanges) {
      this.applyStrategicChange(adjustedPlan, strategicChange);
    }

    // Add retry metadata
    adjustedPlan.metadata = adjustedPlan.metadata || {};
    adjustedPlan.metadata.retryInfo = adjustments.metadata;

    this.logger.info(`Plan adjusted for retry: ${adjustments.parameterChanges.length} parameter changes, ${adjustments.planModifications.length} plan modifications`);

    return adjustedPlan;
  }

  applyParameterChange(plan, change) {
    for (const step of plan.steps) {
      if (change.parameter === 'temperature') {
        switch (change.change) {
          case 'reduce':
            step.temperature = Math.max(0.1, step.temperature - change.value);
            break;
          case 'increase':
            step.temperature = Math.min(0.9, step.temperature + change.value);
            break;
          case 'set':
            step.temperature = change.value;
            break;
        }
      } else if (change.parameter === 'jitter') {
        step.temperature += (Math.random() - 0.5) * change.value;
        step.temperature = Math.max(0.1, Math.min(0.9, step.temperature));
      }
    }
  }

  applyPlanModification(plan, modification) {
    switch (modification.change) {
      case 'reduce_enhancement_steps':
        // Remove least critical enhancement steps
        const nonCriticalActions = ['creative_enhancement', 'colorize'];
        plan.steps = plan.steps.filter(step => 
          !nonCriticalActions.includes(step.action) || Math.random() > 0.5
        );
        break;

      case 'adjust_prompts':
        if (modification.value === 'more_specific') {
          for (const step of plan.steps) {
            if (step.action === 'remove_defects') {
              step.prompt = step.prompt.replace(
                'carefully remove defects',
                'precisely and methodically remove all visible defects'
              );
            }
          }
        }
        break;

      case 'increase_iterations':
        // Duplicate defect removal steps
        const defectSteps = plan.steps.filter(step => step.action === 'remove_defects');
        for (const defectStep of defectSteps) {
          const duplicateStep = { ...defectStep };
          duplicateStep.stepNumber = plan.steps.length + 1;
          duplicateStep.prompt += ' (additional pass)';
          plan.steps.push(duplicateStep);
        }
        break;
    }
  }

  applyStrategicChange(plan, strategicChange) {
    plan.metadata = plan.metadata || {};
    plan.metadata.strategicChanges = plan.metadata.strategicChanges || [];
    plan.metadata.strategicChanges.push(strategicChange);

    // Apply strategic logic
    if (strategicChange.change === 'increase_conservation') {
      plan.strategy = 'minimal_restoration';
      plan.riskLevel = 'low';
    } else if (strategicChange.change === 'simplify_approach') {
      // Prioritize basic operations
      const basicActions = ['remove_defects', 'adjust_brightness', 'adjust_contrast'];
      plan.steps = plan.steps.filter(step => basicActions.includes(step.action));
    }
  }

  /**
   * Track retry attempts for a session
   */
  incrementRetryCount(sessionId) {
    const current = this.retryHistory.get(sessionId) || 0;
    this.retryHistory.set(sessionId, current + 1);
    return current + 1;
  }

  getRetryCount(sessionId) {
    return this.retryHistory.get(sessionId) || 0;
  }

  /**
   * Clean up retry history for old sessions
   */
  cleanupRetryHistory(maxAgeHours = 24) {
    // In a real implementation, we'd track timestamps
    // For now, we'll just clear if too many entries
    if (this.retryHistory.size > 1000) {
      this.logger.info('Cleaning up retry history');
      this.retryHistory.clear();
    }
  }

  /**
   * Get retry statistics
   */
  getRetryStatistics() {
    const stats = {
      totalSessions: this.retryHistory.size,
      totalRetries: 0,
      averageRetries: 0,
      successfulRetries: 0,
      failedRetries: 0
    };

    for (const retryCount of this.retryHistory.values()) {
      stats.totalRetries += retryCount;
    }

    if (stats.totalSessions > 0) {
      stats.averageRetries = (stats.totalRetries / stats.totalSessions).toFixed(2);
    }

    return stats;
  }
}