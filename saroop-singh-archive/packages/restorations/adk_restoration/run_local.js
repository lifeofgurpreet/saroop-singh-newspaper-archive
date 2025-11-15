#!/usr/bin/env node

/**
 * Local CLI Runner for ADK Restoration System
 * Processes entire folders of images without Airtable dependency
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { OrchestratorAgent } from './src/agents/OrchestratorAgent.js';
import { FilesApiManager } from './src/tools/FilesApiManager.js';
import { BatchApiManager } from './src/tools/BatchApiManager.js';
import { AutoRetryManager } from './src/utils/AutoRetryManager.js';
import winston from 'winston';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

class LocalCliRunner {
  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
          return `[${timestamp}] [CLI] ${level}: ${message}`;
        })
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ 
          filename: path.join(__dirname, 'logs', 'cli_runner.log'),
          maxsize: 5242880, // 5MB
          maxFiles: 5
        })
      ]
    });

    // Initialize components
    this.orchestrator = new OrchestratorAgent();
    this.filesApi = new FilesApiManager();
    this.batchManager = new BatchApiManager();
    this.retryManager = new AutoRetryManager();

    // Configuration
    this.supportedFormats = ['.jpg', '.jpeg', '.png', '.tiff', '.bmp'];
    this.outputDir = null;
    this.sessionMap = new Map(); // filename -> sessionId
    this.results = [];
  }

  async init() {
    // Ensure logs directory exists
    await fs.mkdir(path.join(__dirname, 'logs'), { recursive: true });
    
    this.logger.info('ADK Restoration CLI Runner initialized');
  }

  /**
   * Main CLI entry point
   */
  async run() {
    try {
      await this.init();
      
      const args = process.argv.slice(2);
      const command = args[0];

      switch (command) {
        case 'process-folder':
          await this.processFolderCommand(args.slice(1));
          break;
        case 'process-batch':
          await this.processBatchCommand(args.slice(1));
          break;
        case 'process-single':
          await this.processSingleCommand(args.slice(1));
          break;
        case 'status':
          await this.statusCommand(args.slice(1));
          break;
        case 'cleanup':
          await this.cleanupCommand();
          break;
        default:
          this.showHelp();
          break;
      }

    } catch (error) {
      this.logger.error(`CLI execution failed: ${error.message}`);
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  }

  /**
   * Process entire folder of images
   */
  async processFolderCommand(args) {
    const folderPath = args[0];
    const outputPath = args[1] || path.join(folderPath, 'restored');
    const mode = args[2] || 'RESTORE';
    const options = this.parseOptions(args.slice(3));

    if (!folderPath) {
      throw new Error('Folder path is required: run_local.js process-folder <folder-path> [output-path] [mode] [options]');
    }

    this.logger.info(`Processing folder: ${folderPath}`);
    this.logger.info(`Output directory: ${outputPath}`);
    this.logger.info(`Mode: ${mode}`);

    // Ensure output directory exists
    await fs.mkdir(outputPath, { recursive: true });
    this.outputDir = outputPath;

    // Find all image files
    const imageFiles = await this.findImageFiles(folderPath);
    
    if (imageFiles.length === 0) {
      this.logger.warn('No image files found in folder');
      return;
    }

    this.logger.info(`Found ${imageFiles.length} image files`);

    // Process based on options
    if (options.batch) {
      await this.processFolderAsBatch(imageFiles, mode, options);
    } else {
      await this.processFolderSequentially(imageFiles, mode, options);
    }

    // Generate report
    await this.generateReport();
    
    this.logger.info('Folder processing completed');
  }

  /**
   * Process images as a batch job
   */
  async processFolderAsBatch(imageFiles, mode, options) {
    this.logger.info('Processing folder as batch job');

    // Create batch items
    const batchItems = imageFiles.map(filePath => ({
      photoRecordId: path.basename(filePath, path.extname(filePath)),
      filePath: filePath,
      mode: mode
    }));

    // Create batch job
    const batchConfig = {
      items: batchItems,
      defaultMode: mode,
      delayBetweenItems: options.delay || 2000
    };

    const batchId = this.batchManager.createBatchJob(batchConfig);
    this.logger.info(`Batch job created: ${batchId}`);

    // Listen for batch events
    this.batchManager.on('batchProgress', (job) => {
      const progress = job.progress.percentage;
      this.logger.info(`Batch progress: ${progress}% (${job.progress.completed}/${job.progress.total})`);
    });

    this.batchManager.on('batchCompleted', async (job) => {
      this.logger.info(`Batch completed: ${job.progress.completed} successful, ${job.progress.failed} failed`);
      await this.processBatchResults(job);
    });

    // Process batch (this would normally be handled by the batch manager's processing loop)
    await this.processBatchJobDirectly(batchId, imageFiles);
  }

  /**
   * Process images sequentially
   */
  async processFolderSequentially(imageFiles, mode, options) {
    this.logger.info('Processing folder sequentially');

    let processed = 0;
    const total = imageFiles.length;

    for (const filePath of imageFiles) {
      try {
        processed++;
        this.logger.info(`Processing ${processed}/${total}: ${path.basename(filePath)}`);

        const result = await this.processSingleFile(filePath, mode, options);
        this.results.push(result);

        // Apply delay if specified
        if (options.delay && processed < total) {
          await this.sleep(options.delay);
        }

      } catch (error) {
        this.logger.error(`Failed to process ${filePath}: ${error.message}`);
        this.results.push({
          filePath: filePath,
          success: false,
          error: error.message
        });
      }
    }
  }

  /**
   * Process a single file
   */
  async processSingleFile(filePath, mode, options = {}) {
    const startTime = Date.now();
    const filename = path.basename(filePath);
    
    try {
      // Read image file
      const imageBuffer = await fs.readFile(filePath);
      const imageData = imageBuffer.toString('base64');

      // Create local session ID
      const sessionId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
      this.sessionMap.set(filename, sessionId);

      // Process through orchestrator pipeline
      this.logger.info(`Analyzing image: ${filename}`);
      const analysis = await this.orchestrator.analysisAgent.analyzeImage(imageData);

      this.logger.info(`Creating restoration plan: ${filename}`);
      const plan = await this.orchestrator.plannerAgent.createPlan(analysis, mode);

      this.logger.info(`Applying ${plan.steps.length} restoration steps: ${filename}`);
      const editResult = await this.orchestrator.editorAgent.batchEdit(imageData, plan.steps);

      this.logger.info(`Validating result: ${filename}`);
      const validation = await this.orchestrator.validatorAgent.validateRestoration(
        imageData,
        editResult.finalImageData,
        plan
      );

      // Check if retry is needed
      let finalResult = editResult;
      let finalValidation = validation;
      let retryCount = 0;

      if (options.autoRetry !== false) {
        const retryDecision = this.retryManager.shouldAutoRetry(
          sessionId,
          validation,
          { mode, analysis, plan }
        );

        while (retryDecision.shouldRetry && retryCount < 3) {
          this.logger.info(`Auto-retrying ${filename} (attempt ${retryCount + 1}): ${retryDecision.reasons?.join(', ')}`);
          
          const adjustments = this.retryManager.generateRetryParameters(
            sessionId,
            finalValidation,
            plan,
            retryDecision.reasons
          );

          const adjustedPlan = this.retryManager.applyAdjustmentsToPlan(plan, adjustments);
          this.retryManager.incrementRetryCount(sessionId);

          // Retry with adjusted parameters
          const retryEditResult = await this.orchestrator.editorAgent.batchEdit(imageData, adjustedPlan.steps);
          const retryValidation = await this.orchestrator.validatorAgent.validateRestoration(
            imageData,
            retryEditResult.finalImageData,
            adjustedPlan
          );

          if (retryValidation.overallScore > finalValidation.overallScore) {
            finalResult = retryEditResult;
            finalValidation = retryValidation;
            this.logger.info(`Retry improved quality: ${finalValidation.overallScore} > ${validation.overallScore}`);
          }

          retryCount++;
          
          // Check if we should retry again
          if (finalValidation.overallScore >= 70) {
            break; // Good enough
          }
        }
      }

      // Save result
      const outputFilename = `restored_${filename}`;
      const outputPath = path.join(this.outputDir, outputFilename);
      
      const resultBuffer = Buffer.from(finalResult.finalImageData, 'base64');
      await fs.writeFile(outputPath, resultBuffer);

      const processingTime = (Date.now() - startTime) / 1000;
      
      const result = {
        filePath: filePath,
        outputPath: outputPath,
        filename: filename,
        success: true,
        sessionId: sessionId,
        qualityScore: finalValidation.overallScore,
        recommendation: finalValidation.recommendation,
        processingTime: processingTime,
        stepsCompleted: finalResult.results.filter(r => r.success).length,
        totalSteps: finalResult.results.length,
        retryCount: retryCount,
        analysis: analysis,
        validation: finalValidation,
        metadata: {
          mode: mode,
          originalSize: imageBuffer.length,
          resultSize: resultBuffer.length
        }
      };

      this.logger.info(`Successfully processed ${filename}: Quality ${finalValidation.overallScore}/100, Time ${processingTime.toFixed(2)}s`);
      
      return result;

    } catch (error) {
      this.logger.error(`Failed to process ${filename}: ${error.message}`);
      
      return {
        filePath: filePath,
        filename: filename,
        success: false,
        error: error.message,
        processingTime: (Date.now() - startTime) / 1000
      };
    }
  }

  /**
   * Process single image command
   */
  async processSingleCommand(args) {
    const inputFile = args[0];
    const outputFile = args[1] || inputFile.replace(/\.[^.]+$/, '_restored$&');
    const mode = args[2] || 'RESTORE';
    const options = this.parseOptions(args.slice(3));

    if (!inputFile) {
      throw new Error('Input file is required: run_local.js process-single <input-file> [output-file] [mode] [options]');
    }

    this.logger.info(`Processing single file: ${inputFile}`);
    
    this.outputDir = path.dirname(outputFile);
    await fs.mkdir(this.outputDir, { recursive: true });

    const result = await this.processSingleFile(inputFile, mode, options);
    
    if (result.success) {
      // Move result to specified output location
      await fs.copyFile(result.outputPath, outputFile);
      await fs.unlink(result.outputPath);
      result.outputPath = outputFile;
    }

    this.results = [result];
    await this.generateReport();

    this.logger.info('Single file processing completed');
  }

  /**
   * Show processing status
   */
  async statusCommand(args) {
    const sessionId = args[0];

    if (sessionId) {
      // Show specific session status
      const session = this.orchestrator.getSession(sessionId);
      if (session) {
        console.log(JSON.stringify(session, null, 2));
      } else {
        console.log(`Session not found: ${sessionId}`);
      }
    } else {
      // Show general status
      const sessions = this.orchestrator.getAllSessions();
      const batchStats = this.batchManager.getBatchStatistics();
      const retryStats = this.retryManager.getRetryStatistics();

      const status = {
        activeSessions: sessions.length,
        batchJobs: batchStats,
        retryStatistics: retryStats,
        recentSessions: sessions.slice(-5).map(s => ({
          id: s.id,
          status: s.status,
          startTime: s.startTime
        }))
      };

      console.log(JSON.stringify(status, null, 2));
    }
  }

  /**
   * Cleanup resources
   */
  async cleanupCommand() {
    this.logger.info('Starting cleanup...');
    
    try {
      // Cleanup Files API uploads
      await this.filesApi.cleanup();
      
      // Cleanup old batch jobs
      const cleanedJobs = await this.batchManager.cleanupOldJobs();
      
      // Cleanup retry history
      this.retryManager.cleanupRetryHistory();
      
      this.logger.info(`Cleanup completed: ${cleanedJobs} old batch jobs removed`);
      
    } catch (error) {
      this.logger.error(`Cleanup failed: ${error.message}`);
    }
  }

  /**
   * Find all image files in directory
   */
  async findImageFiles(dirPath, recursive = true) {
    const imageFiles = [];
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory() && recursive) {
          const subFiles = await this.findImageFiles(fullPath, recursive);
          imageFiles.push(...subFiles);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (this.supportedFormats.includes(ext)) {
            imageFiles.push(fullPath);
          }
        }
      }
    } catch (error) {
      this.logger.error(`Failed to read directory ${dirPath}: ${error.message}`);
    }
    
    return imageFiles;
  }

  /**
   * Parse command line options
   */
  parseOptions(args) {
    const options = {};
    
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      if (arg.startsWith('--')) {
        const key = arg.slice(2);
        const value = args[i + 1];
        
        if (value && !value.startsWith('--')) {
          options[key] = value;
          i++; // Skip next argument
        } else {
          options[key] = true;
        }
      }
    }
    
    return options;
  }

  /**
   * Generate processing report
   */
  async generateReport() {
    const reportPath = path.join(this.outputDir, 'restoration_report.json');
    
    const summary = {
      timestamp: new Date().toISOString(),
      totalFiles: this.results.length,
      successful: this.results.filter(r => r.success).length,
      failed: this.results.filter(r => !r.success).length,
      averageQualityScore: 0,
      totalProcessingTime: 0,
      results: this.results
    };
    
    const successfulResults = this.results.filter(r => r.success && r.qualityScore);
    if (successfulResults.length > 0) {
      summary.averageQualityScore = (
        successfulResults.reduce((sum, r) => sum + r.qualityScore, 0) / successfulResults.length
      ).toFixed(2);
    }
    
    summary.totalProcessingTime = this.results
      .reduce((sum, r) => sum + (r.processingTime || 0), 0)
      .toFixed(2);
    
    await fs.writeFile(reportPath, JSON.stringify(summary, null, 2));
    
    this.logger.info(`Report generated: ${reportPath}`);
    
    // Log summary
    console.log(`\\n=== Processing Summary ===`);
    console.log(`Total files: ${summary.totalFiles}`);
    console.log(`Successful: ${summary.successful}`);
    console.log(`Failed: ${summary.failed}`);
    console.log(`Average quality score: ${summary.averageQualityScore}`);
    console.log(`Total processing time: ${summary.totalProcessingTime}s`);
    console.log(`Report: ${reportPath}`);
  }

  /**
   * Show help information
   */
  showHelp() {
    console.log(`
ADK Restoration CLI Runner

Usage:
  node run_local.js <command> [options]

Commands:
  process-folder <folder> [output] [mode] [options]
    Process entire folder of images
    
  process-single <input> [output] [mode] [options]  
    Process single image file
    
  process-batch <config-file>
    Process images using batch configuration file
    
  status [session-id]
    Show processing status
    
  cleanup
    Clean up temporary files and resources

Modes:
  RESTORE    - Conservative restoration (default)
  ENHANCE    - Quality enhancement
  REIMAGINE  - Creative restoration

Options:
  --batch           Process folder as batch job
  --delay <ms>      Delay between files (default: 2000)
  --auto-retry      Enable auto-retry on QC failure (default: true)
  --no-auto-retry   Disable auto-retry
  --recursive       Process subdirectories (default: true)

Examples:
  node run_local.js process-folder ./old-photos ./restored RESTORE
  node run_local.js process-single photo.jpg restored_photo.jpg ENHANCE
  node run_local.js process-folder ./batch --batch --delay 5000
  node run_local.js status
  node run_local.js cleanup
    `);
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run CLI if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new LocalCliRunner();
  runner.run().catch(console.error);
}

export { LocalCliRunner };