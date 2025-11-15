#!/usr/bin/env node

/**
 * Fix and test Cloudinary configuration
 */

import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import sharp from 'sharp';
import fs from 'fs/promises';

// Load environment variables
dotenv.config();

async function testCloudinaryConnection() {
  console.log('🔧 Testing Cloudinary Connection...\n');

  // Configure Cloudinary
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });

  console.log('Configuration:');
  console.log(`  Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
  console.log(`  API Key: ${process.env.CLOUDINARY_API_KEY ? '***' + process.env.CLOUDINARY_API_KEY.slice(-4) : 'Not set'}`);
  console.log(`  API Secret: ${process.env.CLOUDINARY_API_SECRET ? '***' + process.env.CLOUDINARY_API_SECRET.slice(-4) : 'Not set'}`);

  try {
    // Test API connection with a simple ping
    const result = await cloudinary.api.ping();
    console.log('\n✅ Cloudinary API connection successful!');
    console.log(`   Status: ${result.status}`);
    return true;
  } catch (error) {
    console.log('\n❌ Cloudinary API connection failed:');
    console.log(`   Error: ${error.message}`);
    console.log(`   HTTP Code: ${error.http_code}`);
    return false;
  }
}

async function createAndUploadTestImage() {
  console.log('\n📤 Creating and uploading test image...\n');

  try {
    // Create a simple test image
    const testImageBuffer = await sharp({
      create: {
        width: 400,
        height: 300,
        channels: 3,
        background: { r: 100, g: 150, b: 200 }
      }
    })
    .jpeg({ quality: 80 })
    .toBuffer();

    console.log('✅ Created test image (400x300)');

    // Upload with simplified configuration
    const uploadResult = await cloudinary.uploader.upload(
      `data:image/jpeg;base64,${testImageBuffer.toString('base64')}`,
      {
        public_id: `saroop-restoration/test_${Date.now()}`,
        resource_type: 'image',
        folder: 'saroop-restoration',
        tags: ['test-upload', 'adk-restoration']
      }
    );

    console.log('✅ Upload successful!');
    console.log(`   URL: ${uploadResult.secure_url}`);
    console.log(`   Public ID: ${uploadResult.public_id}`);
    console.log(`   Width: ${uploadResult.width}px`);
    console.log(`   Height: ${uploadResult.height}px`);
    console.log(`   Format: ${uploadResult.format}`);
    console.log(`   Bytes: ${uploadResult.bytes}`);

    return {
      success: true,
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      metadata: {
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
        bytes: uploadResult.bytes
      }
    };

  } catch (error) {
    console.log('❌ Upload failed:');
    console.log(`   Error: ${error.message}`);
    if (error.http_code) {
      console.log(`   HTTP Code: ${error.http_code}`);
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

async function testImageAccess(uploadResult) {
  if (!uploadResult.success) {
    console.log('\n⏭️  Skipping access test - upload failed');
    return;
  }

  console.log('\n🌐 Testing image access...');
  
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(uploadResult.url);
    
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      const contentLength = response.headers.get('content-length');
      
      console.log('✅ Image is publicly accessible!');
      console.log(`   Content-Type: ${contentType}`);
      console.log(`   Content-Length: ${contentLength} bytes`);
      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      return true;
    } else {
      console.log('❌ Image not accessible');
      console.log(`   Status: ${response.status} ${response.statusText}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Error accessing image:');
    console.log(`   ${error.message}`);
    return false;
  }
}

async function cleanupTestImage(uploadResult) {
  if (!uploadResult.success) {
    return;
  }

  console.log('\n🗑️  Cleaning up test image...');
  
  try {
    const result = await cloudinary.uploader.destroy(uploadResult.publicId);
    console.log(`✅ Cleanup successful: ${result.result}`);
  } catch (error) {
    console.log(`⚠️  Cleanup failed: ${error.message}`);
  }
}

// Main test function
async function main() {
  console.log('🧪 Cloudinary Configuration Fix & Test\n');
  console.log('=' .repeat(50));

  try {
    // Step 1: Test connection
    const isConnected = await testCloudinaryConnection();
    
    if (!isConnected) {
      console.log('\n❌ Cannot proceed - fix credentials first');
      process.exit(1);
    }

    // Step 2: Test upload
    const uploadResult = await createAndUploadTestImage();

    // Step 3: Test access
    const isAccessible = await testImageAccess(uploadResult);

    // Step 4: Cleanup
    await cleanupTestImage(uploadResult);

    console.log('\n' + '='.repeat(50));
    
    if (uploadResult.success && isAccessible) {
      console.log('🎉 All tests passed! Cloudinary is working correctly.');
      console.log('\n✅ Ready for production use:');
      console.log('   - API credentials are valid');
      console.log('   - Uploads work correctly');
      console.log('   - Images are publicly accessible');
      console.log('   - Cleanup works');
    } else {
      console.log('⚠️  Issues found:');
      if (!uploadResult.success) {
        console.log('   - Upload failed');
      }
      if (!isAccessible) {
        console.log('   - Images not accessible');
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
main().catch(console.error);