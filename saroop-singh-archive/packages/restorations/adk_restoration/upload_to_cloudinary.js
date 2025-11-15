#!/usr/bin/env node

import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function uploadToCloudinary() {
  try {
    console.log('🚀 Starting Cloudinary upload...');
    
    const imagePath = '/tmp/adk_restoration/restored_recOEKuWvTsZv71Qm.jpg';
    const recordId = 'recOEKuWvTsZv71Qm';
    
    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image file not found: ${imagePath}`);
    }
    
    console.log(`📁 Found image file: ${imagePath}`);
    const stats = fs.statSync(imagePath);
    console.log(`📊 File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    
    // Upload to Cloudinary
    console.log('☁️ Uploading to Cloudinary...');
    const result = await cloudinary.uploader.upload(imagePath, {
      folder: 'saroop-restoration',
      public_id: `restored_${recordId}`,
      resource_type: 'image',
      overwrite: true,
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ]
    });
    
    console.log('✅ Upload successful!');
    console.log(`🌐 Cloudinary URL: ${result.secure_url}`);
    console.log(`🏷️  Public ID: ${result.public_id}`);
    console.log(`📏 Dimensions: ${result.width} x ${result.height}`);
    console.log(`📦 Format: ${result.format}`);
    console.log(`💾 Size: ${(result.bytes / 1024 / 1024).toFixed(2)} MB`);
    
    return {
      success: true,
      cloudinaryUrl: result.secure_url,
      publicId: result.public_id,
      dimensions: { width: result.width, height: result.height },
      format: result.format,
      sizeBytes: result.bytes
    };
    
  } catch (error) {
    console.error('❌ Cloudinary upload failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  uploadToCloudinary().then(result => {
    console.log('\n📋 Final Result:');
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
  });
}

export { uploadToCloudinary };