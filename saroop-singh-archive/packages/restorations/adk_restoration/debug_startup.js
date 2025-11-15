#!/usr/bin/env node

import dotenv from 'dotenv';
import { AdkRestorationService } from './src/services/AdkRestorationService.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

async function testServiceInitialization() {
  console.log('🔧 Testing service initialization...');

  try {
    const service = new AdkRestorationService({
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      enableCloudUpload: true,
      enableBatchProcessing: true,
      enableTesting: true,
      maxConcurrentJobs: parseInt(process.env.MAX_CONCURRENT_JOBS) || 5
    });

    console.log('✅ Service instance created');

    console.log('🔄 Starting initialization...');
    await service.initialize();
    console.log('✅ Service initialized successfully');

    console.log('🩺 Testing health checks...');
    const health = await service.performHealthChecks();
    console.log('✅ Health checks completed:', JSON.stringify(health, null, 2));

    console.log('📊 Getting system status...');
    const status = service.getSystemStatus();
    console.log('✅ System status retrieved:', JSON.stringify(status, null, 2));

    console.log('🎯 All tests passed!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
    console.error('Error stack:', error.stack);
  }
}

testServiceInitialization();