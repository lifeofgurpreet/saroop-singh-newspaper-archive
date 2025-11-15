#!/usr/bin/env node

/**
 * ADK Restoration System - Main Entry Point
 * Complete restoration system with all P0 requirements implemented
 */

import dotenv from 'dotenv';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { AdkRestorationService } from './services/AdkRestorationService.js';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

class AdkRestorationApp {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.service = null;
  }

  /**
   * Initialize the application
   */
  async initialize() {
    try {
      console.log('🔧 Initializing ADK Restoration Application...');

      // Setup Express middleware
      this.setupMiddleware();
      
      // Initialize the restoration service
      this.service = new AdkRestorationService({
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0',
        enableCloudUpload: true,
        enableBatchProcessing: true,
        enableTesting: true,
        maxConcurrentJobs: parseInt(process.env.MAX_CONCURRENT_JOBS) || 5
      });

      await this.service.initialize();

      // Setup API routes
      this.setupRoutes();

      // Setup error handling
      this.setupErrorHandling();

      // Setup graceful shutdown
      this.setupGracefulShutdown();

      console.log('✅ ADK Restoration Application initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize application:', error);
      process.exit(1);
    }
  }

  /**
   * Setup Express middleware
   */
  setupMiddleware() {
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    // CORS middleware
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    // Request logging
    this.app.use((req, res, next) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
      });
      
      next();
    });
  }

  /**
   * Setup API routes
   */
  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', async (req, res) => {
      try {
        const health = await this.service.performHealthChecks();
        const statusCode = health.overall === 'healthy' ? 200 : 503;
        res.status(statusCode).json(health);
      } catch (error) {
        res.status(500).json({
          overall: 'error',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // System status endpoint
    this.app.get('/status', (req, res) => {
      try {
        const status = this.service.getSystemStatus();
        res.json(status);
      } catch (error) {
        res.status(500).json({
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Process single image
    this.app.post('/api/process', async (req, res) => {
      try {
        const {
          imageUrl,
          imageData,
          mode = 'RESTORE',
          workflowId,
          sessionId,
          filename,
          source = 'api',
          userId
        } = req.body;

        if (!imageUrl && !imageData) {
          return res.status(400).json({
            error: 'Either imageUrl or imageData is required'
          });
        }

        const request = {
          imageUrl,
          imageData,
          mode,
          workflowId,
          sessionId: sessionId || `api_${Date.now()}`,
          filename,
          source,
          userId
        };

        const result = await this.service.processImage(request);

        res.json({
          success: true,
          ...result
        });

      } catch (error) {
        console.error('Processing error:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Create batch job
    this.app.post('/api/batch', async (req, res) => {
      try {
        const batchConfig = req.body;
        const batchId = await this.service.createBatchJob(batchConfig);
        
        res.json({
          success: true,
          batchId
        });

      } catch (error) {
        console.error('Batch creation error:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Get batch status
    this.app.get('/api/batch/:batchId', (req, res) => {
      try {
        const batch = this.service.components.batchManager?.getBatch(req.params.batchId);
        
        if (!batch) {
          return res.status(404).json({
            error: 'Batch not found'
          });
        }

        res.json(batch);

      } catch (error) {
        console.error('Batch status error:', error);
        res.status(500).json({
          error: error.message
        });
      }
    });

    // Cancel batch
    this.app.delete('/api/batch/:batchId', async (req, res) => {
      try {
        await this.service.components.batchManager?.cancelBatch(
          req.params.batchId,
          'Cancelled via API'
        );
        
        res.json({
          success: true,
          message: 'Batch cancelled'
        });

      } catch (error) {
        console.error('Batch cancellation error:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Run tests
    this.app.post('/api/test/:suiteKey', async (req, res) => {
      try {
        const { suiteKey } = req.params;
        const options = req.body || {};
        
        const results = await this.service.runTests(suiteKey, options);
        
        res.json({
          success: true,
          results
        });

      } catch (error) {
        console.error('Test execution error:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Get job status
    this.app.get('/api/job/:jobId', (req, res) => {
      try {
        const job = this.service.components.stateMachine?.getJobState(req.params.jobId);
        
        if (!job) {
          return res.status(404).json({
            error: 'Job not found'
          });
        }

        const history = this.service.components.stateMachine?.getJobHistory(req.params.jobId);

        res.json({
          job,
          history
        });

      } catch (error) {
        console.error('Job status error:', error);
        res.status(500).json({
          error: error.message
        });
      }
    });

    // API documentation
    this.app.get('/api/docs', (req, res) => {
      const docs = {
        service: 'ADK Restoration System',
        version: '1.0.0',
        endpoints: {
          'GET /health': 'System health check',
          'GET /status': 'System status and statistics',
          'POST /api/process': 'Process single image',
          'POST /api/batch': 'Create batch processing job',
          'GET /api/batch/:batchId': 'Get batch status',
          'DELETE /api/batch/:batchId': 'Cancel batch job',
          'POST /api/test/:suiteKey': 'Run test suite',
          'GET /api/job/:jobId': 'Get job status and history'
        },
        features: {
          'Cloud Upload': 'Images uploaded to Cloudinary for Airtable display',
          'Files API': 'Automatic handling of large images (>20MB)',
          'Idempotency': 'SHA256 content hashing prevents duplicate processing',
          'QC Engine': 'Quality control with automatic retry logic',
          'State Machine': 'Complete job lifecycle management',
          'Batch Processing': 'Concurrent processing with queue management',
          'Testing': 'End-to-end testing with golden fixtures',
          'Structured Logging': 'JSON logging with correlation IDs',
          'Monitoring': 'Health checks and performance metrics'
        }
      };

      res.json(docs);
    });

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        service: 'ADK Restoration System',
        version: '1.0.0',
        status: 'operational',
        docs: '/api/docs',
        health: '/health',
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Setup error handling
   */
  setupErrorHandling() {
    // Handle 404
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        path: req.originalUrl,
        method: req.method
      });
    });

    // Global error handler
    this.app.use((error, req, res, next) => {
      console.error('Unhandled error:', error);
      
      res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
        timestamp: new Date().toISOString()
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      this.shutdown().finally(() => {
        process.exit(1);
      });
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      this.shutdown().finally(() => {
        process.exit(1);
      });
    });
  }

  /**
   * Setup graceful shutdown
   */
  setupGracefulShutdown() {
    const shutdownSignals = ['SIGTERM', 'SIGINT'];

    for (const signal of shutdownSignals) {
      process.on(signal, () => {
        console.log(`\\n🛑 Received ${signal}, starting graceful shutdown...`);
        this.shutdown();
      });
    }
  }

  /**
   * Start the application
   */
  async start() {
    await this.initialize();

    return new Promise((resolve) => {
      this.server = this.app.listen(this.port, () => {
        console.log(`\\n🚀 ADK Restoration System running on port ${this.port}`);
        console.log(`📚 API Documentation: http://localhost:${this.port}/api/docs`);
        console.log(`💊 Health Check: http://localhost:${this.port}/health`);
        console.log(`📊 System Status: http://localhost:${this.port}/status`);
        console.log(`\\n✅ All P0 requirements implemented:`);
        console.log(`   ✅ Cloud image upload for Airtable`);
        console.log(`   ✅ Gemini Files API for large images`);
        console.log(`   ✅ Complete Airtable schema`);
        console.log(`   ✅ SHA256 idempotency system`);
        console.log(`   ✅ QC decision engine`);
        console.log(`   ✅ Job state machine`);
        console.log(`   ✅ Structured JSON logging`);
        console.log(`   ✅ Auto-retry control loops`);
        console.log(`   ✅ Batch processing with concurrency`);
        console.log(`   ✅ E2E testing suite`);
        resolve();
      });
    });
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    try {
      if (this.server) {
        console.log('🔌 Closing HTTP server...');
        await new Promise((resolve) => {
          this.server.close(resolve);
        });
      }

      if (this.service) {
        await this.service.shutdown();
      }

      console.log('✅ Application shut down gracefully');
      process.exit(0);

    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  }
}

// Start the application if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const app = new AdkRestorationApp();
  app.start().catch((error) => {
    console.error('❌ Failed to start application:', error);
    process.exit(1);
  });
}

export { AdkRestorationApp };