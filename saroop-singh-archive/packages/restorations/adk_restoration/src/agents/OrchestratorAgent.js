/**
 * Orchestrator Agent - Main Controller for ADK Restoration System
 */

import { BaseAgent } from './BaseAgent.js';
import { AnalysisAgent } from './AnalysisAgent.js';
import { PlannerAgent } from './PlannerAgent.js';
import { EditorAgent } from './EditorAgent.js';
import { ValidatorAgent } from './ValidatorAgent.js';
import { AirtableManager, FilesApiManager, BatchApiManager } from '../tools/index.js';
import { FileManager, AutoRetryManager, RateLimiter, SessionPersistence, AuditLogger } from '../utils/index.js';

export class OrchestratorAgent extends BaseAgent {
  constructor(config = {}) {
    super('OrchestratorAgent', {
      modelName: 'gemini-2.5-flash',
      temperature: 0.2,
      ...config
    });
    
    // Initialize core utilities first
    this.auditLogger = new AuditLogger();
    this.rateLimiter = new RateLimiter();
    this.sessionPersistence = new SessionPersistence();
    this.filesApi = new FilesApiManager();
    this.autoRetryManager = new AutoRetryManager();
    
    // Initialize traditional utilities
    this.fileManager = new FileManager();
    this.airtableManager = new AirtableManager();
    
    // Initialize batch manager and set up event handling
    this.batchManager = new BatchApiManager();
    this.setupBatchEventHandlers();
    
    // Initialize sub-agents with enhanced capabilities
    this.analysisAgent = new AnalysisAgent();
    this.plannerAgent = new PlannerAgent();
    this.editorAgent = new EditorAgent();
    this.validatorAgent = new ValidatorAgent();
    
    // Inject dependencies into agents
    this.injectDependencies();
    
    // Session management
    this.sessions = new Map();
    
    // Configuration
    this.enableSessionPersistence = process.env.ENABLE_SESSION_PERSISTENCE !== 'false';
    this.enableAutoRetry = process.env.ENABLE_AUTO_RETRY !== 'false';
    this.enableAuditLogging = process.env.ENABLE_AUDIT_LOGGING !== 'false';
  }

  setupBatchEventHandlers() {
    this.batchManager.on('processBatchRequest', async (batchId) => {
      try {
        await this.batchManager.processBatchJob(batchId, this);
      } catch (error) {
        this.logger.error(`Batch processing failed for ${batchId}: ${error.message}`);
      }
    });
  }

  injectDependencies() {
    // Inject shared utilities into agents
    const sharedDeps = {
      rateLimiter: this.rateLimiter,
      auditLogger: this.auditLogger,
      filesApi: this.filesApi
    };

    if (this.analysisAgent.injectDependencies) {
      this.analysisAgent.injectDependencies(sharedDeps);
    }
    if (this.plannerAgent.injectDependencies) {
      this.plannerAgent.injectDependencies(sharedDeps);
    }
    if (this.editorAgent.injectDependencies) {
      this.editorAgent.injectDependencies(sharedDeps);
    }
    if (this.validatorAgent.injectDependencies) {
      this.validatorAgent.injectDependencies(sharedDeps);
    }
  }
  
  async createSession(photoRecordId, workflowId = null) {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session = {
      id: sessionId,
      photoRecordId: photoRecordId,
      workflowId: workflowId,
      status: 'initializing',
      startTime: Date.now(),
      steps: [],
      results: {
        original: null,
        analysis: null,
        plan: null,
        edits: [],
        final: null,
        validation: null
      },
      metrics: {
        totalTime: 0,
        stepsCompleted: 0,
        stepsTotal: 0,
        successRate: 0
      }
    };
    
    this.sessions.set(sessionId, session);
    this.logger.info(`Session created: ${sessionId}`);
    
    return sessionId;
  }
  
  async processPhoto(sessionId, mode = 'RESTORE') {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    
    this.logger.info(`Processing photo: ${session.photoRecordId}, Mode: ${mode}`);
    session.mode = mode;

    // Log session start
    if (this.enableAuditLogging) {
      await this.auditLogger.logSessionStart(sessionId, session);
    }
    
    try {
      // Update status and persist if enabled
      session.status = 'downloading';
      if (this.enableSessionPersistence) {
        await this.sessionPersistence.saveSession(sessionId, session);
      }
      
      // 1. Download original image from Airtable
      const photoRecord = await this.airtableManager.getPhotoRecord(session.photoRecordId);
      const originalUrl = photoRecord.fields.Attachments[0].url;
      const originalImageData = await this.fileManager.downloadImage(originalUrl);
      session.results.original = {
        url: originalUrl,
        data: originalImageData,
        metadata: photoRecord.fields
      };
      
      // Update Airtable status
      await this.airtableManager.updatePhotoStatus(session.photoRecordId, 'Processing', session.id);
      
      // Create checkpoint after download
      if (this.enableSessionPersistence) {
        await this.sessionPersistence.createCheckpoint(sessionId, 'download_complete', session);
      }
      
      // 2. Analyze image with enhanced capabilities
      session.status = 'analyzing';
      this.logger.info('Step 1/5: Image Analysis');
      
      if (this.enableSessionPersistence) {
        await this.sessionPersistence.saveSession(sessionId, session);
      }
      
      const analysisStartTime = Date.now();
      const analysis = await this.analysisAgent.analyzeImage(originalImageData);
      const analysisMetadata = {
        processingTime: Date.now() - analysisStartTime,
        modelUsed: this.analysisAgent.modelName
      };
      
      session.results.analysis = analysis;
      
      // Log analysis step
      if (this.enableAuditLogging) {
        await this.auditLogger.logAnalysisStep(sessionId, { imageData: originalImageData }, analysis, analysisMetadata);
      }
      
      // 3. Create restoration plan
      session.status = 'planning';
      this.logger.info('Step 2/5: Creating Plan');
      
      const planStartTime = Date.now();
      const plan = await this.plannerAgent.createPlan(analysis, mode);
      const planMetadata = {
        processingTime: Date.now() - planStartTime,
        modelUsed: this.plannerAgent.modelName
      };
      
      session.results.plan = plan;
      session.metrics.stepsTotal = plan.steps.length;
      
      // Log planning step
      if (this.enableAuditLogging) {
        await this.auditLogger.logPlanningStep(sessionId, { analysis, mode }, plan, planMetadata);
      }
      
      // Create checkpoint after planning
      if (this.enableSessionPersistence) {
        await this.sessionPersistence.createCheckpoint(sessionId, 'planning_complete', session);
      }
      
      // 4. Apply edits with enhanced tracking
      session.status = 'editing';
      this.logger.info(`Step 3/5: Applying ${plan.steps.length} Edits`);
      
      const editResult = await this.executeEditSteps(sessionId, session, originalImageData, plan.steps);
      session.results.edits = editResult.results;
      session.results.final = editResult.finalImageData;
      session.metrics.stepsCompleted = editResult.results.filter(r => r.success).length;
      
      // 5. Validate result with potential auto-retry
      session.status = 'validating';
      this.logger.info('Step 4/5: Validating Result');
      
      let finalResult = editResult;
      let finalValidation = await this.executeValidationStep(sessionId, originalImageData, editResult.finalImageData, plan);
      session.results.validation = finalValidation;
      
      // Check for auto-retry if enabled
      if (this.enableAutoRetry && finalValidation.recommendation !== 'accept') {
        const retryResult = await this.attemptAutoRetry(sessionId, session, originalImageData, plan, finalValidation);
        if (retryResult.improved) {
          finalResult = retryResult.editResult;
          finalValidation = retryResult.validation;
          session.results.validation = finalValidation;
          session.results.final = finalResult.finalImageData;
        }
      }
      
      // 6. Upload final result
      session.status = 'uploading';
      this.logger.info('Step 5/5: Uploading Result');
      
      const uploadedUrl = await this.fileManager.uploadImage(
        finalResult.finalImageData,
        `restored_${session.photoRecordId}.jpg`,
        {
          sessionId: sessionId,
          qualityScore: finalValidation.overallScore,
          mode: mode,
          recordId: session.photoRecordId
        }
      );
      
      // 7. Create test runs in Airtable
      const testRuns = await this.createTestRuns(session);
      
      // 8. Update photo record with results
      await this.airtableManager.updatePhotoResults(session.photoRecordId, {
        status: finalValidation.recommendation === 'accept' ? 'Complete' : 'Needs Review',
        resultUrl: uploadedUrl,
        qualityScore: finalValidation.overallScore,
        testRuns: testRuns,
        notes: this.generateSummary(session)
      });
      
      // Calculate final metrics
      session.metrics.totalTime = (Date.now() - session.startTime) / 1000;
      session.metrics.successRate = (session.metrics.stepsCompleted / session.metrics.stepsTotal) * 100;
      
      session.status = 'completed';
      
      const sessionResult = {
        success: true,
        sessionId: sessionId,
        resultUrl: uploadedUrl,
        qualityScore: finalValidation.overallScore,
        recommendation: finalValidation.recommendation,
        metrics: session.metrics
      };
      
      // Log session completion
      if (this.enableAuditLogging) {
        await this.auditLogger.logSessionComplete(sessionId, sessionResult, session);
      }
      
      // Clean up session persistence if enabled
      if (this.enableSessionPersistence) {
        await this.sessionPersistence.deleteSession(sessionId);
      }
      
      this.logger.info(`Processing complete: ${session.metrics.stepsCompleted}/${session.metrics.stepsTotal} steps successful`);
      this.logger.info(`Quality Score: ${finalValidation.overallScore}/100`);
      this.logger.info(`Total Time: ${session.metrics.totalTime.toFixed(2)}s`);
      
      return sessionResult;
      
    } catch (error) {
      session.status = 'failed';
      session.error = error.message;
      
      this.logger.error(`Processing failed: ${error.message}`);
      
      // Log system event for failure
      if (this.enableAuditLogging) {
        await this.auditLogger.logSystemEvent('session_failed', {
          sessionId: sessionId,
          error: error.message,
          stack: error.stack
        });
      }
      
      // Update Airtable with failure
      await this.airtableManager.updatePhotoStatus(
        session.photoRecordId,
        'Failed',
        session.id,
        error.message
      );
      
      return {
        success: false,
        sessionId: sessionId,
        error: error.message,
        metrics: session.metrics
      };
    }
  }
  
  async createTestRuns(session) {
    const testRuns = [];
    
    // Create test run for each edit step
    for (const edit of session.results.edits) {
      const testRunId = await this.airtableManager.createTestRun({
        sessionId: session.id,
        stepNumber: edit.stepNumber,
        action: edit.action,
        success: edit.success,
        processingTime: edit.metadata.processingTime,
        temperature: edit.metadata.temperature,
        notes: edit.notes
      });
      
      testRuns.push(testRunId);
    }
    
    // Create overall validation test run
    const validationRunId = await this.airtableManager.createTestRun({
      sessionId: session.id,
      stepNumber: session.results.edits.length + 1,
      action: 'validation',
      success: session.results.validation.recommendation === 'accept',
      qualityScore: session.results.validation.overallScore,
      notes: session.results.validation.detailedAnalysis
    });
    
    testRuns.push(validationRunId);
    
    return testRuns;
  }
  
  generateSummary(session) {
    const summary = [];
    
    summary.push(`Session: ${session.id}`);
    summary.push(`Mode: ${session.results.plan.metadata.mode}`);
    summary.push(`Strategy: ${session.results.plan.strategy}`);
    summary.push(`Steps: ${session.metrics.stepsCompleted}/${session.metrics.stepsTotal} successful`);
    summary.push(`Quality Score: ${session.results.validation.overallScore}/100`);
    summary.push(`Recommendation: ${session.results.validation.recommendation}`);
    summary.push(`Time: ${session.metrics.totalTime.toFixed(2)}s`);
    
    if (session.results.validation.issues.length > 0) {
      summary.push('\\nIssues:');
      session.results.validation.issues.forEach(issue => {
        summary.push(`- ${issue.type}: ${issue.description}`);
      });
    }
    
    return summary.join('\\n');
  }
  
  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }
  
  getAllSessions() {
    return Array.from(this.sessions.values());
  }

  /**
   * Execute edit steps with enhanced logging and tracking
   */
  async executeEditSteps(sessionId, session, originalImageData, steps) {
    const results = [];
    let currentImageData = originalImageData;

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const stepStartTime = Date.now();
      
      try {
        // Apply rate limiting
        await this.rateLimiter.waitWithRateLimit('gemini', { 
          sessionId: sessionId, 
          step: step.stepNumber 
        });

        // Execute step
        const stepResult = await this.editorAgent.applyEdit(currentImageData, step);
        const stepMetadata = {
          processingTime: Date.now() - stepStartTime,
          inputImageData: currentImageData,
          outputImageData: stepResult.imageGenerated ? stepResult.resultImageData : null,
          retryCount: 0
        };

        results.push(stepResult);

        // Update current image data if step was successful
        if (stepResult.success && stepResult.imageGenerated && stepResult.resultImageData) {
          currentImageData = stepResult.resultImageData;
        }

        // Log edit step
        if (this.enableAuditLogging) {
          await this.auditLogger.logEditStep(sessionId, step, stepResult, stepMetadata);
        }

        // Create checkpoint every few steps
        if (this.enableSessionPersistence && (i + 1) % 3 === 0) {
          session.results.edits = results;
          await this.sessionPersistence.createCheckpoint(sessionId, `edit_step_${i + 1}`, session);
        }

      } catch (error) {
        const errorResult = {
          stepNumber: step.stepNumber,
          action: step.action,
          success: false,
          imageGenerated: false,
          error: error.message,
          metadata: {
            processingTime: Date.now() - stepStartTime,
            modelUsed: this.editorAgent.modelName,
            temperature: step.temperature
          }
        };

        results.push(errorResult);

        // Log failed step
        if (this.enableAuditLogging) {
          await this.auditLogger.logEditStep(sessionId, step, errorResult, { error });
        }

        this.logger.error(`Edit step ${step.stepNumber} failed: ${error.message}`);
      }
    }

    return {
      results: results,
      finalImageData: currentImageData
    };
  }

  /**
   * Execute validation step with enhanced logging
   */
  async executeValidationStep(sessionId, originalImageData, restoredImageData, plan) {
    const validationStartTime = Date.now();
    
    try {
      // Apply rate limiting
      await this.rateLimiter.waitWithRateLimit('gemini', { 
        sessionId: sessionId, 
        step: 'validation' 
      });

      const validation = await this.validatorAgent.validateRestoration(
        originalImageData,
        restoredImageData,
        plan
      );

      const validationMetadata = {
        processingTime: Date.now() - validationStartTime,
        modelUsed: this.validatorAgent.modelName
      };

      // Log validation step
      if (this.enableAuditLogging) {
        await this.auditLogger.logValidationStep(
          sessionId, 
          { originalImageData, restoredImageData, plan }, 
          validation, 
          validationMetadata
        );
      }

      return validation;

    } catch (error) {
      this.logger.error(`Validation step failed: ${error.message}`);
      
      // Return minimal validation result on error
      return {
        overallScore: 0,
        criteria: {},
        issues: [{ type: 'validation_error', severity: 'critical', description: error.message, confidence: 100 }],
        recommendation: 'reject',
        confidence: 0,
        validationMetadata: {
          processingTime: Date.now() - validationStartTime,
          error: error.message
        }
      };
    }
  }

  /**
   * Attempt auto-retry with parameter adjustment
   */
  async attemptAutoRetry(sessionId, session, originalImageData, originalPlan, validationResult) {
    this.logger.info(`Attempting auto-retry for session ${sessionId}`);

    const retryDecision = this.autoRetryManager.shouldAutoRetry(
      sessionId,
      validationResult,
      { mode: session.mode, analysis: session.results.analysis, plan: originalPlan }
    );

    if (!retryDecision.shouldRetry) {
      this.logger.info(`Auto-retry not recommended: ${retryDecision.reason}`);
      return { improved: false, reason: retryDecision.reason };
    }

    const adjustments = this.autoRetryManager.generateRetryParameters(
      sessionId,
      validationResult,
      originalPlan,
      retryDecision.reasons
    );

    // Log retry attempt
    if (this.enableAuditLogging) {
      await this.auditLogger.logRetryAttempt(sessionId, {
        attempt: this.autoRetryManager.getRetryCount(sessionId) + 1,
        maxAttempts: this.autoRetryManager.maxRetries,
        reasons: retryDecision.reasons,
        previousScore: validationResult.overallScore,
        parameterChanges: adjustments.parameterChanges,
        planModifications: adjustments.planModifications,
        strategicChanges: adjustments.strategicChanges,
        validationResult: validationResult,
        autoRetryDecision: retryDecision
      });
    }

    // Apply adjustments to plan
    const adjustedPlan = this.autoRetryManager.applyAdjustmentsToPlan(originalPlan, adjustments);
    this.autoRetryManager.incrementRetryCount(sessionId);

    // Execute retry
    const retryEditResult = await this.executeEditSteps(sessionId, session, originalImageData, adjustedPlan.steps);
    const retryValidation = await this.executeValidationStep(sessionId, originalImageData, retryEditResult.finalImageData, adjustedPlan);

    // Check if retry improved the result
    const improved = retryValidation.overallScore > validationResult.overallScore;
    
    this.logger.info(`Auto-retry ${improved ? 'improved' : 'did not improve'} quality: ${retryValidation.overallScore} vs ${validationResult.overallScore}`);

    return {
      improved: improved,
      editResult: retryEditResult,
      validation: retryValidation,
      adjustments: adjustments
    };
  }

  /**
   * Get comprehensive system status
   */
  getSystemStatus() {
    return {
      activeSessions: this.sessions.size,
      rateLimiterStatus: this.rateLimiter.getStatus(),
      batchStats: this.batchManager.getBatchStatistics(),
      retryStats: this.autoRetryManager.getRetryStatistics(),
      cacheStats: this.sessionPersistence.getCacheStats(),
      configuration: {
        enableSessionPersistence: this.enableSessionPersistence,
        enableAutoRetry: this.enableAutoRetry,
        enableAuditLogging: this.enableAuditLogging
      }
    };
  }

  /**
   * Clean up all resources
   */
  async cleanup() {
    this.logger.info('Starting comprehensive cleanup...');
    
    const cleanupTasks = [
      this.filesApi.cleanup(),
      this.batchManager.cleanupOldJobs(),
      this.sessionPersistence.cleanup(),
      this.auditLogger.cleanupAuditFiles(),
      this.rateLimiter.cleanup()
    ];

    await Promise.allSettled(cleanupTasks);
    
    this.logger.info('Comprehensive cleanup completed');
  }
}