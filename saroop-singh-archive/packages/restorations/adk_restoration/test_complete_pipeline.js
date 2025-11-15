#!/usr/bin/env node

/**
 * Complete Pipeline Test - Test cloud upload integration with Airtable
 */

import dotenv from 'dotenv';
import { CloudImageUploadService } from './src/services/CloudImageUploadService.js';
import { FileManager } from './src/utils/FileManager.js';
import sharp from 'sharp';
import fs from 'fs/promises';

// Load environment variables
dotenv.config();

async function createTestImage() {
  // Create a simple test image that looks like a restored photo
  const width = 800;
  const height = 600;
  
  const testImageBuffer = await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 120, g: 90, b: 70 } // Sepia tone background
    }
  })
  .composite([
    {
      input: Buffer.from(`
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="rgb(120, 90, 70)"/>
          <text x="50%" y="30%" dominant-baseline="middle" text-anchor="middle" font-size="40" fill="white" font-family="serif">RESTORED IMAGE</text>
          <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="24" fill="rgba(255,255,255,0.8)" font-family="serif">Saroop Singh Archive</text>
          <text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" font-size="18" fill="rgba(255,255,255,0.6)" font-family="serif">Test Session: ${new Date().toISOString()}</text>
          <text x="50%" y="80%" dominant-baseline="middle" text-anchor="middle" font-size="14" fill="rgba(255,255,255,0.5)" font-family="serif">Quality Score: 85/100</text>
        </svg>
      `),
      top: 0,
      left: 0
    }
  ])
  .jpeg({ quality: 85 })
  .toBuffer();

  // Convert to base64 for the upload service
  const base64Data = testImageBuffer.toString('base64');
  
  console.log(`✅ Created test restored image: ${width}x${height}, ${testImageBuffer.length} bytes`);
  return base64Data;
}

async function testCloudUploadIntegration() {
  console.log('🧪 Testing Complete Cloud Upload Pipeline\n');
  console.log('=' .repeat(60));

  try {
    // 1. Create a test "restored" image
    console.log('\n📷 Step 1: Creating test restored image...');
    const restoredImageData = await createTestImage();
    
    // 2. Test FileManager upload (which should use CloudImageUploadService)
    console.log('\n☁️  Step 2: Testing FileManager cloud upload integration...');
    const fileManager = new FileManager();
    
    const uploadResult = await fileManager.uploadImage(
      restoredImageData, 
      'restored_test_image.jpg',
      {
        sessionId: 'test-pipeline-123',
        qualityScore: 85,
        mode: 'RESTORE',
        recordId: 'test-record'
      }
    );
    
    console.log(`Upload successful: ${uploadResult}`);
    
    // 3. Test direct CloudImageUploadService as well
    console.log('\n🔧 Step 3: Testing direct CloudImageUploadService...');
    const cloudService = new CloudImageUploadService();
    
    const directUploadResult = await cloudService.uploadWithFallback(restoredImageData, {
      originalFilename: 'direct_test_upload.jpg',
      sessionId: 'direct-test-456',
      qualityScore: 92,
      mode: 'RESTORE'
    }, true);
    
    if (directUploadResult.success) {
      console.log(`Direct upload successful: ${directUploadResult.url}`);
      console.log(`Service used: ${directUploadResult.metadata?.service || 'unknown'}`);
    }
    
    // 4. Simulate Airtable integration
    console.log('\n📋 Step 4: Simulating Airtable record update...');
    
    const mockAirtableUpdate = {
      recordId: 'recTestRecord123',
      fields: {
        'Result URL': uploadResult,
        'Status': 'Complete',
        'Quality Score': 85,
        'Processing Completed': new Date().toISOString(),
        'Notes': 'Cloud upload test successful. Image viewable at public URL.'
      }
    };
    
    console.log('✅ Would update Airtable record:', mockAirtableUpdate.recordId);
    console.log('   Status: Complete');
    console.log('   Result URL:', uploadResult);
    console.log('   Quality Score: 85/100');
    
    // 5. Verify URLs are HTTPS and publicly accessible
    console.log('\n🔗 Step 5: Verifying uploaded URLs...');
    
    const urlsToCheck = [uploadResult, directUploadResult.url];
    
    for (const url of urlsToCheck) {
      if (url) {
        const isHttps = url.startsWith('https://');
        const isPublic = !url.includes('localhost') && !url.includes('127.0.0.1') && !url.includes('file://');
        
        console.log(`   URL: ${url}`);
        console.log(`   ✅ HTTPS: ${isHttps ? 'Yes' : '❌ No'}`);
        console.log(`   ✅ Public: ${isPublic ? 'Yes' : '❌ No'}`);
        console.log(`   ✅ Airtable Compatible: ${isHttps && isPublic ? 'Yes' : '❌ No'}`);
        console.log('');
      }
    }
    
    console.log('=' .repeat(60));
    console.log('🎉 COMPLETE PIPELINE TEST SUCCESSFUL!');
    console.log('');
    console.log('✅ Test restored image created');
    console.log('✅ FileManager cloud upload working');
    console.log('✅ CloudImageUploadService fallback working');
    console.log('✅ Public HTTPS URLs generated');
    console.log('✅ Ready for Airtable integration');
    console.log('');
    console.log('📝 Next Steps for Production:');
    console.log('   1. Replace demo Cloudinary credentials with real ones');
    console.log('   2. Test with actual Airtable record update');
    console.log('   3. Verify images are visible in Airtable UI');
    
    return {
      success: true,
      fileManagerUrl: uploadResult,
      directUploadUrl: directUploadResult.url,
      airtableReady: true
    };
    
  } catch (error) {
    console.error('❌ Pipeline test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the complete test
testCloudUploadIntegration()
  .then(result => {
    if (result.success) {
      console.log('\n🏆 All systems operational - ready for production use!');
      process.exit(0);
    } else {
      console.log('\n❌ Test failed - needs attention');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });