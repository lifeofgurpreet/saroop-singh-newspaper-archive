#!/usr/bin/env node

/**
 * Direct Test Script for ADK Restoration System
 * Processes a single photo directly using OrchestratorAgent
 */

import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';
import { OrchestratorAgent } from './src/agents/OrchestratorAgent.js';
import Airtable from 'airtable';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

async function testDirectProcessing() {
  console.log('🧪 Starting Direct ADK Test Processing');
  console.log('=' .repeat(50));
  
  const targetPhotoId = 'recOEKuWvTsZv71Qm';
  
  try {
    // Initialize Airtable
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
    
    console.log('📡 Fetching photo record from Airtable...');
    const record = await base('PhotoGallery').find(targetPhotoId);
    console.log('✅ Record retrieved:', {
      id: record.id,
      name: record.fields.Name,
      status: record.fields.Status,
      attachments: record.fields.Attachments?.length || 0
    });
    
    // Initialize OrchestratorAgent
    console.log('🤖 Initializing OrchestratorAgent...');
    const orchestrator = new OrchestratorAgent();
    
    // Create session
    console.log('🏗️ Creating processing session...');
    const sessionId = await orchestrator.createSession(record.id, record.fields.Workflow?.[0] || null);
    console.log('✅ Session created:', sessionId);
    
    // Process the photo
    console.log('🔄 Starting processing...');
    const startTime = Date.now();
    
    const result = await orchestrator.processPhoto(sessionId, 'RESTORE');
    
    const processingTime = (Date.now() - startTime) / 1000;
    
    console.log('✨ Processing completed!');
    console.log('📊 Results:', {
      success: result.success,
      outputPath: result.outputPath,
      processingTime: `${processingTime}s`,
      metadata: result.metadata
    });
    
    if (result.error) {
      console.error('❌ Error details:', result.error);
    }
    
    // Verify the record was updated
    console.log('🔍 Verifying Airtable updates...');
    const updatedRecord = await base('PhotoGallery').find(targetPhotoId);
    console.log('📋 Updated record status:', {
      status: updatedRecord.fields.Status,
      resultURL: updatedRecord.fields['Result URL'],
      processingJobId: updatedRecord.fields['Processing Job ID'],
      errorMessage: updatedRecord.fields['Error Message']
    });
    
    return result;
    
  } catch (error) {
    console.error('💥 Test failed with error:', error);
    console.error('Stack trace:', error.stack);
    return { success: false, error };
  }
}

// Run the test
testDirectProcessing()
  .then(result => {
    if (result.success) {
      console.log('🎉 Test completed successfully!');
      process.exit(0);
    } else {
      console.log('❌ Test failed!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
  });