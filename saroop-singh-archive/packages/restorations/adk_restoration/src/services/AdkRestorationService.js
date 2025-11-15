/**
 * ADK Restoration Service - Master integration service
 * Wires together all components into a cohesive restoration system
 */

import { OrchestratorAgent } from '../agents/OrchestratorAgent.js';
import { AirtableManager } from '../tools/AirtableManager.js';
import { FilesApiManager } from '../tools/FilesApiManager.js';

// Core Services
import { CloudImageUploadService } from './CloudImageUploadService.js';
import { AirtableSchemaManager } from './AirtableSchemaManager.js';
import { IdempotencyManager } from './IdempotencyManager.js';
import { QCDecisionEngine } from './QCDecisionEngine.js';
import { JobStateMachine } from './JobStateMachine.js';
import { StructuredLogger } from './StructuredLogger.js';
import { AutoRetryControlLoop } from './AutoRetryControlLoop.js';
import { BatchProcessingManager } from './BatchProcessingManager.js';

// Testing
import { E2ETestSuite } from '../testing/E2ETestSuite.js';

// Utilities
import { AuditLogger } from '../utils/AuditLogger.js';

export class AdkRestorationService {
  constructor(config = {}) {
    this.config = {
      environment: config.environment || process.env.NODE_ENV || 'development',
      version: config.version || '1.0.0',
      serviceName: 'adk-restoration',
      maxConcurrentJobs: config.maxConcurrentJobs || 5,
      enableTesting: config.enableTesting !== false,
      enableBatchProcessing: config.enableBatchProcessing !== false,
      enableCloudUpload: config.enableCloudUpload !== false,
      ...config
    };

    this.initialized = false;
    this.components = {};
  }

  /**
   * Initialize the complete restoration system
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      console.log(`🚀 Initializing ADK Restoration Service v${this.config.version}...`);

      // 1. Initialize structured logging first
      await this.initializeLogging();

      // 2. Initialize core data layer
      await this.initializeDataLayer();

      // 3. Initialize service layer
      await this.initializeServices();

      // 4. Initialize orchestration layer
      await this.initializeOrchestration();

      // 5. Initialize testing framework
      if (this.config.enableTesting) {
        await this.initializeTesting();
      }

      // 6. Setup health checks and monitoring
      await this.initializeMonitoring();

      // 7. Validate system configuration
      await this.validateSystem();

      this.initialized = true;

      this.components.logger.logEvent('info', 'system-initialized', {
        version: this.config.version,
        environment: this.config.environment,
        components: Object.keys(this.components).length,
        category: 'system-lifecycle'
      });

      console.log('✅ ADK Restoration Service initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize ADK Restoration Service:', error);
      throw error;
    }
  }

  /**
   * Initialize structured logging
   */
  async initializeLogging() {
    this.components.logger = new StructuredLogger({
      serviceName: this.config.serviceName,
      version: this.config.version,
      environment: this.config.environment
    });

    this.components.auditLogger = new AuditLogger();

    console.log('📝 Logging initialized');
  }

  /**
   * Initialize data layer components
   */
  async initializeDataLayer() {
    // Airtable manager
    this.components.airtable = new AirtableManager();

    // Schema manager for Airtable
    this.components.schemaManager = new AirtableSchemaManager(this.components.airtable);

    // Setup Airtable schema
    const schemaResults = await this.components.schemaManager.setupSchema();
    
    this.components.logger.logEvent('info', 'schema-setup-completed', {
      tablesChecked: schemaResults.tablesChecked,
      errors: schemaResults.errors.length,
      category: 'data-layer'
    });

    // Files API manager
    this.components.filesApi = new FilesApiManager();

    console.log('🗄️  Data layer initialized');
  }

  /**
   * Initialize service layer
   */
  async initializeServices() {
    // Idempotency manager
    this.components.idempotency = new IdempotencyManager(this.components.airtable);

    // QC Decision Engine
    this.components.qcEngine = new QCDecisionEngine();
    await this.components.qcEngine.loadThresholds();

    // Job State Machine
    this.components.stateMachine = new JobStateMachine(
      this.components.airtable,
      this.components.auditLogger
    );

    // Auto-retry control loop
    this.components.retryControl = new AutoRetryControlLoop(
      this.components.qcEngine,
      this.components.stateMachine,
      this.components.logger
    );

    // Cloud upload service (if enabled)
    if (this.config.enableCloudUpload) {
      this.components.cloudUpload = new CloudImageUploadService();
      
      const uploadConfig = this.components.cloudUpload.isConfigured();
      this.components.logger.logEvent('info', 'cloud-upload-configured', {
        cloudinary: uploadConfig.cloudinary,
        warnings: uploadConfig.warnings,
        category: 'services'
      });
    }

    console.log('⚙️  Services initialized');
  }

  /**
   * Initialize orchestration layer
   */
  async initializeOrchestration() {
    // Main orchestrator
    this.components.orchestrator = new OrchestratorAgent();

    // Batch processing manager (if enabled)
    if (this.config.enableBatchProcessing) {
      this.components.batchManager = new BatchProcessingManager(
        this.components.orchestrator,
        this.components.logger,
        this.components.qcEngine,
        this.components.stateMachine
      );
    }

    console.log('🎭 Orchestration layer initialized');
  }

  /**
   * Initialize testing framework
   */
  async initializeTesting() {
    this.components.testSuite = new E2ETestSuite(
      this.components.orchestrator,
      this.components.qcEngine,
      this.components.logger
    );

    await this.components.testSuite.initializeTestEnvironment();

    console.log('🧪 Testing framework initialized');
  }

  /**
   * Initialize monitoring and health checks
   */
  async initializeMonitoring() {
    this.healthChecks = {
      airtable: () => this.checkAirtableHealth(),
      gemini: () => this.checkGeminiHealth(),
      cloudUpload: () => this.checkCloudUploadHealth(),
      qcEngine: () => this.checkQCEngineHealth(),
      stateMachine: () => this.checkStateMachineHealth()
    };

    // Start periodic health checks
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, 60000); // Every minute

    console.log('💊 Monitoring initialized');
  }

  /**
   * Validate system configuration and dependencies
   */
  async validateSystem() {
    const validationResults = {
      environment: true,
      services: {},
      warnings: [],
      errors: []
    };

    // Validate environment variables
    const requiredEnvVars = [
      'GEMINI_API_KEY',
      'AIRTABLE_API_KEY',
      'AIRTABLE_BASE_ID'
    ];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        validationResults.errors.push(`Missing environment variable: ${envVar}`);
        validationResults.environment = false;
      }
    }

    // Validate service configurations
    for (const [name, component] of Object.entries(this.components)) {
      try {
        if (component.isConfigured) {
          const configured = component.isConfigured();
          validationResults.services[name] = configured;
          
          if (!configured.hasAnyService && configured.warnings) {
            validationResults.warnings.push(...configured.warnings);
          }
        } else {
          validationResults.services[name] = { available: true };
        }
      } catch (error) {
        validationResults.services[name] = { 
          available: false, 
          error: error.message 
        };
        validationResults.errors.push(`${name}: ${error.message}`);
      }
    }

    this.components.logger.logEvent('info', 'system-validation-completed', {
      environment: validationResults.environment,
      services: Object.keys(validationResults.services).length,
      warnings: validationResults.warnings.length,
      errors: validationResults.errors.length,
      category: 'system-validation'
    });

    if (validationResults.errors.length > 0) {
      console.warn('⚠️  System validation warnings:', validationResults.warnings);
      console.error('❌ System validation errors:', validationResults.errors);
    }

    return validationResults;
  }

  /**
   * Process single image through complete restoration pipeline
   */
  async processImage(request) {
    if (!this.initialized) {
      throw new Error('ADK Restoration Service not initialized');
    }

    const correlationId = this.components.logger.startRequest(
      request.sessionId || null,
      'image-restoration',
      {
        mode: request.mode,
        hasWorkflow: !!request.workflowId,
        source: request.source || 'api'
      }
    );

    let jobId = null;

    try {
      // Handle imageUrl by downloading the image first
      let imageData = request.imageData;
      if (!imageData && request.imageUrl) {
        console.log(`Downloading image from URL: ${request.imageUrl}`);
        imageData = await this.components.orchestrator.fileManager.downloadImage(request.imageUrl);
      }

      if (!imageData) {
        throw new Error('No image data provided - either imageData or imageUrl is required');
      }

      // 1. Check idempotency
      const idempotencyCheck = await this.components.idempotency.checkForDuplicateRun(
        imageData,
        request.mode,
        request.workflowId,
        {
          source: request.source,
          userId: request.userId
        }
      );

      if (idempotencyCheck.isDuplicate) {
        this.components.logger.logEvent('info', 'duplicate-request-detected', {
          contentHash: idempotencyCheck.contentHash,
          existingResult: idempotencyCheck.existingResult.id,
          category: 'idempotency'
        }, correlationId);

        return {
          success: true,
          duplicate: true,
          result: idempotencyCheck.existingResult,
          contentHash: idempotencyCheck.contentHash
        };
      }

      // 2. Create photo record with idempotency data
      const photoRecord = await this.components.idempotency.createPhotoRecordWithIdempotency(
        imageData,
        request.mode,
        request.workflowId,
        {
          source: request.source,
          userId: request.userId
        }
      );

      // 3. Create job in state machine
      jobId = await this.components.stateMachine.createJob(
        this.components.idempotency.generateRunId(idempotencyCheck.contentHash),
        request.sessionId || this.components.idempotency.generateSessionId(),
        photoRecord.recordId,
        request.mode,
        {
          contentHash: idempotencyCheck.contentHash,
          idempotencyKey: idempotencyCheck.idempotencyKey,
          workflowId: request.workflowId,
          source: request.source
        }
      );

      // 4. Process through orchestrator with state tracking
      const result = await this.processImageWithStateTracking(
        jobId,
        request,
        correlationId
      );

      // 5. Upload result to cloud storage
      let resultUrl = null;
      if (this.config.enableCloudUpload && result.success) {
        const uploadResult = await this.components.cloudUpload.uploadWithFallback(
          result.finalImageData,
          {
            sessionId: request.sessionId,
            qualityScore: result.qualityScore,
            mode: request.mode,
            originalFilename: request.filename
          }
        );

        if (uploadResult.success) {
          resultUrl = uploadResult.url;
        }
      }

      // 6. Update photo record with final results
      await this.components.idempotency.updatePhotoRecordWithResults(
        photoRecord.recordId,
        {
          status: result.success ? 'Completed' : 'Failed',
          qualityScore: result.qualityScore,
          preservationScore: result.validationResults?.preservationScore,
          defectRemovalScore: result.validationResults?.defectRemovalScore,
          enhancementScore: result.validationResults?.enhancementScore,
          naturalnessScore: result.validationResults?.naturalnessScore,
          technicalScore: result.validationResults?.technicalScore,
          qcDecision: result.qcDecision?.action,
          resultUrl: resultUrl,
          processingTime: result.processingTime,
          retryCount: result.retryCount || 0,
          routerRulesVersion: '1.0.0',
          notes: result.notes,
          error: result.error
        },
        idempotencyCheck.contentHash,
        idempotencyCheck.idempotencyKey
      );

      this.components.logger.endRequest(correlationId, 'success', {
        qualityScore: result.qualityScore,
        processingTime: result.processingTime,
        retryCount: result.retryCount || 0
      });

      return {
        success: result.success,
        jobId,
        recordId: photoRecord.recordId,
        result: {
          ...result,
          resultUrl,
          contentHash: idempotencyCheck.contentHash,
          idempotencyKey: idempotencyKey.idempotencyKey
        }
      };

    } catch (error) {
      if (jobId) {
        await this.components.stateMachine.transitionTo(jobId, 'FAILED', error.message);
      }

      this.components.logger.logError(error, {
        correlationId,
        jobId,
        context: 'image-processing'
      });

      this.components.logger.endRequest(correlationId, 'error', {
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Process image with complete state tracking
   */
  async processImageWithStateTracking(jobId, request, correlationId) {
    const job = this.components.stateMachine.getJobState(jobId);
    const startTime = Date.now();

    try {
      // Analysis phase
      await this.components.stateMachine.transitionTo(jobId, 'ANALYZING', 'Starting image analysis');
      
      this.components.logger.logJobEvent(jobId, job.sessionId, 'analysis-started');
      const analysis = await this.components.orchestrator.analysisAgent.analyzeImage(request.imageData);
      
      // Planning phase
      await this.components.stateMachine.transitionTo(
        jobId, 
        'PLANNING', 
        'Creating restoration plan',
        { analysisResults: analysis }
      );
      
      this.components.logger.logJobEvent(jobId, job.sessionId, 'planning-started');
      const plan = await this.components.orchestrator.plannerAgent.createPlan(analysis, request.mode);
      
      // Editing phase
      await this.components.stateMachine.transitionTo(
        jobId,
        'EDITING',
        'Applying restoration steps',
        { restorationPlan: plan }
      );
      
      this.components.logger.logJobEvent(jobId, job.sessionId, 'editing-started', {
        stepsCount: plan.steps.length
      });
      
      const editResult = await this.components.orchestrator.editorAgent.batchEdit(
        request.imageData, 
        plan.steps
      );

      // Validation phase
      await this.components.stateMachine.transitionTo(
        jobId,
        'VALIDATING',
        'Validating restoration results',
        { editingResults: editResult }
      );
      
      this.components.logger.logJobEvent(jobId, job.sessionId, 'validation-started');
      const validation = await this.components.orchestrator.validatorAgent.validateRestoration(
        request.imageData,
        editResult.finalImageData,
        plan
      );

      // QC Decision phase
      const qcDecision = await this.components.qcEngine.decide(
        job.sessionId,
        validation,
        {
          mode: request.mode,
          analysis,
          plan,
          retryCount: 0
        }
      );

      await this.components.stateMachine.transitionTo(
        jobId,
        'DECIDED',
        `QC Decision: ${qcDecision.action}`,
        {
          qcDecision,
          validationResults: validation
        }
      );

      // Handle retry if needed
      if (qcDecision.shouldRetry) {
        const retryResult = await this.components.retryControl.processRetryDecision(
          jobId,
          validation,
          {
            sessionId: job.sessionId,
            mode: request.mode,
            originalParameters: { mode: request.mode },
            retryCount: 0
          }
        );

        if (retryResult.action === 'RETRY_INITIATED') {
          // Retry will be handled by the retry control loop
          return {
            success: false,
            retry: true,
            retryAttempt: retryResult.attemptNumber,
            reason: retryResult.reason
          };
        }
      }

      const processingTime = Date.now() - startTime;
      
      // Log final metrics
      this.components.logger.logProcessingMetrics(jobId, job.sessionId, {
        processingTime,
        stepsCompleted: editResult.results.filter(r => r.success).length,
        totalSteps: editResult.results.length,
        retryCount: 0,
        qualityScore: validation.overallScore
      });

      return {
        success: true,
        finalImageData: editResult.finalImageData,
        qualityScore: validation.overallScore,
        validationResults: validation,
        qcDecision,
        processingTime,
        stepsCompleted: editResult.results.filter(r => r.success).length,
        totalSteps: editResult.results.length,
        retryCount: 0
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      this.components.logger.logProcessingMetrics(jobId, job.sessionId, {
        processingTime,
        stepsCompleted: 0,
        totalSteps: 0,
        retryCount: 0,
        error: error.message
      });

      return {
        success: false,
        error: error.message,
        processingTime
      };
    }
  }

  /**
   * Create batch processing job
   */
  async createBatchJob(batchConfig) {
    if (!this.initialized) {
      throw new Error('ADK Restoration Service not initialized');
    }

    if (!this.config.enableBatchProcessing) {
      throw new Error('Batch processing is disabled');
    }

    return await this.components.batchManager.createBatch(batchConfig);
  }

  /**
   * Run test suite
   */
  async runTests(suiteKey, options = {}) {
    if (!this.initialized) {
      throw new Error('ADK Restoration Service not initialized');
    }

    if (!this.config.enableTesting) {
      throw new Error('Testing is disabled');
    }

    return await this.components.testSuite.runTestSuite(suiteKey, options);
  }

  /**
   * Perform health checks
   */
  async performHealthChecks() {
    const healthStatus = {
      overall: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {}
    };

    for (const [name, checkFn] of Object.entries(this.healthChecks)) {
      try {
        const result = await checkFn();
        healthStatus.checks[name] = {
          status: result.healthy ? 'healthy' : 'unhealthy',
          ...result
        };

        if (!result.healthy) {
          healthStatus.overall = 'unhealthy';
        }
      } catch (error) {
        healthStatus.checks[name] = {
          status: 'error',
          error: error.message
        };
        healthStatus.overall = 'unhealthy';
      }
    }

    this.components.logger.logEvent('info', 'health-check-completed', {
      overall: healthStatus.overall,
      checks: Object.keys(healthStatus.checks).length,
      category: 'health-monitoring'
    });

    return healthStatus;
  }

  /**
   * Health check implementations
   */
  async checkAirtableHealth() {
    try {
      const photos = await this.components.airtable.getRecentPhotos(null, 1);
      return { healthy: true, records: photos.length };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }

  async checkGeminiHealth() {
    try {
      // Simple test - this would be implementation specific
      return { healthy: true, service: 'gemini-api' };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }

  async checkCloudUploadHealth() {
    if (!this.components.cloudUpload) {
      return { healthy: true, disabled: true };
    }

    try {
      const config = this.components.cloudUpload.isConfigured();
      return { 
        healthy: config.hasAnyService,
        configured: config.cloudinary,
        warnings: config.warnings
      };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }

  async checkQCEngineHealth() {
    try {
      const stats = this.components.qcEngine.getDecisionStats();
      return { healthy: true, decisions: stats.total };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }

  async checkStateMachineHealth() {
    try {
      const stats = this.components.stateMachine.getJobStatistics();
      return { 
        healthy: true, 
        activeJobs: stats.activeProcessing,
        totalJobs: stats.total 
      };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }

  /**
   * Get system status
   */
  getSystemStatus() {
    if (!this.initialized) {
      return { status: 'not-initialized' };
    }

    const status = {
      service: this.config.serviceName,
      version: this.config.version,
      environment: this.config.environment,
      initialized: this.initialized,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      components: Object.keys(this.components),
      statistics: {}
    };

    // Collect statistics from components
    try {
      if (this.components.stateMachine) {
        status.statistics.jobs = this.components.stateMachine.getJobStatistics();
      }

      if (this.components.qcEngine) {
        status.statistics.qc = this.components.qcEngine.getDecisionStats();
      }

      if (this.components.batchManager) {
        status.statistics.batches = this.components.batchManager.getBatchStatistics();
      }

      if (this.components.retryControl) {
        status.statistics.retries = this.components.retryControl.getRetryStatistics();
      }

      if (this.components.logger) {
        status.statistics.logging = this.components.logger.getStats();
      }
    } catch (error) {
      status.statisticsError = error.message;
    }

    return status;
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log('🛑 Shutting down ADK Restoration Service...');

    try {
      // Clear health check interval
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
      }

      // Cleanup components
      if (this.components.filesApi) {
        await this.components.filesApi.cleanup();
      }

      if (this.components.batchManager) {
        await this.components.batchManager.cleanupCompletedBatches();
      }

      if (this.components.retryControl) {
        this.components.retryControl.cleanupRetryHistory();
      }

      if (this.components.logger) {
        this.components.logger.cleanup();
        this.components.logger.logEvent('info', 'system-shutdown', {
          graceful: true,
          category: 'system-lifecycle'
        });
      }

      this.initialized = false;
      
      console.log('✅ ADK Restoration Service shut down gracefully');

    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      throw error;
    }
  }
}