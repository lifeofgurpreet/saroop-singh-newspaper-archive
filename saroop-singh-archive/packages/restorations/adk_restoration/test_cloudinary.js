#!/usr/bin/env node

/**
 * Test script to verify Cloudinary configuration and upload functionality
 */

import dotenv from 'dotenv';
import { CloudImageUploadService } from './src/services/CloudImageUploadService.js';
import sharp from 'sharp';
import fs from 'fs/promises';

// Load environment variables
dotenv.config();

async function createTestImage() {
  // Create a simple test image using Sharp
  const width = 400;
  const height = 300;
  
  const testImageBuffer = await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 100, g: 150, b: 200 }
    }
  })
  .jpeg({ quality: 80 })
  .toBuffer();

  // Save test image to disk
  const testImagePath = './test_image.jpg';
  await fs.writeFile(testImagePath, testImageBuffer);
  
  console.log(`✅ Created test image: ${testImagePath} (${width}x${height})`);
  return testImagePath;
}

async function testCloudinaryConfig() {
  console.log('🔧 Testing Cloudinary Configuration...\n');

  const cloudService = new CloudImageUploadService();
  const configCheck = cloudService.isConfigured();
  
  console.log('Configuration Status:');
  console.log(`  Cloudinary: ${configCheck.cloudinary ? '✅ Configured' : '❌ Not Configured'}`);
  console.log(`  Has Service: ${configCheck.hasAnyService ? '✅ Yes' : '❌ No'}`);
  
  if (configCheck.warnings.length > 0) {
    console.log('  Warnings:');
    configCheck.warnings.forEach(warning => console.log(`    ⚠️  ${warning}`));
  }

  console.log(`\nCredentials (redacted):`);
  console.log(`  Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
  console.log(`  API Key: ${process.env.CLOUDINARY_API_KEY ? '***' + process.env.CLOUDINARY_API_KEY.slice(-4) : 'Not set'}`);
  console.log(`  API Secret: ${process.env.CLOUDINARY_API_SECRET ? '***' + process.env.CLOUDINARY_API_SECRET.slice(-4) : 'Not set'}`);

  return configCheck.hasAnyService;
}

async function testImageUpload() {
  console.log('\n📤 Testing Image Upload...\n');

  try {
    // Create test image
    const testImagePath = await createTestImage();
    
    // Upload to cloud using fallback (since we're using demo credentials)
    const cloudService = new CloudImageUploadService();
    const uploadResult = await cloudService.uploadWithFallback(testImagePath, {
      originalFilename: 'test_image.jpg',
      sessionId: 'test-session-123',
      qualityScore: 85,
      mode: 'RESTORE'
    }, false); // false = not base64, it's a file path

    console.log('Upload Result:');
    console.log(`  Success: ${uploadResult.success ? '✅' : '❌'}`);
    
    if (uploadResult.success) {
      console.log(`  URL: ${uploadResult.url}`);
      console.log(`  Public ID: ${uploadResult.publicId}`);
      console.log('  Metadata:');
      Object.entries(uploadResult.metadata).forEach(([key, value]) => {
        console.log(`    ${key}: ${value}`);
      });
    } else {
      console.log(`  Error: ${uploadResult.error}`);
      console.log('  ⚠️  This is expected if using demo credentials');
    }

    // Cleanup test image
    await fs.unlink(testImagePath);
    console.log(`🗑️  Cleaned up test image`);

    return uploadResult;

  } catch (error) {
    console.error('❌ Upload test failed:', error.message);
    return { success: false, error: error.message };
  }
}

async function simulateAirtableIntegration(uploadResult) {
  console.log('\n📋 Simulating Airtable Integration...\n');
  
  if (!uploadResult.success) {
    console.log('❌ Cannot simulate Airtable integration - upload failed');
    return;
  }

  console.log('✅ Would update Airtable record with:');
  console.log(`   Field: "Restored Image URL"`);
  console.log(`   Value: "${uploadResult.url}"`);
  console.log(`   Public ID: "${uploadResult.publicId}"`);
  console.log('\n✅ Image would now be viewable in Airtable interface');
  console.log(`   Direct link: ${uploadResult.url}`);
}

// Main test function
async function main() {
  console.log('🧪 Cloudinary Configuration & Upload Test\n');
  console.log('=' .repeat(50));

  try {
    // Step 1: Test configuration
    const isConfigured = await testCloudinaryConfig();

    // Step 2: Test upload (even if using demo credentials)
    const uploadResult = await testImageUpload();

    // Step 3: Simulate Airtable integration
    await simulateAirtableIntegration(uploadResult);

    console.log('\n' + '='.repeat(50));
    
    if (isConfigured && uploadResult.success) {
      console.log('🎉 All tests passed! Cloudinary is ready for production.');
    } else {
      console.log('⚠️  Tests completed with issues:');
      if (!isConfigured) {
        console.log('   - Cloudinary credentials need to be updated with real values');
      }
      if (!uploadResult.success) {
        console.log('   - Image upload failed (expected with demo credentials)');
      }
      console.log('\n📝 Next steps:');
      console.log('   1. Sign up for free Cloudinary account: https://cloudinary.com/users/register_free');
      console.log('   2. Replace demo credentials in .env file');
      console.log('   3. Re-run this test to verify real upload');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
main().catch(console.error);