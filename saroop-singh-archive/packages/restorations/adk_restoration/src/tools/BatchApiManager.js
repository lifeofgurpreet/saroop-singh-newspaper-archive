/**
 * Batch API Manager - Handles long-running batch operations
 * Supports queuing, progress tracking, and batch job management
 */

import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';
import { EventEmitter } from 'events';

export class BatchApiManager extends EventEmitter {
  constructor() {
    super();
    
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
          return `[${timestamp}] [BatchApiManager] ${level}: ${message}`;
        })
      ),
      transports: [new winston.transports.Console()]
    });

    // Batch job storage
    this.batchJobs = new Map();
    this.jobQueue = [];
    this.processingQueue = new Set();
    
    // Configuration
    this.maxConcurrentJobs = parseInt(process.env.MAX_CONCURRENT_BATCH_JOBS) || 3;
    this.maxRetries = parseInt(process.env.BATCH_MAX_RETRIES) || 2;
    this.batchTimeout = parseInt(process.env.BATCH_TIMEOUT_MINUTES) || 60;
    
    // Start processing loop
    this.startProcessingLoop();
  }

  /**
   * Create a new batch job
   */
  createBatchJob(config) {
    const batchId = `batch_${Date.now()}_${uuidv4().slice(0, 8)}`;
    
    const batchJob = {
      id: batchId,
      status: 'queued',
      config: config,
      items: config.items || [],
      results: [],
      errors: [],
      progress: {
        total: config.items?.length || 0,
        completed: 0,
        failed: 0,
        percentage: 0
      },
      timestamps: {
        created: Date.now(),
        started: null,
        completed: null
      },
      metadata: {
        retryCount: 0,
        lastError: null,
        estimatedTimeRemaining: null
      }
    };

    this.batchJobs.set(batchId, batchJob);
    this.jobQueue.push(batchId);
    
    this.logger.info(`Batch job created: ${batchId} with ${batchJob.progress.total} items`);
    
    // Emit event
    this.emit('batchCreated', batchJob);
    
    return batchId;
  }

  /**
   * Get batch job status
   */
  getBatchJob(batchId) {
    return this.batchJobs.get(batchId);
  }

  /**
   * Get all batch jobs
   */
  getAllBatchJobs() {
    return Array.from(this.batchJobs.values());
  }

  /**
   * Cancel a batch job
   */
  cancelBatchJob(batchId) {
    const job = this.batchJobs.get(batchId);
    if (!job) {
      throw new Error(`Batch job not found: ${batchId}`);
    }

    if (job.status === 'running') {
      job.status = 'cancelled';
      this.processingQueue.delete(batchId);
      this.logger.info(`Batch job cancelled: ${batchId}`);
      this.emit('batchCancelled', job);
    } else if (job.status === 'queued') {
      job.status = 'cancelled';
      const queueIndex = this.jobQueue.indexOf(batchId);
      if (queueIndex > -1) {
        this.jobQueue.splice(queueIndex, 1);
      }
      this.logger.info(`Queued batch job cancelled: ${batchId}`);
      this.emit('batchCancelled', job);
    }

    return job;
  }

  /**
   * Process a single batch job
   */
  async processBatchJob(batchId, orchestrator) {
    const job = this.batchJobs.get(batchId);
    if (!job) {
      throw new Error(`Batch job not found: ${batchId}`);
    }

    this.logger.info(`Starting batch job processing: ${batchId}`);
    
    job.status = 'running';
    job.timestamps.started = Date.now();
    this.emit('batchStarted', job);

    try {
      const startTime = Date.now();
      
      for (let i = 0; i < job.items.length; i++) {
        if (job.status === 'cancelled') {
          this.logger.info(`Batch job cancelled during processing: ${batchId}`);
          break;
        }

        const item = job.items[i];
        this.logger.info(`Processing batch item ${i + 1}/${job.items.length}: ${item.photoRecordId}`);

        try {
          // Create session for each item
          const sessionId = await orchestrator.createSession(
            item.photoRecordId,
            item.workflowId || job.config.defaultWorkflowId
          );

          // Process with the specified mode
          const result = await orchestrator.processPhoto(
            sessionId,
            item.mode || job.config.defaultMode || 'RESTORE'
          );

          // Store result
          job.results.push({
            itemIndex: i,
            photoRecordId: item.photoRecordId,
            sessionId: sessionId,
            success: result.success,
            result: result,
            processingTime: result.metrics?.totalTime || 0
          });

          job.progress.completed++;

        } catch (error) {
          this.logger.error(`Batch item ${i + 1} failed: ${error.message}`);
          
          job.errors.push({
            itemIndex: i,
            photoRecordId: item.photoRecordId,
            error: error.message,
            timestamp: Date.now()
          });

          job.progress.failed++;
        }

        // Update progress
        job.progress.percentage = Math.round(
          ((job.progress.completed + job.progress.failed) / job.progress.total) * 100
        );

        // Estimate remaining time
        const elapsed = Date.now() - startTime;
        const avgTimePerItem = elapsed / (job.progress.completed + job.progress.failed);
        const itemsRemaining = job.progress.total - job.progress.completed - job.progress.failed;
        job.metadata.estimatedTimeRemaining = avgTimePerItem * itemsRemaining;

        // Emit progress update
        this.emit('batchProgress', job);

        // Rate limiting between items
        if (i < job.items.length - 1) {
          const delay = job.config.delayBetweenItems || 2000;
          await this.sleep(delay);
        }
      }

      // Final status
      job.timestamps.completed = Date.now();
      
      if (job.status === 'cancelled') {
        job.status = 'cancelled';
      } else if (job.progress.failed === 0) {
        job.status = 'completed';
      } else if (job.progress.completed > 0) {
        job.status = 'partial_success';
      } else {
        job.status = 'failed';
      }

      this.logger.info(
        `Batch job ${job.status}: ${batchId} - ${job.progress.completed}/${job.progress.total} successful, ${job.progress.failed} failed`
      );

      this.emit('batchCompleted', job);
      return job;

    } catch (error) {
      job.status = 'failed';
      job.metadata.lastError = error.message;
      job.timestamps.completed = Date.now();
      
      this.logger.error(`Batch job failed: ${batchId} - ${error.message}`);
      this.emit('batchFailed', job);
      
      throw error;
    }
  }

  /**
   * Main processing loop
   */
  async startProcessingLoop() {
    this.logger.info('Starting batch processing loop');
    
    setInterval(async () => {
      try {
        // Check for jobs to process
        if (this.processingQueue.size < this.maxConcurrentJobs && this.jobQueue.length > 0) {
          const batchId = this.jobQueue.shift();
          this.processingQueue.add(batchId);
          
          // Process asynchronously
          this.processBatchJobAsync(batchId);
        }

        // Check for timed out jobs
        this.checkTimeouts();
        
      } catch (error) {
        this.logger.error(`Processing loop error: ${error.message}`);
      }
    }, 5000); // Check every 5 seconds
  }

  /**
   * Process batch job asynchronously
   */
  async processBatchJobAsync(batchId) {
    try {
      // This would need to be injected or imported
      // const orchestrator = new OrchestratorAgent();
      // await this.processBatchJob(batchId, orchestrator);
      
      // For now, emit event that needs external handling
      this.emit('processBatchRequest', batchId);
      
    } catch (error) {
      this.logger.error(`Async batch processing failed for ${batchId}: ${error.message}`);
    } finally {
      this.processingQueue.delete(batchId);
    }
  }

  /**
   * Check for timed out jobs
   */
  checkTimeouts() {
    const now = Date.now();
    const timeoutMs = this.batchTimeout * 60 * 1000;

    for (const [batchId, job] of this.batchJobs.entries()) {
      if (job.status === 'running' && job.timestamps.started) {
        const runningTime = now - job.timestamps.started;
        
        if (runningTime > timeoutMs) {
          this.logger.warn(`Batch job timeout: ${batchId}`);
          job.status = 'timeout';
          job.metadata.lastError = 'Job timed out';
          job.timestamps.completed = now;
          
          this.processingQueue.delete(batchId);
          this.emit('batchTimeout', job);
        }
      }
    }
  }

  /**
   * Retry a failed batch job
   */
  async retryBatchJob(batchId) {
    const job = this.batchJobs.get(batchId);
    if (!job) {
      throw new Error(`Batch job not found: ${batchId}`);
    }

    if (job.metadata.retryCount >= this.maxRetries) {
      throw new Error(`Maximum retry attempts reached for batch job: ${batchId}`);
    }

    if (!['failed', 'partial_success', 'timeout'].includes(job.status)) {
      throw new Error(`Cannot retry batch job in status: ${job.status}`);
    }

    this.logger.info(`Retrying batch job: ${batchId} (attempt ${job.metadata.retryCount + 1})`);

    // Reset job state for retry
    job.status = 'queued';
    job.metadata.retryCount++;
    job.timestamps.started = null;
    job.timestamps.completed = null;
    job.progress.completed = 0;
    job.progress.failed = 0;
    job.progress.percentage = 0;
    job.results = [];
    job.errors = [];

    // Re-queue
    this.jobQueue.push(batchId);
    
    this.emit('batchRetry', job);
    
    return job;
  }

  /**
   * Get batch statistics
   */
  getBatchStatistics() {
    const jobs = this.getAllBatchJobs();
    
    const stats = {
      total: jobs.length,
      queued: 0,
      running: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
      partial_success: 0,
      timeout: 0,
      totalItemsProcessed: 0,
      totalItemsFailed: 0,
      averageItemsPerJob: 0,
      averageProcessingTime: 0
    };

    let totalProcessingTime = 0;
    let completedJobs = 0;

    for (const job of jobs) {
      stats[job.status] = (stats[job.status] || 0) + 1;
      stats.totalItemsProcessed += job.progress.completed;
      stats.totalItemsFailed += job.progress.failed;

      if (job.timestamps.started && job.timestamps.completed) {
        totalProcessingTime += job.timestamps.completed - job.timestamps.started;
        completedJobs++;
      }
    }

    if (jobs.length > 0) {
      stats.averageItemsPerJob = Math.round(
        (stats.totalItemsProcessed + stats.totalItemsFailed) / jobs.length
      );
    }

    if (completedJobs > 0) {
      stats.averageProcessingTime = Math.round(totalProcessingTime / completedJobs / 1000); // in seconds
    }

    return stats;
  }

  /**
   * Clean up old batch jobs
   */
  async cleanupOldJobs(maxAgeHours = 24) {
    this.logger.info(`Cleaning up batch jobs older than ${maxAgeHours} hours`);
    
    const now = Date.now();
    const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
    let cleanedCount = 0;

    for (const [batchId, job] of this.batchJobs.entries()) {
      const jobAge = now - job.timestamps.created;
      
      if (jobAge > maxAgeMs && ['completed', 'failed', 'cancelled', 'timeout'].includes(job.status)) {
        this.batchJobs.delete(batchId);
        cleanedCount++;
        this.logger.debug(`Cleaned up old batch job: ${batchId}`);
      }
    }

    this.logger.info(`Cleaned up ${cleanedCount} old batch jobs`);
    return cleanedCount;
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}