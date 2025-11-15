#!/usr/bin/env node

import fs from 'fs/promises';
import fetch from 'node-fetch';

async function uploadToImgur() {
  try {
    console.log('🚀 Starting Imgur upload...');
    
    const imagePath = '/tmp/adk_restoration/restored_recOEKuWvTsZv71Qm.jpg';
    
    // Check if file exists
    const stats = await fs.stat(imagePath).catch(() => null);
    if (!stats) {
      throw new Error(`Image file not found: ${imagePath}`);
    }
    
    console.log(`📁 Found image file: ${imagePath}`);
    console.log(`📊 File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    
    // Read image file and convert to base64
    const imageBuffer = await fs.readFile(imagePath);
    const base64Data = imageBuffer.toString('base64');
    
    console.log('☁️ Uploading to Imgur...');
    
    // Upload to Imgur using their anonymous API
    const response = await fetch('https://api.imgur.com/3/image', {
      method: 'POST',
      headers: {
        'Authorization': 'Client-ID 546c25a59c58ad7', // Anonymous client ID
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image: base64Data,
        type: 'base64',
        title: 'Restored Family Portrait - Saroop Singh',
        description: 'AI-restored vintage family portrait from the 1970s'
      })
    });
    
    const result = await response.json();
    
    if (!response.ok || !result.success) {
      throw new Error(`Imgur upload failed: ${result.data?.error || 'Unknown error'}`);
    }
    
    console.log('✅ Upload successful!');
    console.log(`🌐 Imgur URL: ${result.data.link}`);
    console.log(`🏷️  Delete hash: ${result.data.deletehash}`);
    
    return {
      success: true,
      url: result.data.link,
      deleteHash: result.data.deletehash,
      id: result.data.id
    };
    
  } catch (error) {
    console.error('❌ Upload failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  uploadToImgur().then(result => {
    console.log('\\n📋 Final Result:');
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
  });
}

export { uploadToImgur };