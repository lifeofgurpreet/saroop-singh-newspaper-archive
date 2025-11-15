#!/usr/bin/env node

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import { CloudImageUploadService } from './src/services/CloudImageUploadService.js';
import { AirtableManager } from './src/tools/AirtableManager.js';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

async function uploadAndUpdate() {
  try {
    console.log('🚀 Starting Cloudinary upload and Airtable update...');
    
    const imagePath = '/tmp/adk_restoration/restored_recOEKuWvTsZv71Qm.jpg';
    const recordId = 'recOEKuWvTsZv71Qm';
    
    // Check if file exists
    const stats = await fs.stat(imagePath).catch(() => null);
    if (!stats) {
      throw new Error(`Image file not found: ${imagePath}`);
    }
    
    console.log(`📁 Found image file: ${imagePath}`);
    console.log(`📊 File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    
    // Read image file and convert to base64
    console.log('📖 Reading image file...');
    const imageBuffer = await fs.readFile(imagePath);
    const base64Data = imageBuffer.toString('base64');
    const dataUri = `data:image/jpeg;base64,${base64Data}`;
    
    console.log(`🔄 Converted to base64: ${(base64Data.length / 1024 / 1024).toFixed(2)} MB`);
    
    // Initialize services
    console.log('🔧 Initializing services...');
    const cloudService = new CloudImageUploadService();
    const airtable = new AirtableManager();
    await airtable.initialize();
    
    // Upload to Cloudinary
    console.log('☁️ Uploading to Cloudinary...');
    const uploadResult = await cloudService.uploadBase64Image(dataUri, {
      originalFilename: 'extended-family-portrait-1970s-group.jpg',
      sessionId: 'manual_upload_session',
      qualityScore: '81/100',
      mode: 'RESTORE'
    });
    
    if (!uploadResult.success) {
      throw new Error(`Cloudinary upload failed: ${uploadResult.error}`);
    }
    
    console.log('✅ Upload successful!');
    console.log(`🌐 Cloudinary URL: ${uploadResult.url}`);
    console.log(`🏷️  Public ID: ${uploadResult.publicId}`);
    
    // Update Airtable record
    console.log('📝 Updating Airtable record...');
    const updateData = {
      'Result URL': uploadResult.url,
      'Status': 'Completed',
      'Notes': 'Successfully uploaded to Cloudinary and made viewable in Airtable',
      'Processing Completed': new Date().toISOString()
    };
    
    await airtable.updateRecord('tbl4GR7nRThBJ9y5Z', recordId, updateData);
    console.log('✅ Airtable record updated successfully!');
    
    return {
      success: true,
      cloudinaryUrl: uploadResult.url,
      publicId: uploadResult.publicId,
      airtableRecordId: recordId,
      message: 'Image successfully uploaded to Cloudinary and Airtable record updated'
    };
    
  } catch (error) {
    console.error('❌ Process failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  uploadAndUpdate().then(result => {
    console.log('\n📋 Final Result:');
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
  });
}

export { uploadAndUpdate };