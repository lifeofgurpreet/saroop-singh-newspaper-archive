/**
 * Test Runner for ADK Restoration System
 * Tests the complete pipeline with various scenarios
 */

import dotenv from 'dotenv';
import { OrchestratorAgent } from './agents/index.js';
import { AirtableManager } from './tools/index.js';
import { FileManager } from './utils/index.js';

// Load environment variables
dotenv.config();

class TestRunner {
  constructor() {
    this.orchestrator = new OrchestratorAgent();
    this.airtableManager = new AirtableManager();
    this.fileManager = new FileManager();
    this.results = {
      tests: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async runTest(testName, testFunction, ...args) {
    this.log(`Starting test: ${testName}`);
    this.results.totalTests++;
    
    const startTime = Date.now();
    
    try {
      const result = await testFunction.call(this, ...args);
      const duration = Date.now() - startTime;
      
      this.log(`✅ Test passed: ${testName} (${duration}ms)`, 'success');
      this.results.passedTests++;
      this.results.tests.push({
        name: testName,
        status: 'PASSED',
        duration,
        result
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.log(`❌ Test failed: ${testName} - ${error.message} (${duration}ms)`, 'error');
      this.results.failedTests++;
      this.results.tests.push({
        name: testName,
        status: 'FAILED',
        duration,
        error: error.message,
        stack: error.stack
      });
      
      return null;
    }
  }

  async testEnvironmentSetup() {
    // Check required environment variables
    const required = ['GEMINI_API_KEY', 'AIRTABLE_API_KEY', 'AIRTABLE_BASE_ID'];
    for (const key of required) {
      if (!process.env[key]) {
        throw new Error(`Missing required environment variable: ${key}`);
      }
    }

    // Test Airtable connection
    try {
      const workflows = await this.airtableManager.getAllWorkflows();
      this.log(`Connected to Airtable, found ${workflows.length} workflows`);
    } catch (error) {
      throw new Error(`Airtable connection failed: ${error.message}`);
    }

    return { status: 'Environment setup verified' };
  }

  async testAirtableOperations() {
    // Test getting workflows
    const workflows = await this.airtableManager.getAllWorkflows();
    if (workflows.length === 0) {
      throw new Error('No workflows found in Airtable');
    }

    // Test getting recent photos
    const photos = await this.airtableManager.getRecentPhotos(null, 5);
    if (photos.length === 0) {
      throw new Error('No photos found in PhotoGallery table');
    }

    this.log(`Found ${workflows.length} workflows and ${photos.length} photos`);
    return { 
      workflows: workflows.length, 
      photos: photos.length,
      samplePhoto: photos[0].id
    };
  }

  async testSpecificPhoto(recordId) {
    // Test getting a specific photo record
    const photoRecord = await this.airtableManager.getPhotoRecord(recordId);
    
    if (!photoRecord.fields.Attachments || photoRecord.fields.Attachments.length === 0) {
      throw new Error(`Photo record ${recordId} has no attachments`);
    }

    const attachment = photoRecord.fields.Attachments[0];
    this.log(`Photo: ${photoRecord.fields.Title || 'Untitled'}`);
    this.log(`URL: ${attachment.url}`);
    this.log(`Size: ${Math.round(attachment.size / 1024)}KB`);

    // Test downloading the image
    const imageData = await this.fileManager.downloadImage(attachment.url);
    this.log(`Downloaded image: ${Math.round(imageData.length / 1024)}KB base64 data`);

    return {
      recordId,
      title: photoRecord.fields.Title || 'Untitled',
      hasAttachment: true,
      downloadSuccess: true,
      imageSize: imageData.length
    };
  }

  async testImageAnalysis(recordId) {
    // Get and download the photo
    const photoRecord = await this.airtableManager.getPhotoRecord(recordId);
    const originalUrl = photoRecord.fields.Attachments[0].url;
    const imageData = await this.fileManager.downloadImage(originalUrl);

    // Test analysis agent
    const analysis = await this.orchestrator.analysisAgent.analyzeImage(imageData);

    if (!analysis.imageType || !analysis.quality || !analysis.defects || !analysis.content || !analysis.technicalDetails) {
      throw new Error('Analysis incomplete - missing required sections');
    }

    this.log(`Analysis complete: ${analysis.imageType}, Quality: ${analysis.quality.overall}/10`);
    this.log(`Defects found: ${analysis.defects.length}`);
    this.log(`Era identified: ${analysis.content.era || 'Unknown'}`);

    return {
      imageType: analysis.imageType,
      overallQuality: analysis.quality.overall,
      defectCount: analysis.defects.length,
      era: analysis.content.era,
      analysisSuccess: true
    };
  }

  async testPlanCreation(recordId, mode = 'RESTORE') {
    // Get photo and analyze
    const photoRecord = await this.airtableManager.getPhotoRecord(recordId);
    const originalUrl = photoRecord.fields.Attachments[0].url;
    const imageData = await this.fileManager.downloadImage(originalUrl);
    const analysis = await this.orchestrator.analysisAgent.analyzeImage(imageData);

    // Test planner agent
    const plan = await this.orchestrator.plannerAgent.createPlan(analysis, mode);

    if (!plan.strategy || !plan.steps || plan.steps.length === 0) {
      throw new Error('Plan creation failed - no strategy or steps generated');
    }

    this.log(`Plan created: ${plan.strategy}`);
    this.log(`Steps planned: ${plan.steps.length}`);
    this.log(`Priority: ${plan.priority}`);

    return {
      strategy: plan.strategy,
      stepCount: plan.steps.length,
      priority: plan.priority,
      planSuccess: true
    };
  }

  async testCompleteRestoration(recordId, mode = 'RESTORE') {
    this.log(`\n🚀 Starting complete restoration test for record: ${recordId}`);
    
    // Create session
    const sessionId = await this.orchestrator.createSession(recordId);
    this.log(`Created session: ${sessionId}`);

    // Process the photo
    const result = await this.orchestrator.processPhoto(sessionId, mode);

    if (!result.success) {
      throw new Error(`Restoration failed: ${result.error}`);
    }

    this.log(`Restoration completed successfully!`);
    this.log(`Quality Score: ${result.qualityScore}/100`);
    this.log(`Result URL: ${result.resultUrl}`);
    this.log(`Processing Time: ${result.metrics.totalTime.toFixed(2)}s`);

    return {
      sessionId,
      success: result.success,
      qualityScore: result.qualityScore,
      resultUrl: result.resultUrl,
      processingTime: result.metrics.totalTime,
      recommendation: result.recommendation
    };
  }

  async runAllTests(recordId = null) {
    console.log('\n🧪 ADK Restoration System - Test Runner\n');
    
    // Test 1: Environment Setup
    await this.runTest('Environment Setup', this.testEnvironmentSetup);

    // Test 2: Airtable Operations
    const airtableResult = await this.runTest('Airtable Operations', this.testAirtableOperations);
    
    // Use provided recordId or get one from Airtable
    const testRecordId = recordId || (airtableResult?.samplePhoto);
    
    if (!testRecordId) {
      this.log('❌ No test record available, skipping photo-specific tests', 'error');
      return this.printResults();
    }

    this.log(`\n📸 Using test photo: ${testRecordId}\n`);

    // Test 3: Specific Photo Operations
    await this.runTest('Photo Record Access', this.testSpecificPhoto, testRecordId);

    // Test 4: Image Analysis
    await this.runTest('Image Analysis', this.testImageAnalysis, testRecordId);

    // Test 5: Plan Creation
    await this.runTest('Plan Creation', this.testPlanCreation, testRecordId);

    // Test 6: Complete Restoration (optional - can be slow and expensive)
    if (process.argv.includes('--full')) {
      this.log('\n🎯 Running full restoration test (this may take several minutes)...\n');
      await this.runTest('Complete Restoration', this.testCompleteRestoration, testRecordId);
    } else {
      this.log('\n⏭️  Skipping full restoration test (use --full flag to include)');
    }

    return this.printResults();
  }

  printResults() {
    console.log('\n📊 Test Results Summary\n');
    console.log(`Total Tests: ${this.results.totalTests}`);
    console.log(`✅ Passed: ${this.results.passedTests}`);
    console.log(`❌ Failed: ${this.results.failedTests}`);
    console.log(`Success Rate: ${Math.round((this.results.passedTests / this.results.totalTests) * 100)}%`);

    if (this.results.failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.tests
        .filter(test => test.status === 'FAILED')
        .forEach(test => {
          console.log(`  - ${test.name}: ${test.error}`);
        });
    }

    console.log('\n✅ Test run completed!\n');
    
    // Exit with proper code
    process.exit(this.results.failedTests > 0 ? 1 : 0);
  }
}

// Run tests
const testRunner = new TestRunner();

// Get recordId from command line args
const recordId = process.argv.find(arg => arg.startsWith('rec')) || process.env.TEST_RECORD_ID;

testRunner.runAllTests(recordId).catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});