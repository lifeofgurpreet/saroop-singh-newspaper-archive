/**
 * Job State Machine - Manages restoration job lifecycle and state transitions
 * Implements proper job states: QUEUED → ANALYZING → PLANNING → EDITING → VALIDATING → DECIDED → COMPLETED/FAILED
 */

export class JobStateMachine {
  constructor(airtableManager, auditLogger) {
    this.airtable = airtableManager;
    this.auditLogger = auditLogger;
    
    // Define valid states and transitions
    this.states = {
      QUEUED: 'QUEUED',
      ANALYZING: 'ANALYZING', 
      PLANNING: 'PLANNING',
      EDITING: 'EDITING',
      VALIDATING: 'VALIDATING',
      DECIDED: 'DECIDED',
      COMPLETED: 'COMPLETED',
      FAILED: 'FAILED',
      CANCELLED: 'CANCELLED',
      MANUAL_REVIEW: 'MANUAL_REVIEW'
    };

    // Define allowed state transitions
    this.transitions = {
      QUEUED: ['ANALYZING', 'CANCELLED', 'FAILED'],
      ANALYZING: ['PLANNING', 'FAILED', 'CANCELLED'],
      PLANNING: ['EDITING', 'FAILED', 'CANCELLED'],
      EDITING: ['VALIDATING', 'FAILED', 'CANCELLED'],
      VALIDATING: ['DECIDED', 'FAILED', 'CANCELLED'],
      DECIDED: ['COMPLETED', 'QUEUED', 'MANUAL_REVIEW', 'FAILED'], // Can retry (back to QUEUED) or complete
      COMPLETED: [], // Terminal state
      FAILED: ['QUEUED', 'CANCELLED'], // Can retry
      CANCELLED: [], // Terminal state
      MANUAL_REVIEW: ['QUEUED', 'COMPLETED', 'FAILED'] // Manual decision can restart or complete
    };

    // Track active jobs
    this.activeJobs = new Map(); // jobId -> jobState
    this.stateHistory = new Map(); // jobId -> stateTransition[]
  }

  /**
   * Create new job and set initial state
   */
  async createJob(jobId, sessionId, photoRecordId, mode, metadata = {}) {
    try {
      const job = {
        jobId,
        sessionId,
        photoRecordId,
        mode,
        currentState: this.states.QUEUED,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          ...metadata,
          transitions: 0,
          retryCount: 0
        },
        stateData: {}
      };

      this.activeJobs.set(jobId, job);
      this.stateHistory.set(jobId, [{
        fromState: null,
        toState: this.states.QUEUED,
        timestamp: job.createdAt,
        reason: 'Job created',
        metadata: {}
      }]);

      // Update Airtable record
      if (photoRecordId) {
        await this.updatePhotoRecordState(photoRecordId, this.states.QUEUED, {
          processingJobId: jobId,
          processingStarted: job.createdAt
        });
      }

      if (this.auditLogger && typeof this.auditLogger.logStateTransition === 'function') {
        await this.auditLogger.logStateTransition(jobId, null, this.states.QUEUED, 'Job created');
      }

      console.log(`Job created: ${jobId} in state ${this.states.QUEUED}`);
      return job;

    } catch (error) {
      console.error(`Failed to create job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Transition job to new state with validation
   */
  async transitionTo(jobId, newState, reason = null, stateData = {}) {
    try {
      const job = this.activeJobs.get(jobId);
      if (!job) {
        throw new Error(`Job not found: ${jobId}`);
      }

      const currentState = job.currentState;
      
      // Validate transition is allowed
      if (!this.isValidTransition(currentState, newState)) {
        throw new Error(`Invalid state transition: ${currentState} → ${newState}`);
      }

      // Perform transition
      const previousState = job.currentState;
      job.currentState = newState;
      job.updatedAt = new Date().toISOString();
      job.metadata.transitions++;
      job.stateData = { ...job.stateData, ...stateData };

      // Record state history
      const transition = {
        fromState: previousState,
        toState: newState,
        timestamp: job.updatedAt,
        reason: reason || `Transitioned to ${newState}`,
        metadata: { ...stateData }
      };

      this.stateHistory.get(jobId).push(transition);

      // Update Airtable record
      if (job.photoRecordId) {
        await this.updatePhotoRecordState(job.photoRecordId, newState, {
          lastTransition: transition,
          stateData: job.stateData
        });
      }

      // Log audit trail
      if (this.auditLogger && typeof this.auditLogger.logStateTransition === 'function') {
        await this.auditLogger.logStateTransition(jobId, previousState, newState, reason);
      }

      console.log(`Job ${jobId}: ${previousState} → ${newState} (${reason})`);

      // Handle state-specific actions
      await this.handleStateEntry(jobId, newState, previousState, stateData);

      return job;

    } catch (error) {
      console.error(`Failed to transition job ${jobId} to ${newState}:`, error);
      throw error;
    }
  }

  /**
   * Check if state transition is valid
   */
  isValidTransition(fromState, toState) {
    if (!fromState) {
      return toState === this.states.QUEUED; // Initial state
    }

    const allowedTransitions = this.transitions[fromState];
    return allowedTransitions && allowedTransitions.includes(toState);
  }

  /**
   * Handle actions when entering a new state
   */
  async handleStateEntry(jobId, newState, previousState, stateData) {
    const job = this.activeJobs.get(jobId);
    if (!job) return;

    try {
      switch (newState) {
        case this.states.ANALYZING:
          await this.handleAnalyzingState(job, stateData);
          break;
          
        case this.states.PLANNING:
          await this.handlePlanningState(job, stateData);
          break;
          
        case this.states.EDITING:
          await this.handleEditingState(job, stateData);
          break;
          
        case this.states.VALIDATING:
          await this.handleValidatingState(job, stateData);
          break;
          
        case this.states.DECIDED:
          await this.handleDecidedState(job, stateData);
          break;
          
        case this.states.COMPLETED:
          await this.handleCompletedState(job, stateData);
          break;
          
        case this.states.FAILED:
          await this.handleFailedState(job, stateData);
          break;
          
        case this.states.MANUAL_REVIEW:
          await this.handleManualReviewState(job, stateData);
          break;
      }
    } catch (error) {
      console.error(`Error handling state entry for ${jobId}:`, error);
    }
  }

  /**
   * Handle ANALYZING state
   */
  async handleAnalyzingState(job, stateData) {
    job.stateData.analysisStarted = new Date().toISOString();
    console.log(`Starting analysis for job ${job.jobId}`);
  }

  /**
   * Handle PLANNING state
   */
  async handlePlanningState(job, stateData) {
    job.stateData.planningStarted = new Date().toISOString();
    job.stateData.analysisResults = stateData.analysisResults;
    console.log(`Starting planning for job ${job.jobId}`);
  }

  /**
   * Handle EDITING state
   */
  async handleEditingState(job, stateData) {
    job.stateData.editingStarted = new Date().toISOString();
    job.stateData.restorationPlan = stateData.restorationPlan;
    console.log(`Starting editing for job ${job.jobId}`);
  }

  /**
   * Handle VALIDATING state
   */
  async handleValidatingState(job, stateData) {
    job.stateData.validationStarted = new Date().toISOString();
    job.stateData.editingResults = stateData.editingResults;
    console.log(`Starting validation for job ${job.jobId}`);
  }

  /**
   * Handle DECIDED state
   */
  async handleDecidedState(job, stateData) {
    job.stateData.decisionMade = new Date().toISOString();
    job.stateData.qcDecision = stateData.qcDecision;
    job.stateData.validationResults = stateData.validationResults;
    
    console.log(`QC decision made for job ${job.jobId}: ${stateData.qcDecision?.action}`);
    
    // Auto-transition based on QC decision
    if (stateData.qcDecision) {
      switch (stateData.qcDecision.action) {
        case 'APPROVE':
        case 'APPROVE_WITH_NOTES':
          await this.transitionTo(job.jobId, this.states.COMPLETED, 'Auto-approved by QC');
          break;
          
        case 'RETRY':
          job.metadata.retryCount++;
          await this.transitionTo(job.jobId, this.states.QUEUED, 'Retry requested by QC');
          break;
          
        case 'MANUAL_REVIEW':
          await this.transitionTo(job.jobId, this.states.MANUAL_REVIEW, 'Manual review required');
          break;
          
        case 'REJECT':
          await this.transitionTo(job.jobId, this.states.FAILED, 'Rejected by QC');
          break;
      }
    }
  }

  /**
   * Handle COMPLETED state
   */
  async handleCompletedState(job, stateData) {
    job.stateData.completedAt = new Date().toISOString();
    job.stateData.finalResults = stateData.finalResults;
    
    console.log(`Job completed successfully: ${job.jobId}`);
    
    // Calculate total processing time
    const totalTime = new Date(job.stateData.completedAt) - new Date(job.createdAt);
    job.stateData.totalProcessingTime = totalTime / 1000; // seconds

    // Update final Airtable record
    if (job.photoRecordId && stateData.finalResults) {
      await this.updatePhotoRecordState(job.photoRecordId, this.states.COMPLETED, {
        processingCompleted: job.stateData.completedAt,
        processingTime: job.stateData.totalProcessingTime,
        qualityScore: stateData.finalResults.qualityScore,
        resultUrl: stateData.finalResults.resultUrl
      });
    }
  }

  /**
   * Handle FAILED state
   */
  async handleFailedState(job, stateData) {
    job.stateData.failedAt = new Date().toISOString();
    job.stateData.error = stateData.error;
    
    console.error(`Job failed: ${job.jobId} - ${stateData.error}`);
    
    // Update Airtable with error details
    if (job.photoRecordId) {
      await this.updatePhotoRecordState(job.photoRecordId, this.states.FAILED, {
        errorMessage: stateData.error,
        processingCompleted: job.stateData.failedAt
      });
    }
  }

  /**
   * Handle MANUAL_REVIEW state
   */
  async handleManualReviewState(job, stateData) {
    job.stateData.manualReviewRequested = new Date().toISOString();
    job.stateData.reviewReason = stateData.reviewReason;
    
    console.log(`Manual review requested for job ${job.jobId}: ${stateData.reviewReason}`);
  }

  /**
   * Update photo record in Airtable with current state
   */
  async updatePhotoRecordState(recordId, state, additionalData = {}) {
    try {
      const updateData = {
        'Status': state,
        'Processing Updated': new Date().toISOString(),
        ...additionalData
      };

      await this.airtable.tables.photoGallery.update(recordId, updateData);
      
    } catch (error) {
      console.error(`Failed to update photo record ${recordId}:`, error);
    }
  }

  /**
   * Get current job state
   */
  getJobState(jobId) {
    return this.activeJobs.get(jobId);
  }

  /**
   * Get job state history
   */
  getJobHistory(jobId) {
    return this.stateHistory.get(jobId) || [];
  }

  /**
   * Get jobs by current state
   */
  getJobsByState(state) {
    const jobs = [];
    for (const [jobId, job] of this.activeJobs.entries()) {
      if (job.currentState === state) {
        jobs.push(job);
      }
    }
    return jobs;
  }

  /**
   * Get job statistics
   */
  getJobStatistics() {
    const stats = {
      total: this.activeJobs.size,
      byState: {},
      completed: 0,
      failed: 0,
      activeProcessing: 0
    };

    // Count by state
    for (const state of Object.values(this.states)) {
      stats.byState[state] = 0;
    }

    for (const job of this.activeJobs.values()) {
      stats.byState[job.currentState]++;
      
      if (job.currentState === this.states.COMPLETED) {
        stats.completed++;
      } else if (job.currentState === this.states.FAILED) {
        stats.failed++;
      } else if ([this.states.ANALYZING, this.states.PLANNING, this.states.EDITING, this.states.VALIDATING].includes(job.currentState)) {
        stats.activeProcessing++;
      }
    }

    stats.successRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
    stats.failureRate = stats.total > 0 ? Math.round((stats.failed / stats.total) * 100) : 0;

    return stats;
  }

  /**
   * Clean up completed/failed jobs older than specified time
   */
  async cleanupOldJobs(maxAgeHours = 24) {
    const maxAge = maxAgeHours * 60 * 60 * 1000; // Convert to milliseconds
    const now = Date.now();
    const terminalStates = [this.states.COMPLETED, this.states.FAILED, this.states.CANCELLED];
    
    const jobsToCleanup = [];
    
    for (const [jobId, job] of this.activeJobs.entries()) {
      if (terminalStates.includes(job.currentState)) {
        const jobAge = now - new Date(job.updatedAt).getTime();
        if (jobAge > maxAge) {
          jobsToCleanup.push(jobId);
        }
      }
    }

    for (const jobId of jobsToCleanup) {
      this.activeJobs.delete(jobId);
      this.stateHistory.delete(jobId);
      console.log(`Cleaned up old job: ${jobId}`);
    }

    return jobsToCleanup.length;
  }

  /**
   * Force transition (for manual intervention)
   */
  async forceTransition(jobId, newState, reason = 'Manual intervention') {
    console.warn(`Forcing job ${jobId} to state ${newState}: ${reason}`);
    
    const job = this.activeJobs.get(jobId);
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    // Skip validation for force transitions
    const previousState = job.currentState;
    job.currentState = newState;
    job.updatedAt = new Date().toISOString();
    job.metadata.transitions++;
    job.metadata.forceTransitions = (job.metadata.forceTransitions || 0) + 1;

    // Record in history
    this.stateHistory.get(jobId).push({
      fromState: previousState,
      toState: newState,
      timestamp: job.updatedAt,
      reason: `FORCED: ${reason}`,
      metadata: { forced: true }
    });

    if (this.auditLogger && typeof this.auditLogger.logStateTransition === 'function') {
      await this.auditLogger.logStateTransition(jobId, previousState, newState, `FORCED: ${reason}`);
    }

    return job;
  }

  /**
   * Cancel job
   */
  async cancelJob(jobId, reason = 'Cancelled by user') {
    return await this.transitionTo(jobId, this.states.CANCELLED, reason);
  }

  /**
   * Restart job (from FAILED or COMPLETED back to QUEUED)
   */
  async restartJob(jobId, reason = 'Job restarted') {
    const job = this.activeJobs.get(jobId);
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    if (![this.states.FAILED, this.states.COMPLETED, this.states.MANUAL_REVIEW].includes(job.currentState)) {
      throw new Error(`Cannot restart job in state: ${job.currentState}`);
    }

    job.metadata.retryCount++;
    return await this.transitionTo(jobId, this.states.QUEUED, reason);
  }
}