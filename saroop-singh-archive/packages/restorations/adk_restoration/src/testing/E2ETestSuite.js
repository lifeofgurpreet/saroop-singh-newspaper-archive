/**
 * End-to-End Test Suite - Comprehensive testing with golden fixtures and regression tests
 * Implements shadow dataset testing and quality validation
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

export class E2ETestSuite {
  constructor(orchestrator, qcEngine, logger) {
    this.orchestrator = orchestrator;
    this.qcEngine = qcEngine;
    this.logger = logger;
    
    this.testDataPath = path.join(process.cwd(), 'test-data');
    this.fixturesPath = path.join(this.testDataPath, 'fixtures');
    this.goldenPath = path.join(this.testDataPath, 'golden');
    this.outputPath = path.join(this.testDataPath, 'output');
    this.reportsPath = path.join(this.testDataPath, 'reports');
    
    // Test configuration
    this.testSuites = new Map();
    this.testResults = new Map();
    this.goldenFixtures = new Map();
    
    this.initializeTestEnvironment();
  }

  /**
   * Initialize test environment and load fixtures
   */
  async initializeTestEnvironment() {
    try {
      // Ensure test directories exist
      await this.ensureTestDirectories();
      
      // Load test suites configuration
      await this.loadTestSuites();
      
      // Load golden fixtures
      await this.loadGoldenFixtures();
      
      this.logger.logEvent('info', 'test-environment-initialized', {
        testSuites: this.testSuites.size,
        goldenFixtures: this.goldenFixtures.size,
        category: 'testing'
      });
      
    } catch (error) {
      this.logger.logError(error, { context: 'test-environment-initialization' });
      throw error;
    }
  }

  /**
   * Ensure all test directories exist
   */
  async ensureTestDirectories() {
    const directories = [
      this.testDataPath,
      this.fixturesPath,
      this.goldenPath,
      this.outputPath,
      this.reportsPath,
      path.join(this.fixturesPath, 'portraits'),
      path.join(this.fixturesPath, 'group-photos'),
      path.join(this.fixturesPath, 'documents'),
      path.join(this.fixturesPath, 'landscapes'),
      path.join(this.fixturesPath, 'damaged'),
      path.join(this.goldenPath, 'portraits'),
      path.join(this.goldenPath, 'group-photos'),
      path.join(this.goldenPath, 'documents'),
      path.join(this.goldenPath, 'landscapes'),
      path.join(this.goldenPath, 'damaged')
    ];

    for (const dir of directories) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  /**
   * Load test suites configuration
   */
  async loadTestSuites() {
    const testSuitesConfig = {
      'smoke-test': {
        name: 'Smoke Test Suite',
        description: 'Basic functionality verification',
        fixtures: ['portrait-basic', 'group-simple', 'document-clear'],
        modes: ['RESTORE'],
        timeoutMs: 60000,
        qualityThreshold: 60
      },
      
      'portrait-restoration': {
        name: 'Portrait Restoration Suite',
        description: 'Comprehensive portrait restoration testing',
        fixtures: ['portrait-basic', 'portrait-damaged', 'portrait-faded', 'portrait-bw'],
        modes: ['RESTORE', 'ENHANCE', 'REIMAGINE'],
        timeoutMs: 180000,
        qualityThreshold: 70
      },
      
      'group-photo-processing': {
        name: 'Group Photo Processing Suite',
        description: 'Multi-person photo restoration',
        fixtures: ['group-simple', 'group-large', 'group-damaged'],
        modes: ['RESTORE', 'ENHANCE'],
        timeoutMs: 240000,
        qualityThreshold: 65
      },
      
      'document-enhancement': {
        name: 'Document Enhancement Suite',
        description: 'Text document restoration and OCR',
        fixtures: ['document-clear', 'document-faded', 'document-damaged'],
        modes: ['RESTORE', 'ENHANCE'],
        timeoutMs: 120000,
        qualityThreshold: 75
      },
      
      'damage-repair': {
        name: 'Damage Repair Suite',
        description: 'Severe damage restoration testing',
        fixtures: ['severe-tear', 'water-damage', 'missing-parts', 'fold-damage'],
        modes: ['RESTORE', 'ENHANCE'],
        timeoutMs: 300000,
        qualityThreshold: 55
      },
      
      'regression-test': {
        name: 'Regression Test Suite',
        description: 'Ensure no quality degradation',
        fixtures: 'all',
        modes: ['RESTORE'],
        timeoutMs: 600000,
        qualityThreshold: null, // Use golden standard comparison
        compareToGolden: true
      },
      
      'performance-test': {
        name: 'Performance Test Suite',
        description: 'Processing time and resource usage',
        fixtures: ['performance-set'],
        modes: ['RESTORE'],
        timeoutMs: 60000,
        maxProcessingTime: 45000, // 45 seconds per image
        maxMemoryMB: 2048
      }
    };

    for (const [key, config] of Object.entries(testSuitesConfig)) {
      this.testSuites.set(key, config);
    }
  }

  /**
   * Load golden fixtures for comparison
   */
  async loadGoldenFixtures() {
    try {
      const goldenFiles = await this.findGoldenFiles();
      
      for (const filePath of goldenFiles) {
        const fileName = path.basename(filePath, path.extname(filePath));
        const category = path.basename(path.dirname(filePath));
        
        const goldenData = {
          filePath,
          fileName,
          category,
          hash: await this.calculateFileHash(filePath),
          metadata: await this.loadGoldenMetadata(filePath)
        };
        
        this.goldenFixtures.set(`${category}/${fileName}`, goldenData);
      }
      
    } catch (error) {
      this.logger.logError(error, { context: 'golden-fixtures-loading' });
    }
  }

  /**
   * Find all golden fixture files
   */
  async findGoldenFiles() {
    const goldenFiles = [];
    const categories = await fs.readdir(this.goldenPath, { withFileTypes: true });
    
    for (const category of categories) {
      if (category.isDirectory()) {
        const categoryPath = path.join(this.goldenPath, category.name);
        const files = await fs.readdir(categoryPath);
        
        for (const file of files) {
          if (file.endsWith('.jpg') || file.endsWith('.png')) {
            goldenFiles.push(path.join(categoryPath, file));
          }
        }
      }
    }
    
    return goldenFiles;
  }

  /**
   * Load golden metadata for comparison
   */
  async loadGoldenMetadata(imagePath) {
    const metadataPath = imagePath.replace(/\.(jpg|png)$/, '.json');
    
    try {
      const metadataContent = await fs.readFile(metadataPath, 'utf8');
      return JSON.parse(metadataContent);
    } catch (error) {
      // Return default metadata if file doesn't exist
      return {
        expectedQualityScore: 80,
        expectedPreservation: 85,
        expectedNaturalness: 80,
        description: 'Golden standard result',
        createdAt: new Date().toISOString()
      };
    }
  }

  /**
   * Calculate file hash for comparison
   */
  async calculateFileHash(filePath) {
    try {
      const fileBuffer = await fs.readFile(filePath);
      return crypto.createHash('sha256').update(fileBuffer).digest('hex');
    } catch (error) {
      return null;
    }
  }

  /**
   * Run complete test suite
   */
  async runTestSuite(suiteKey, options = {}) {
    const suite = this.testSuites.get(suiteKey);
    if (!suite) {
      throw new Error(`Test suite not found: ${suiteKey}`);
    }

    const runId = `run_${suiteKey}_${Date.now()}`;
    const correlationId = this.logger.generateCorrelationId();
    
    const testRun = {
      runId,
      suiteKey,
      suiteName: suite.name,
      correlationId,
      startTime: new Date().toISOString(),
      endTime: null,
      status: 'RUNNING',
      fixtures: [],
      results: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        warnings: 0
      },
      performance: {
        totalTime: 0,
        averageProcessingTime: 0,
        maxProcessingTime: 0,
        minProcessingTime: Infinity
      },
      options
    };

    this.logger.logEvent('info', 'test-suite-started', {
      runId,
      suite: suite.name,
      category: 'testing'
    }, correlationId);

    try {
      // Get test fixtures
      const fixtures = await this.getTestFixtures(suite.fixtures);
      testRun.fixtures = fixtures.map(f => f.name);
      testRun.summary.total = fixtures.length * suite.modes.length;

      // Run tests for each fixture and mode combination
      for (const fixture of fixtures) {
        for (const mode of suite.modes) {
          const testResult = await this.runSingleTest(
            runId,
            fixture,
            mode,
            suite,
            options,
            correlationId
          );
          
          testRun.results.push(testResult);
          
          // Update summary
          switch (testResult.status) {
            case 'PASSED':
              testRun.summary.passed++;
              break;
            case 'FAILED':
              testRun.summary.failed++;
              break;
            case 'SKIPPED':
              testRun.summary.skipped++;
              break;
          }
          
          if (testResult.warnings && testResult.warnings.length > 0) {
            testRun.summary.warnings++;
          }
          
          // Update performance metrics
          if (testResult.processingTime) {
            testRun.performance.totalTime += testResult.processingTime;
            testRun.performance.maxProcessingTime = Math.max(
              testRun.performance.maxProcessingTime,
              testResult.processingTime
            );
            testRun.performance.minProcessingTime = Math.min(
              testRun.performance.minProcessingTime,
              testResult.processingTime
            );
          }
        }
      }

      // Calculate final metrics
      if (testRun.results.length > 0) {
        testRun.performance.averageProcessingTime = Math.round(
          testRun.performance.totalTime / testRun.results.length
        );
      }

      testRun.status = testRun.summary.failed > 0 ? 'FAILED' : 'PASSED';
      testRun.endTime = new Date().toISOString();

      // Store results
      this.testResults.set(runId, testRun);
      
      // Generate report
      await this.generateTestReport(testRun);

      this.logger.logEvent('info', 'test-suite-completed', {
        runId,
        status: testRun.status,
        passed: testRun.summary.passed,
        failed: testRun.summary.failed,
        totalTime: Math.round(testRun.performance.totalTime / 1000),
        category: 'testing'
      }, correlationId);

      return testRun;

    } catch (error) {
      testRun.status = 'ERROR';
      testRun.endTime = new Date().toISOString();
      testRun.error = error.message;
      
      this.logger.logError(error, {
        runId,
        suite: suite.name,
        context: 'test-suite-execution'
      });
      
      throw error;
    }
  }

  /**
   * Run single test
   */
  async runSingleTest(runId, fixture, mode, suite, options, correlationId) {
    const testId = `${runId}_${fixture.name}_${mode}`;
    const startTime = Date.now();
    
    const testResult = {
      testId,
      runId,
      fixture: fixture.name,
      mode,
      status: 'RUNNING',
      startTime: new Date().toISOString(),
      endTime: null,
      processingTime: null,
      qualityScore: null,
      validationResults: null,
      comparison: null,
      warnings: [],
      errors: []
    };

    try {
      this.logger.logEvent('debug', 'single-test-started', {
        testId,
        fixture: fixture.name,
        mode,
        category: 'testing'
      }, correlationId);

      // Process image through restoration pipeline
      const sessionId = `test_${testId}`;
      const result = await this.orchestrator.processImage({
        imageData: fixture.imageData,
        mode,
        sessionId,
        timeout: suite.timeoutMs
      });

      const processingTime = Date.now() - startTime;
      testResult.processingTime = processingTime;
      testResult.qualityScore = result.qualityScore;
      testResult.validationResults = result.validationResults;

      // Check timeout constraint
      if (suite.maxProcessingTime && processingTime > suite.maxProcessingTime) {
        testResult.warnings.push(`Processing time exceeded limit: ${processingTime}ms > ${suite.maxProcessingTime}ms`);
      }

      // Quality threshold check
      if (suite.qualityThreshold && result.qualityScore < suite.qualityThreshold) {
        testResult.status = 'FAILED';
        testResult.errors.push(`Quality score below threshold: ${result.qualityScore} < ${suite.qualityThreshold}`);
      } else if (suite.compareToGolden) {
        // Compare to golden standard
        const comparison = await this.compareToGoldenStandard(fixture, result);
        testResult.comparison = comparison;
        
        if (comparison.differences > comparison.tolerance) {
          testResult.status = 'FAILED';
          testResult.errors.push(`Regression detected: differences ${comparison.differences} > tolerance ${comparison.tolerance}`);
        }
      }

      // Set status if not already failed
      if (testResult.status !== 'FAILED') {
        testResult.status = 'PASSED';
      }

      testResult.endTime = new Date().toISOString();

      this.logger.logEvent('debug', 'single-test-completed', {
        testId,
        status: testResult.status,
        processingTime,
        qualityScore: result.qualityScore,
        category: 'testing'
      }, correlationId);

    } catch (error) {
      testResult.status = 'FAILED';
      testResult.endTime = new Date().toISOString();
      testResult.processingTime = Date.now() - startTime;
      testResult.errors.push(error.message);

      this.logger.logError(error, {
        testId,
        fixture: fixture.name,
        mode,
        context: 'single-test-execution'
      });
    }

    return testResult;
  }

  /**
   * Get test fixtures based on configuration
   */
  async getTestFixtures(fixtureConfig) {
    const fixtures = [];
    
    if (fixtureConfig === 'all') {
      // Load all available fixtures
      const fixtureFiles = await this.findAllFixtures();
      for (const filePath of fixtureFiles) {
        const fixture = await this.loadTestFixture(filePath);
        fixtures.push(fixture);
      }
    } else if (Array.isArray(fixtureConfig)) {
      // Load specific fixtures
      for (const fixtureName of fixtureConfig) {
        const fixture = await this.loadFixtureByName(fixtureName);
        if (fixture) {
          fixtures.push(fixture);
        }
      }
    }
    
    return fixtures;
  }

  /**
   * Load test fixture by name
   */
  async loadFixtureByName(fixtureName) {
    try {
      // Search for fixture file
      const fixtureFile = await this.findFixtureFile(fixtureName);
      if (fixtureFile) {
        return await this.loadTestFixture(fixtureFile);
      }
      
      this.logger.logEvent('warn', 'fixture-not-found', {
        fixtureName,
        category: 'testing'
      });
      
      return null;
    } catch (error) {
      this.logger.logError(error, { fixtureName, context: 'fixture-loading' });
      return null;
    }
  }

  /**
   * Load single test fixture
   */
  async loadTestFixture(filePath) {
    const imageBuffer = await fs.readFile(filePath);
    const imageData = imageBuffer.toString('base64');
    const fileName = path.basename(filePath, path.extname(filePath));
    
    // Load metadata if exists
    const metadataPath = filePath.replace(/\.(jpg|png)$/, '.json');
    let metadata = {};
    
    try {
      const metadataContent = await fs.readFile(metadataPath, 'utf8');
      metadata = JSON.parse(metadataContent);
    } catch (error) {
      // No metadata file, use defaults
    }
    
    return {
      name: fileName,
      filePath,
      imageData,
      metadata: {
        category: path.basename(path.dirname(filePath)),
        expectedDifficulty: metadata.difficulty || 'medium',
        expectedQuality: metadata.expectedQuality || 70,
        description: metadata.description || '',
        ...metadata
      }
    };
  }

  /**
   * Find all fixture files
   */
  async findAllFixtures() {
    const fixtures = [];
    const categories = await fs.readdir(this.fixturesPath, { withFileTypes: true });
    
    for (const category of categories) {
      if (category.isDirectory()) {
        const categoryPath = path.join(this.fixturesPath, category.name);
        const files = await fs.readdir(categoryPath);
        
        for (const file of files) {
          if (file.endsWith('.jpg') || file.endsWith('.png')) {
            fixtures.push(path.join(categoryPath, file));
          }
        }
      }
    }
    
    return fixtures;
  }

  /**
   * Find specific fixture file
   */
  async findFixtureFile(fixtureName) {
    const categories = await fs.readdir(this.fixturesPath, { withFileTypes: true });
    
    for (const category of categories) {
      if (category.isDirectory()) {
        const categoryPath = path.join(this.fixturesPath, category.name);
        const files = await fs.readdir(categoryPath);
        
        for (const file of files) {
          const fileName = path.basename(file, path.extname(file));
          if (fileName === fixtureName) {
            return path.join(categoryPath, file);
          }
        }
      }
    }
    
    return null;
  }

  /**
   * Compare result to golden standard
   */
  async compareToGoldenStandard(fixture, result) {
    const goldenKey = `${fixture.metadata.category}/${fixture.name}`;
    const golden = this.goldenFixtures.get(goldenKey);
    
    if (!golden) {
      return {
        available: false,
        differences: 0,
        tolerance: 10,
        message: 'No golden standard available'
      };
    }

    // Compare quality scores
    const expectedQuality = golden.metadata.expectedQualityScore;
    const actualQuality = result.qualityScore;
    const qualityDifference = Math.abs(expectedQuality - actualQuality);
    
    // Compare preservation scores
    const expectedPreservation = golden.metadata.expectedPreservation || 80;
    const actualPreservation = result.validationResults?.preservationScore || 0;
    const preservationDifference = Math.abs(expectedPreservation - actualPreservation);
    
    // Calculate overall difference
    const totalDifference = (qualityDifference + preservationDifference) / 2;
    const tolerance = 15; // Allow 15 point difference
    
    return {
      available: true,
      differences: totalDifference,
      tolerance,
      qualityDifference,
      preservationDifference,
      expected: {
        quality: expectedQuality,
        preservation: expectedPreservation
      },
      actual: {
        quality: actualQuality,
        preservation: actualPreservation
      },
      passed: totalDifference <= tolerance
    };
  }

  /**
   * Generate comprehensive test report
   */
  async generateTestReport(testRun) {
    const reportData = {
      ...testRun,
      generatedAt: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        memory: process.memoryUsage(),
        system: 'ADK Restoration System'
      }
    };

    // Generate HTML report
    const htmlReport = this.generateHTMLReport(reportData);
    const htmlReportPath = path.join(this.reportsPath, `${testRun.runId}.html`);
    await fs.writeFile(htmlReportPath, htmlReport);

    // Generate JSON report
    const jsonReportPath = path.join(this.reportsPath, `${testRun.runId}.json`);
    await fs.writeFile(jsonReportPath, JSON.stringify(reportData, null, 2));

    // Generate summary report
    const summary = this.generateTestSummary(testRun);
    const summaryPath = path.join(this.reportsPath, `${testRun.runId}_summary.txt`);
    await fs.writeFile(summaryPath, summary);

    this.logger.logEvent('info', 'test-report-generated', {
      runId: testRun.runId,
      htmlReport: htmlReportPath,
      jsonReport: jsonReportPath,
      category: 'testing'
    });

    return {
      htmlReport: htmlReportPath,
      jsonReport: jsonReportPath,
      summary: summaryPath
    };
  }

  /**
   * Generate HTML test report
   */
  generateHTMLReport(reportData) {
    const passedTests = reportData.results.filter(r => r.status === 'PASSED');
    const failedTests = reportData.results.filter(r => r.status === 'FAILED');
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>ADK Restoration Test Report - ${reportData.suiteName}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background-color: #f5f5f5; padding: 20px; border-radius: 5px; }
        .summary { margin: 20px 0; }
        .passed { color: green; }
        .failed { color: red; }
        .warning { color: orange; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .test-failed { background-color: #ffe6e6; }
        .test-passed { background-color: #e6ffe6; }
    </style>
</head>
<body>
    <div class="header">
        <h1>ADK Restoration Test Report</h1>
        <h2>${reportData.suiteName}</h2>
        <p><strong>Run ID:</strong> ${reportData.runId}</p>
        <p><strong>Started:</strong> ${reportData.startTime}</p>
        <p><strong>Completed:</strong> ${reportData.endTime}</p>
        <p><strong>Status:</strong> <span class="${reportData.status.toLowerCase()}">${reportData.status}</span></p>
    </div>
    
    <div class="summary">
        <h3>Summary</h3>
        <p><strong>Total Tests:</strong> ${reportData.summary.total}</p>
        <p><strong class="passed">Passed:</strong> ${reportData.summary.passed}</p>
        <p><strong class="failed">Failed:</strong> ${reportData.summary.failed}</p>
        <p><strong class="warning">Warnings:</strong> ${reportData.summary.warnings}</p>
        <p><strong>Success Rate:</strong> ${Math.round((reportData.summary.passed / reportData.summary.total) * 100)}%</p>
        <p><strong>Average Processing Time:</strong> ${reportData.performance.averageProcessingTime}ms</p>
    </div>
    
    <h3>Test Results</h3>
    <table>
        <tr>
            <th>Test</th>
            <th>Fixture</th>
            <th>Mode</th>
            <th>Status</th>
            <th>Quality Score</th>
            <th>Processing Time</th>
            <th>Errors/Warnings</th>
        </tr>
        ${reportData.results.map(result => `
            <tr class="test-${result.status.toLowerCase()}">
                <td>${result.testId}</td>
                <td>${result.fixture}</td>
                <td>${result.mode}</td>
                <td>${result.status}</td>
                <td>${result.qualityScore || 'N/A'}</td>
                <td>${result.processingTime || 'N/A'}ms</td>
                <td>
                    ${result.errors.map(e => `<span class="failed">Error: ${e}</span>`).join('<br>')}
                    ${result.warnings.map(w => `<span class="warning">Warning: ${w}</span>`).join('<br>')}
                </td>
            </tr>
        `).join('')}
    </table>
</body>
</html>`;
  }

  /**
   * Generate test summary
   */
  generateTestSummary(testRun) {
    const successRate = Math.round((testRun.summary.passed / testRun.summary.total) * 100);
    
    return `
ADK RESTORATION SYSTEM - TEST REPORT SUMMARY
=============================================

Test Suite: ${testRun.suiteName}
Run ID: ${testRun.runId}
Executed: ${testRun.startTime} - ${testRun.endTime}
Status: ${testRun.status}

RESULTS:
--------
Total Tests: ${testRun.summary.total}
Passed: ${testRun.summary.passed} (${successRate}%)
Failed: ${testRun.summary.failed}
Warnings: ${testRun.summary.warnings}

PERFORMANCE:
-----------
Total Processing Time: ${Math.round(testRun.performance.totalTime / 1000)}s
Average Processing Time: ${testRun.performance.averageProcessingTime}ms
Min Processing Time: ${testRun.performance.minProcessingTime}ms
Max Processing Time: ${testRun.performance.maxProcessingTime}ms

FAILED TESTS:
------------
${testRun.results
  .filter(r => r.status === 'FAILED')
  .map(r => `- ${r.fixture} (${r.mode}): ${r.errors.join(', ')}`)
  .join('\\n')}

WARNINGS:
---------
${testRun.results
  .filter(r => r.warnings && r.warnings.length > 0)
  .map(r => `- ${r.fixture} (${r.mode}): ${r.warnings.join(', ')}`)
  .join('\\n')}
`;
  }

  /**
   * Run smoke tests (basic functionality check)
   */
  async runSmokeTests() {
    return await this.runTestSuite('smoke-test', { quickMode: true });
  }

  /**
   * Run regression tests against golden standards
   */
  async runRegressionTests() {
    return await this.runTestSuite('regression-test', { compareToGolden: true });
  }

  /**
   * Run performance tests
   */
  async runPerformanceTests() {
    return await this.runTestSuite('performance-test', { 
      collectMetrics: true,
      profileMemory: true 
    });
  }

  /**
   * Get test results by run ID
   */
  getTestResults(runId) {
    return this.testResults.get(runId);
  }

  /**
   * Get all test results
   */
  getAllTestResults() {
    return Array.from(this.testResults.values());
  }

  /**
   * Create golden fixture from successful test result
   */
  async createGoldenFixture(fixtureName, category, result, description) {
    const goldenDir = path.join(this.goldenPath, category);
    await fs.mkdir(goldenDir, { recursive: true });
    
    // Save image result
    const imagePath = path.join(goldenDir, `${fixtureName}.jpg`);
    const imageBuffer = Buffer.from(result.imageData, 'base64');
    await fs.writeFile(imagePath, imageBuffer);
    
    // Save metadata
    const metadataPath = path.join(goldenDir, `${fixtureName}.json`);
    const metadata = {
      expectedQualityScore: result.qualityScore,
      expectedPreservation: result.validationResults.preservationScore,
      expectedNaturalness: result.validationResults.naturalnessScore,
      description,
      createdAt: new Date().toISOString(),
      sourceTest: result.testId || 'manual'
    };
    
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    
    // Add to golden fixtures
    this.goldenFixtures.set(`${category}/${fixtureName}`, {
      filePath: imagePath,
      fileName: fixtureName,
      category,
      hash: await this.calculateFileHash(imagePath),
      metadata
    });
    
    this.logger.logEvent('info', 'golden-fixture-created', {
      fixtureName,
      category,
      qualityScore: result.qualityScore,
      category: 'testing'
    });
    
    return imagePath;
  }
}