/**
 * Enhanced Batch Processing Manager - Handles concurrent batch operations with proper controls
 * Implements queue management, concurrency limits, dead letter queues, and progress tracking
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

export class BatchProcessingManager extends EventEmitter {
  constructor(orchestrator, structuredLogger, qcDecisionEngine, jobStateMachine) {
    super();
    
    this.orchestrator = orchestrator;
    this.logger = structuredLogger;
    this.qcEngine = qcDecisionEngine;
    this.stateMachine = jobStateMachine;
    
    // Batch storage
    this.batches = new Map(); // batchId -> batchData
    this.activeJobs = new Map(); // jobId -> batchId
    this.jobQueues = new Map(); // priority -> job[]
    
    // Dead letter queue for failed jobs
    this.deadLetterQueue = new Map(); // jobId -> failureData
    
    // Concurrency control
    this.maxConcurrentJobs = parseInt(process.env.MAX_CONCURRENT_JOBS) || 5;
    this.maxBatchSize = parseInt(process.env.MAX_BATCH_SIZE) || 50;
    this.currentlyProcessing = new Set();
    
    // Queue priorities
    this.queuePriorities = ['high', 'normal', 'low'];
    this.queuePriorities.forEach(priority => {
      this.jobQueues.set(priority, []);
    });
    
    // Processing state
    this.isProcessing = false;
    this.processingStats = {
      totalProcessed: 0,
      successCount: 0,
      failureCount: 0,
      retryCount: 0,
      startTime: null,
      lastProcessedTime: null
    };
    
    this.startProcessingLoop();
  }

  /**
   * Create new batch job
   */
  async createBatch(batchConfig) {
    try {
      const batchId = `batch_${Date.now()}_${uuidv4().split('-')[0]}`;
      const correlationId = this.logger.generateCorrelationId();
      
      const batch = {
        id: batchId,
        name: batchConfig.name || `Batch ${batchId}`,
        status: 'QUEUED',
        correlationId,
        config: {
          ...batchConfig,
          concurrencyLimit: Math.min(batchConfig.concurrencyLimit || this.maxConcurrentJobs, this.maxConcurrentJobs),
          retryPolicy: batchConfig.retryPolicy || 'standard',
          priority: batchConfig.priority || 'normal',
          timeoutMs: batchConfig.timeoutMs || 3600000 // 1 hour default
        },
        items: batchConfig.items || [],
        jobs: new Map(), // itemId -> jobData
        progress: {
          total: batchConfig.items?.length || 0,
          queued: batchConfig.items?.length || 0,
          processing: 0,
          completed: 0,
          failed: 0,
          percentage: 0,
          estimatedTimeRemaining: null
        },
        timestamps: {
          created: new Date().toISOString(),
          started: null,
          lastUpdated: new Date().toISOString(),
          completed: null
        },
        results: {
          successful: [],
          failed: [],
          retried: [],
          metadata: {}
        },
        errors: [],
        metrics: {
          averageProcessingTime: 0,
          averageQualityScore: 0,
          totalProcessingTime: 0,
          resourceUsage: {}
        }
      };

      // Validate batch size
      if (batch.progress.total > this.maxBatchSize) {
        throw new Error(`Batch size ${batch.progress.total} exceeds maximum ${this.maxBatchSize}`);
      }

      // Create jobs for each item
      for (const item of batch.items) {
        const jobId = await this.createJobForBatchItem(batchId, item, batch.config);
        batch.jobs.set(item.id || item.photoRecordId, {
          jobId,
          itemData: item,
          status: 'QUEUED',
          priority: batch.config.priority,
          attempts: 0,
          createdAt: new Date().toISOString()
        });
      }

      this.batches.set(batchId, batch);

      // Add to Airtable
      await this.createBatchRecord(batch);

      this.logger.logBatchEvent(batchId, 'batch-created', {
        itemCount: batch.progress.total,
        priority: batch.config.priority,
        concurrencyLimit: batch.config.concurrencyLimit
      });

      this.emit('batchCreated', batch);
      
      return batchId;

    } catch (error) {
      this.logger.logError(error, { context: 'batch-creation', batchConfig });
      throw error;
    }
  }

  /**
   * Create job for batch item
   */
  async createJobForBatchItem(batchId, item, config) {
    const jobId = `${batchId}_job_${item.id || uuidv4().split('-')[0]}`;
    
    // Create job in state machine
    const job = await this.stateMachine.createJob(
      jobId,
      `batch_${batchId}_session`,
      item.photoRecordId,
      item.mode || config.defaultMode || 'RESTORE',
      {
        batchId,
        itemId: item.id,
        priority: config.priority,
        timeout: config.timeoutMs
      }
    );

    // Track active job
    this.activeJobs.set(jobId, batchId);
    
    // Add to appropriate priority queue
    const priority = config.priority || 'normal';
    this.jobQueues.get(priority).push({
      jobId,
      batchId,
      item,
      queuedAt: Date.now()
    });

    return jobId;
  }

  /**
   * Start the main processing loop
   */
  startProcessingLoop() {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    this.processingStats.startTime = new Date().toISOString();

    // Main processing loop
    setInterval(async () => {
      try {
        await this.processNextJobs();
      } catch (error) {
        this.logger.logError(error, { context: 'processing-loop' });
      }
    }, 1000); // Check every second

    // Batch progress update loop
    setInterval(async () => {
      try {
        await this.updateBatchProgress();
      } catch (error) {
        this.logger.logError(error, { context: 'progress-update-loop' });
      }
    }, 5000); // Update every 5 seconds

    // Cleanup loop
    setInterval(async () => {
      try {
        await this.cleanupCompletedBatches();
      } catch (error) {
        this.logger.logError(error, { context: 'cleanup-loop' });
      }
    }, 60000); // Cleanup every minute

    this.logger.logEvent('info', 'batch-processing-started', {
      maxConcurrency: this.maxConcurrentJobs,
      category: 'batch-processing'
    });
  }

  /**
   * Process next available jobs with concurrency control
   */
  async processNextJobs() {
    // Check if we can process more jobs
    const availableSlots = this.maxConcurrentJobs - this.currentlyProcessing.size;
    if (availableSlots <= 0) {
      return;
    }

    // Get next jobs from priority queues
    const jobsToProcess = this.getNextJobsToProcess(availableSlots);
    
    if (jobsToProcess.length === 0) {
      return;
    }

    // Process jobs concurrently
    const processingPromises = jobsToProcess.map(jobData => 
      this.processJob(jobData).catch(error => {
        this.logger.logError(error, { 
          jobId: jobData.jobId,
          batchId: jobData.batchId,
          context: 'job-processing'
        });
      })
    );

    await Promise.allSettled(processingPromises);
  }

  /**
   * Get next jobs to process based on priority and availability
   */
  getNextJobsToProcess(maxJobs) {
    const jobsToProcess = [];
    
    // Process by priority: high -> normal -> low
    for (const priority of this.queuePriorities) {
      const queue = this.jobQueues.get(priority);
      
      while (queue.length > 0 && jobsToProcess.length < maxJobs) {
        const jobData = queue.shift();
        
        // Check if batch is still active
        const batch = this.batches.get(jobData.batchId);
        if (!batch || batch.status === 'CANCELLED') {
          continue;
        }

        // Check concurrency limit for this batch
        const batchConcurrency = this.getBatchConcurrency(jobData.batchId);
        if (batchConcurrency >= batch.config.concurrencyLimit) {
          // Put back in queue and skip
          queue.unshift(jobData);
          continue;
        }

        jobsToProcess.push(jobData);
      }
    }

    return jobsToProcess;
  }

  /**
   * Get current concurrency for batch
   */
  getBatchConcurrency(batchId) {
    let count = 0;
    for (const jobId of this.currentlyProcessing) {
      if (this.activeJobs.get(jobId) === batchId) {
        count++;
      }
    }
    return count;
  }

  /**
   * Process individual job
   */
  async processJob(jobData) {
    const { jobId, batchId, item } = jobData;
    const startTime = Date.now();
    
    try {
      // Mark as processing
      this.currentlyProcessing.add(jobId);
      
      const batch = this.batches.get(batchId);
      const jobInfo = batch.jobs.get(item.id || item.photoRecordId);
      
      // Update job status
      jobInfo.status = 'PROCESSING';
      jobInfo.startedAt = new Date().toISOString();
      batch.progress.processing++;
      batch.progress.queued--;

      // Transition job state
      await this.stateMachine.transitionTo(jobId, 'ANALYZING', 'Started batch processing');

      this.logger.logJobEvent(jobId, jobData.batchId, 'job-started', {
        batchId,
        itemId: item.id,
        priority: batch.config.priority
      });

      // Process through orchestrator
      const result = await this.orchestrator.processImage({
        recordId: item.photoRecordId,
        imageUrl: item.imageUrl,
        imageData: item.imageData,
        mode: item.mode || batch.config.defaultMode || 'RESTORE',
        workflowId: batch.config.workflowId,
        sessionId: `batch_${batchId}_${jobId}`,
        timeout: batch.config.timeoutMs
      });

      // Process result
      const processingTime = Date.now() - startTime;
      await this.handleJobSuccess(jobId, batchId, item, result, processingTime);

    } catch (error) {
      const processingTime = Date.now() - startTime;
      await this.handleJobFailure(jobId, batchId, item, error, processingTime);
    } finally {
      // Remove from processing set
      this.currentlyProcessing.delete(jobId);
      this.processingStats.lastProcessedTime = new Date().toISOString();
    }
  }

  /**
   * Handle successful job completion
   */
  async handleJobSuccess(jobId, batchId, item, result, processingTime) {
    const batch = this.batches.get(batchId);
    const jobInfo = batch.jobs.get(item.id || item.photoRecordId);
    
    // Update job info
    jobInfo.status = 'COMPLETED';
    jobInfo.completedAt = new Date().toISOString();
    jobInfo.processingTime = processingTime;
    jobInfo.result = result;

    // Update batch progress
    batch.progress.processing--;
    batch.progress.completed++;
    batch.progress.percentage = Math.round((batch.progress.completed / batch.progress.total) * 100);

    // Store result
    batch.results.successful.push({
      jobId,
      itemId: item.id,
      result,
      processingTime,
      qualityScore: result.qualityScore
    });

    // Update metrics
    this.updateBatchMetrics(batch, result, processingTime);

    // Update statistics
    this.processingStats.totalProcessed++;
    this.processingStats.successCount++;

    this.logger.logJobEvent(jobId, batchId, 'job-completed', {
      processingTime,
      qualityScore: result.qualityScore,
      itemId: item.id
    });

    // Check if batch is complete
    if (batch.progress.completed + batch.progress.failed >= batch.progress.total) {
      await this.completeBatch(batchId);
    }
  }

  /**
   * Handle job failure
   */
  async handleJobFailure(jobId, batchId, item, error, processingTime) {
    const batch = this.batches.get(batchId);
    const jobInfo = batch.jobs.get(item.id || item.photoRecordId);
    
    jobInfo.attempts++;
    const shouldRetry = await this.shouldRetryJob(jobId, batchId, jobInfo, error);
    
    if (shouldRetry && jobInfo.attempts <= 3) {
      // Retry job
      jobInfo.status = 'QUEUED';
      jobInfo.lastError = error.message;
      
      batch.progress.processing--;
      batch.progress.queued++;
      
      // Add back to queue with delay
      setTimeout(() => {
        const priority = batch.config.priority;
        this.jobQueues.get(priority).push({
          jobId,
          batchId,
          item,
          queuedAt: Date.now(),
          retryAttempt: jobInfo.attempts
        });
      }, 2000 * jobInfo.attempts); // Exponential backoff

      batch.results.retried.push({
        jobId,
        itemId: item.id,
        error: error.message,
        attempts: jobInfo.attempts
      });

      this.processingStats.retryCount++;

      this.logger.logJobEvent(jobId, batchId, 'job-retried', {
        error: error.message,
        attempts: jobInfo.attempts,
        itemId: item.id
      });

    } else {
      // Job failed permanently
      jobInfo.status = 'FAILED';
      jobInfo.failedAt = new Date().toISOString();
      jobInfo.error = error.message;

      batch.progress.processing--;
      batch.progress.failed++;
      batch.progress.percentage = Math.round(((batch.progress.completed + batch.progress.failed) / batch.progress.total) * 100);

      // Add to dead letter queue
      this.deadLetterQueue.set(jobId, {
        jobId,
        batchId,
        item,
        error: error.message,
        attempts: jobInfo.attempts,
        failedAt: new Date().toISOString()
      });

      batch.results.failed.push({
        jobId,
        itemId: item.id,
        error: error.message,
        attempts: jobInfo.attempts
      });

      batch.errors.push({
        jobId,
        error: error.message,
        timestamp: new Date().toISOString()
      });

      this.processingStats.totalProcessed++;
      this.processingStats.failureCount++;

      // Transition to failed state
      await this.stateMachine.transitionTo(jobId, 'FAILED', error.message);

      this.logger.logJobEvent(jobId, batchId, 'job-failed', {
        error: error.message,
        attempts: jobInfo.attempts,
        itemId: item.id
      });

      // Check if batch should be stopped due to high failure rate
      await this.checkBatchStopConditions(batchId);
    }

    // Check if batch is complete
    if (batch.progress.completed + batch.progress.failed >= batch.progress.total) {
      await this.completeBatch(batchId);
    }
  }

  /**
   * Determine if job should be retried
   */
  async shouldRetryJob(jobId, batchId, jobInfo, error) {
    const batch = this.batches.get(batchId);
    
    // Check retry policy
    const retryPolicy = batch.config.retryPolicy || 'standard';
    
    switch (retryPolicy) {
      case 'aggressive':
        return jobInfo.attempts < 5;
      case 'conservative':
        return jobInfo.attempts < 2;
      case 'none':
        return false;
      case 'standard':
      default:
        return jobInfo.attempts < 3;
    }
  }

  /**
   * Check if batch should be stopped due to conditions
   */
  async checkBatchStopConditions(batchId) {
    const batch = this.batches.get(batchId);
    
    if (batch.status === 'CANCELLED') {
      return;
    }

    // Calculate failure rate
    const totalProcessed = batch.progress.completed + batch.progress.failed;
    const failureRate = totalProcessed > 0 ? batch.progress.failed / totalProcessed : 0;
    
    // Stop if failure rate is too high (>50%)
    if (failureRate > 0.5 && totalProcessed >= 10) {
      await this.cancelBatch(batchId, `High failure rate: ${Math.round(failureRate * 100)}%`);
      return;
    }

    // Stop if consecutive failures exceed threshold
    const recentFailures = batch.results.failed.slice(-5);
    if (recentFailures.length >= 5) {
      await this.cancelBatch(batchId, 'Too many consecutive failures');
      return;
    }
  }

  /**
   * Update batch metrics
   */
  updateBatchMetrics(batch, result, processingTime) {
    const metrics = batch.metrics;
    
    // Update processing time
    metrics.totalProcessingTime += processingTime;
    metrics.averageProcessingTime = Math.round(metrics.totalProcessingTime / batch.progress.completed);
    
    // Update quality score
    if (result.qualityScore) {
      const totalQuality = (metrics.averageQualityScore * (batch.progress.completed - 1)) + result.qualityScore;
      metrics.averageQualityScore = Math.round(totalQuality / batch.progress.completed);
    }
    
    batch.timestamps.lastUpdated = new Date().toISOString();
  }

  /**
   * Update batch progress and ETA
   */
  async updateBatchProgress() {
    for (const [batchId, batch] of this.batches.entries()) {
      if (batch.status !== 'IN_PROGRESS') {
        continue;
      }

      // Calculate ETA
      if (batch.progress.completed > 0 && batch.progress.processing > 0) {
        const avgTime = batch.metrics.averageProcessingTime;
        const remaining = batch.progress.total - batch.progress.completed - batch.progress.failed;
        const eta = new Date(Date.now() + (remaining * avgTime));
        batch.progress.estimatedTimeRemaining = eta.toISOString();
      }

      // Update Airtable record
      await this.updateBatchRecord(batch);

      // Emit progress event
      this.emit('batchProgress', batch);
    }
  }

  /**
   * Complete batch processing
   */
  async completeBatch(batchId) {
    const batch = this.batches.get(batchId);
    
    batch.status = 'COMPLETED';
    batch.timestamps.completed = new Date().toISOString();
    batch.progress.percentage = 100;

    // Calculate final metrics
    const totalTime = new Date(batch.timestamps.completed) - new Date(batch.timestamps.started);
    batch.metrics.totalBatchTime = totalTime;

    await this.updateBatchRecord(batch);

    this.logger.logBatchEvent(batchId, 'batch-completed', {
      totalItems: batch.progress.total,
      successful: batch.progress.completed,
      failed: batch.progress.failed,
      totalTime: Math.round(totalTime / 1000),
      averageQuality: batch.metrics.averageQualityScore
    });

    this.emit('batchCompleted', batch);
  }

  /**
   * Cancel batch processing
   */
  async cancelBatch(batchId, reason = 'Cancelled by user') {
    const batch = this.batches.get(batchId);
    if (!batch) {
      throw new Error(`Batch not found: ${batchId}`);
    }

    batch.status = 'CANCELLED';
    batch.timestamps.cancelled = new Date().toISOString();

    // Cancel all queued jobs
    for (const priority of this.queuePriorities) {
      const queue = this.jobQueues.get(priority);
      const remaining = [];
      
      for (const jobData of queue) {
        if (jobData.batchId !== batchId) {
          remaining.push(jobData);
        }
      }
      
      this.jobQueues.set(priority, remaining);
    }

    await this.updateBatchRecord(batch);

    this.logger.logBatchEvent(batchId, 'batch-cancelled', { reason });
    this.emit('batchCancelled', batch, reason);
  }

  /**
   * Get batch statistics
   */
  getBatchStatistics() {
    const stats = {
      totalBatches: this.batches.size,
      activeBatches: 0,
      completedBatches: 0,
      cancelledBatches: 0,
      currentlyProcessing: this.currentlyProcessing.size,
      queuedJobs: 0,
      deadLetterQueueSize: this.deadLetterQueue.size,
      processingStats: { ...this.processingStats }
    };

    // Count by status
    for (const batch of this.batches.values()) {
      switch (batch.status) {
        case 'IN_PROGRESS':
        case 'QUEUED':
          stats.activeBatches++;
          break;
        case 'COMPLETED':
          stats.completedBatches++;
          break;
        case 'CANCELLED':
          stats.cancelledBatches++;
          break;
      }
    }

    // Count queued jobs
    for (const queue of this.jobQueues.values()) {
      stats.queuedJobs += queue.length;
    }

    return stats;
  }

  /**
   * Create batch record in Airtable
   */
  async createBatchRecord(batch) {
    try {
      // This would create a record in the Batches table
      // Implementation depends on AirtableManager having the Batches table configured
      console.log(`Would create batch record: ${batch.id}`);
    } catch (error) {
      this.logger.logError(error, { context: 'batch-record-creation', batchId: batch.id });
    }
  }

  /**
   * Update batch record in Airtable
   */
  async updateBatchRecord(batch) {
    try {
      // This would update the record in the Batches table
      console.log(`Would update batch record: ${batch.id}`);
    } catch (error) {
      this.logger.logError(error, { context: 'batch-record-update', batchId: batch.id });
    }
  }

  /**
   * Cleanup completed batches older than specified time
   */
  async cleanupCompletedBatches(maxAgeHours = 24) {
    const maxAge = maxAgeHours * 60 * 60 * 1000;
    const now = Date.now();
    let cleanedCount = 0;

    for (const [batchId, batch] of this.batches.entries()) {
      if (batch.status === 'COMPLETED' || batch.status === 'CANCELLED') {
        const completedTime = batch.timestamps.completed || batch.timestamps.cancelled;
        if (completedTime) {
          const age = now - new Date(completedTime).getTime();
          if (age > maxAge) {
            // Clean up job references
            for (const [itemId, jobInfo] of batch.jobs.entries()) {
              this.activeJobs.delete(jobInfo.jobId);
            }
            
            this.batches.delete(batchId);
            cleanedCount++;
          }
        }
      }
    }

    if (cleanedCount > 0) {
      this.logger.logEvent('info', 'batch-cleanup', {
        cleanedBatches: cleanedCount,
        category: 'maintenance'
      });
    }

    return cleanedCount;
  }

  /**
   * Get batch by ID
   */
  getBatch(batchId) {
    return this.batches.get(batchId);
  }

  /**
   * Get all batches
   */
  getAllBatches() {
    return Array.from(this.batches.values());
  }

  /**
   * Get dead letter queue entries
   */
  getDeadLetterQueue() {
    return Array.from(this.deadLetterQueue.values());
  }

  /**
   * Retry job from dead letter queue
   */
  async retryFromDeadLetterQueue(jobId) {
    const deadJob = this.deadLetterQueue.get(jobId);
    if (!deadJob) {
      throw new Error(`Job not found in dead letter queue: ${jobId}`);
    }

    const batch = this.batches.get(deadJob.batchId);
    if (!batch) {
      throw new Error(`Batch not found: ${deadJob.batchId}`);
    }

    // Reset job info
    const jobInfo = batch.jobs.get(deadJob.item.id || deadJob.item.photoRecordId);
    jobInfo.status = 'QUEUED';
    jobInfo.attempts = 0;
    jobInfo.error = null;

    // Remove from dead letter queue
    this.deadLetterQueue.delete(jobId);

    // Add back to processing queue
    const priority = batch.config.priority;
    this.jobQueues.get(priority).push({
      jobId,
      batchId: deadJob.batchId,
      item: deadJob.item,
      queuedAt: Date.now(),
      manual: true
    });

    this.logger.logJobEvent(jobId, deadJob.batchId, 'job-retried-from-dlq', {
      itemId: deadJob.item.id
    });

    return jobId;
  }
}