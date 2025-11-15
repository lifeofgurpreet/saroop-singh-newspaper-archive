/**
 * QC Decision Engine - Makes quality control decisions based on thresholds
 * Implements auto-retry, approval, and rejection logic
 */

import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';

export class QCDecisionEngine {
  constructor() {
    this.thresholds = null;
    this.decisionHistory = new Map(); // sessionId -> decisions[]
    this.configPath = path.join(process.cwd(), 'config', 'qc_thresholds.yaml');
  }

  /**
   * Load QC thresholds configuration
   */
  async loadThresholds() {
    try {
      if (this.thresholds) {
        return this.thresholds; // Already loaded
      }

      const configContent = await fs.readFile(this.configPath, 'utf8');
      this.thresholds = yaml.load(configContent);
      
      console.log('QC thresholds loaded successfully');
      return this.thresholds;
      
    } catch (error) {
      console.error('Failed to load QC thresholds:', error);
      
      // Fallback to default thresholds
      this.thresholds = this.getDefaultThresholds();
      console.warn('Using default QC thresholds');
      
      return this.thresholds;
    }
  }

  /**
   * Get default thresholds if config file is not available
   */
  getDefaultThresholds() {
    return {
      quality_gates: {
        minimum_thresholds: {
          overall_score: 65,
          preservation: 70,
          defect_removal: 60,
          enhancement: 55,
          naturalness: 65,
          technical_quality: 60
        },
        target_thresholds: {
          overall_score: 80,
          preservation: 85,
          defect_removal: 80,
          enhancement: 75,
          naturalness: 80,
          technical_quality: 75
        }
      },
      qc_decisions: {
        auto_approve: {
          conditions: {
            overall_score: { min: 80 },
            preservation: { min: 75 },
            critical_failures: { max: 0 }
          },
          action: "APPROVE",
          confidence: "high"
        },
        auto_retry: {
          conditions: {
            overall_score: { min: 40, max: 64 },
            preservation: { min: 50 },
            critical_failures: { max: 2 },
            retry_count: { max: 2 }
          },
          action: "RETRY",
          confidence: "low"
        },
        auto_reject: {
          conditions: {
            overall_score: { max: 29 },
            preservation: { max: 39 },
            critical_failures: { min: 4 }
          },
          action: "REJECT",
          confidence: "high"
        }
      },
      retry_policies: {
        max_attempts: 3,
        parameter_adjustments: {
          attempt_1: { temperature_delta: -0.1 },
          attempt_2: { temperature_delta: -0.2 },
          attempt_3: { temperature_delta: -0.3 }
        }
      }
    };
  }

  /**
   * Make QC decision based on validation results and context
   */
  async decide(sessionId, validationResults, context = {}) {
    try {
      await this.loadThresholds();
      
      const decision = await this.evaluateQualityGates(validationResults, context);
      
      // Store decision history
      if (!this.decisionHistory.has(sessionId)) {
        this.decisionHistory.set(sessionId, []);
      }
      
      decision.timestamp = new Date().toISOString();
      decision.sessionId = sessionId;
      this.decisionHistory.get(sessionId).push(decision);
      
      console.log(`QC Decision for ${sessionId}: ${decision.action} (confidence: ${decision.confidence})`);
      
      return decision;
      
    } catch (error) {
      console.error('QC decision failed:', error);
      
      // Fallback to manual review on error
      return {
        action: 'MANUAL_REVIEW',
        confidence: 'low',
        reason: `QC system error: ${error.message}`,
        shouldRetry: false,
        requiresManualReview: true,
        error: error.message
      };
    }
  }

  /**
   * Evaluate quality gates and determine appropriate action
   */
  async evaluateQualityGates(validationResults, context) {
    const scores = this.extractScores(validationResults);
    const criticalFailures = this.identifyCriticalFailures(validationResults, context);
    const retryCount = context.retryCount || 0;

    // Check each decision rule in priority order
    const decisions = this.thresholds.qc_decisions;

    // Auto-approve check
    if (this.evaluateConditions(decisions.auto_approve.conditions, scores, criticalFailures, retryCount)) {
      return {
        action: 'APPROVE',
        confidence: 'high',
        reason: 'Quality scores meet auto-approval thresholds',
        shouldRetry: false,
        qualityScore: scores.overall_score,
        scores: scores,
        criticalFailures: criticalFailures
      };
    }

    // Conditional approve check
    if (decisions.conditional_approve && 
        this.evaluateConditions(decisions.conditional_approve.conditions, scores, criticalFailures, retryCount)) {
      return {
        action: 'APPROVE_WITH_NOTES',
        confidence: 'medium',
        reason: 'Quality acceptable with minor issues',
        shouldRetry: false,
        qualityScore: scores.overall_score,
        scores: scores,
        criticalFailures: criticalFailures,
        notes: 'Approved with quality concerns noted'
      };
    }

    // Auto-retry check
    if (this.evaluateConditions(decisions.auto_retry.conditions, scores, criticalFailures, retryCount)) {
      const adjustments = this.generateRetryAdjustments(retryCount + 1, validationResults);
      
      return {
        action: 'RETRY',
        confidence: 'medium',
        reason: 'Quality below threshold but retryable',
        shouldRetry: true,
        retryAdjustments: adjustments,
        qualityScore: scores.overall_score,
        scores: scores,
        criticalFailures: criticalFailures
      };
    }

    // Manual review check
    if (decisions.manual_review && 
        this.evaluateConditions(decisions.manual_review.conditions, scores, criticalFailures, retryCount)) {
      return {
        action: 'MANUAL_REVIEW',
        confidence: 'low',
        reason: 'Quality issues require manual review',
        shouldRetry: false,
        requiresManualReview: true,
        qualityScore: scores.overall_score,
        scores: scores,
        criticalFailures: criticalFailures
      };
    }

    // Auto-reject check (last resort)
    if (this.evaluateConditions(decisions.auto_reject.conditions, scores, criticalFailures, retryCount)) {
      return {
        action: 'REJECT',
        confidence: 'high',
        reason: 'Quality too poor for restoration',
        shouldRetry: false,
        qualityScore: scores.overall_score,
        scores: scores,
        criticalFailures: criticalFailures
      };
    }

    // Default to manual review if no rules match
    return {
      action: 'MANUAL_REVIEW',
      confidence: 'low',
      reason: 'No decision rules matched - manual review required',
      shouldRetry: false,
      requiresManualReview: true,
      qualityScore: scores.overall_score,
      scores: scores,
      criticalFailures: criticalFailures
    };
  }

  /**
   * Extract numerical scores from validation results
   * Updated to match ValidatorAgent output format
   */
  extractScores(validationResults) {
    // Handle nested criteria structure from ValidatorAgent
    const criteria = validationResults.criteria || validationResults;
    
    return {
      overall_score: validationResults.overallScore || validationResults.qualityScore || 0,
      preservation: criteria.preservationOfOriginal || validationResults.preservationScore || validationResults.preservation || 0,
      defect_removal: criteria.defectRemovalEffectiveness || validationResults.defectRemovalScore || validationResults.defectRemoval || 0,
      enhancement: criteria.enhancementQuality || validationResults.enhancementScore || validationResults.enhancement || 0,
      naturalness: criteria.naturalAppearance || validationResults.naturalnessScore || validationResults.naturalness || 0,
      technical_quality: criteria.technicalQuality || validationResults.technicalScore || validationResults.technicalQuality || 0
    };
  }

  /**
   * Identify critical failures from validation results
   */
  identifyCriticalFailures(validationResults, context) {
    const criticalFailures = [];
    const criticalThresholds = this.thresholds.critical_failures || {};

    // Check for preservation loss
    if (criticalThresholds.preservation_loss) {
      const preservationScore = validationResults.preservationScore || 0;
      if (preservationScore <= (criticalThresholds.preservation_loss.threshold?.preservation_score?.max || 40)) {
        criticalFailures.push({
          type: 'preservation_loss',
          severity: 'high',
          description: 'Significant loss of historical authenticity',
          score: preservationScore
        });
      }
    }

    // Check for face distortion (if portrait)
    if (context.imageType === 'portrait' && criticalThresholds.face_distortion) {
      const faceQuality = validationResults.faceQualityScore || validationResults.naturalness || 0;
      if (faceQuality <= (criticalThresholds.face_distortion.threshold?.face_quality_score?.max || 50)) {
        criticalFailures.push({
          type: 'face_distortion',
          severity: 'critical',
          description: 'Distortion of facial features detected',
          score: faceQuality
        });
      }
    }

    // Check for artifact introduction
    if (criticalThresholds.artifact_introduction) {
      const techQualityDecrease = (context.originalTechnicalScore || 0) - (validationResults.technicalScore || 0);
      if (techQualityDecrease >= (criticalThresholds.artifact_introduction.threshold?.technical_quality?.decrease || 20)) {
        criticalFailures.push({
          type: 'artifact_introduction',
          severity: 'high',
          description: 'New defects or artifacts introduced',
          qualityDecrease: techQualityDecrease
        });
      }
    }

    return criticalFailures;
  }

  /**
   * Evaluate decision conditions against scores and context
   */
  evaluateConditions(conditions, scores, criticalFailures, retryCount) {
    // Check overall score conditions
    if (conditions.overall_score) {
      const score = scores.overall_score;
      if (conditions.overall_score.min !== undefined && score < conditions.overall_score.min) {
        return false;
      }
      if (conditions.overall_score.max !== undefined && score > conditions.overall_score.max) {
        return false;
      }
    }

    // Check preservation conditions
    if (conditions.preservation) {
      const score = scores.preservation;
      if (conditions.preservation.min !== undefined && score < conditions.preservation.min) {
        return false;
      }
      if (conditions.preservation.max !== undefined && score > conditions.preservation.max) {
        return false;
      }
    }

    // Check critical failures conditions
    if (conditions.critical_failures) {
      const failureCount = criticalFailures.length;
      if (conditions.critical_failures.max !== undefined && failureCount > conditions.critical_failures.max) {
        return false;
      }
      if (conditions.critical_failures.min !== undefined && failureCount < conditions.critical_failures.min) {
        return false;
      }
    }

    // Check retry count conditions
    if (conditions.retry_count) {
      if (conditions.retry_count.max !== undefined && retryCount > conditions.retry_count.max) {
        return false;
      }
      if (conditions.retry_count.min !== undefined && retryCount < conditions.retry_count.min) {
        return false;
      }
    }

    return true;
  }

  /**
   * Generate retry adjustments based on attempt number and issues
   */
  generateRetryAdjustments(attemptNumber, validationResults) {
    const retryPolicies = this.thresholds.retry_policies;
    const attemptKey = `attempt_${attemptNumber}`;
    
    let adjustments = {
      temperature_delta: 0,
      steps_modification: 'none',
      focus_areas: []
    };

    // Apply attempt-specific adjustments
    if (retryPolicies.parameter_adjustments[attemptKey]) {
      adjustments = { ...adjustments, ...retryPolicies.parameter_adjustments[attemptKey] };
    }

    // Add issue-specific adjustments
    const scores = this.extractScores(validationResults);
    
    if (scores.preservation < 60) {
      adjustments.focus_areas.push('preservation');
      adjustments.temperature_delta -= 0.1; // More conservative
    }
    
    if (scores.defect_removal < 60) {
      adjustments.focus_areas.push('defect_removal');
    }
    
    if (scores.naturalness < 60) {
      adjustments.focus_areas.push('naturalness');
      adjustments.temperature_delta -= 0.05;
    }

    return adjustments;
  }

  /**
   * Check if should auto-retry based on current state
   */
  shouldAutoRetry(sessionId, validationResults, context = {}) {
    const retryCount = context.retryCount || 0;
    const maxRetries = this.thresholds?.retry_policies?.max_attempts || 3;
    
    if (retryCount >= maxRetries) {
      return {
        shouldRetry: false,
        reason: 'Maximum retry attempts reached'
      };
    }

    const scores = this.extractScores(validationResults);
    const criticalFailures = this.identifyCriticalFailures(validationResults, context);

    // Check retry conditions
    const retryConditions = this.thresholds?.qc_decisions?.auto_retry?.conditions;
    if (retryConditions && this.evaluateConditions(retryConditions, scores, criticalFailures, retryCount)) {
      return {
        shouldRetry: true,
        reason: 'Quality below threshold but retryable',
        adjustments: this.generateRetryAdjustments(retryCount + 1, validationResults)
      };
    }

    return {
      shouldRetry: false,
      reason: 'Quality issues not suitable for automatic retry'
    };
  }

  /**
   * Get decision history for a session
   */
  getDecisionHistory(sessionId) {
    return this.decisionHistory.get(sessionId) || [];
  }

  /**
   * Get decision statistics
   */
  getDecisionStats() {
    const allDecisions = Array.from(this.decisionHistory.values()).flat();
    const stats = {
      total: allDecisions.length,
      approved: 0,
      rejected: 0,
      retried: 0,
      manualReview: 0,
      averageQuality: 0
    };

    let qualitySum = 0;
    let qualityCount = 0;

    for (const decision of allDecisions) {
      switch (decision.action) {
        case 'APPROVE':
        case 'APPROVE_WITH_NOTES':
          stats.approved++;
          break;
        case 'REJECT':
          stats.rejected++;
          break;
        case 'RETRY':
          stats.retried++;
          break;
        case 'MANUAL_REVIEW':
          stats.manualReview++;
          break;
      }

      if (decision.qualityScore) {
        qualitySum += decision.qualityScore;
        qualityCount++;
      }
    }

    if (qualityCount > 0) {
      stats.averageQuality = Math.round(qualitySum / qualityCount);
    }

    stats.approvalRate = stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0;
    stats.retryRate = stats.total > 0 ? Math.round((stats.retried / stats.total) * 100) : 0;

    return stats;
  }

  /**
   * Clear decision history
   */
  clearHistory() {
    this.decisionHistory.clear();
    console.log('QC decision history cleared');
  }

  /**
   * Reload thresholds configuration
   */
  async reloadThresholds() {
    this.thresholds = null;
    return await this.loadThresholds();
  }
}