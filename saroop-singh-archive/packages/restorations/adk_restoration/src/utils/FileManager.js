/**
 * File Manager - Handles Files API and Image Operations
 */

import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { CloudImageUploadService } from '../services/CloudImageUploadService.js';

export class FileManager {
  constructor() {
    this.tempDir = '/tmp/adk_restoration';
    this.cloudUploadService = new CloudImageUploadService();
    this.ensureTempDir();
  }
  
  async ensureTempDir() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create temp directory:', error);
    }
  }
  
  async downloadImage(url) {
    console.log(`Downloading image from: ${url}`);
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Convert to consistent format (JPEG)
      const processedBuffer = await sharp(buffer)
        .jpeg({ quality: 95 })
        .toBuffer();
      
      // Convert to base64 for Gemini API
      const base64Data = processedBuffer.toString('base64');
      
      console.log(`Downloaded and processed image: ${buffer.length} bytes`);
      
      return base64Data;
      
    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  }
  
  async saveImage(imageData, filename = null) {
    if (!filename) {
      filename = `image_${uuidv4()}.jpg`;
    }
    
    const filepath = path.join(this.tempDir, filename);
    
    try {
      // Convert base64 to buffer if needed
      const buffer = Buffer.isBuffer(imageData) 
        ? imageData 
        : Buffer.from(imageData, 'base64');
      
      await fs.writeFile(filepath, buffer);
      
      console.log(`Image saved: ${filepath}`);
      return filepath;
      
    } catch (error) {
      console.error('Save failed:', error);
      throw error;
    }
  }
  
  async uploadImage(imageData, filename = null, metadata = {}) {
    console.log('Uploading image to cloud storage service');
    
    try {
      // Save locally first for backup
      const localPath = await this.saveImage(imageData, filename);
      console.log(`Image saved locally at: ${localPath}`);
      
      // Use CloudImageUploadService with fallback
      const uploadResult = await this.cloudUploadService.uploadWithFallback(imageData, {
        originalFilename: filename || 'restored_image.jpg',
        sessionId: metadata.sessionId || 'unknown',
        qualityScore: metadata.qualityScore || 0,
        mode: metadata.mode || 'RESTORE',
        localPath: localPath,
        ...metadata
      }, true); // true = imageData is base64
      
      if (uploadResult.success) {
        console.log(`Image uploaded successfully: ${uploadResult.url}`);
        console.log(`Service used: ${uploadResult.metadata?.service || 'cloudinary'}`);
        return uploadResult.url;
      } else {
        throw new Error(`Cloud upload failed: ${uploadResult.error}`);
      }
      
    } catch (error) {
      console.error('Cloud upload failed:', error);
      throw new Error(`Upload failed: ${error.message}. Please configure Cloudinary properly.`);
    }
  }

  
  async compareImages(image1Data, image2Data) {
    console.log('Comparing images');
    
    try {
      const buffer1 = Buffer.isBuffer(image1Data) 
        ? image1Data 
        : Buffer.from(image1Data, 'base64');
        
      const buffer2 = Buffer.isBuffer(image2Data) 
        ? image2Data 
        : Buffer.from(image2Data, 'base64');
      
      // Get image stats
      const stats1 = await sharp(buffer1).stats();
      const stats2 = await sharp(buffer2).stats();
      
      // Calculate differences
      const brightnessChange = stats2.channels[0].mean - stats1.channels[0].mean;
      const contrastChange = (stats2.channels[0].stdev - stats1.channels[0].stdev) / stats1.channels[0].stdev * 100;
      
      // Get metadata
      const metadata1 = await sharp(buffer1).metadata();
      const metadata2 = await sharp(buffer2).metadata();
      
      return {
        dimensionsMatch: metadata1.width === metadata2.width && metadata1.height === metadata2.height,
        brightnessChange: brightnessChange,
        contrastChange: contrastChange,
        originalSize: buffer1.length,
        newSize: buffer2.length,
        sizeChange: ((buffer2.length - buffer1.length) / buffer1.length * 100).toFixed(2) + '%'
      };
      
    } catch (error) {
      console.error('Comparison failed:', error);
      return null;
    }
  }
  
  async cleanup() {
    console.log('Cleaning up temporary files');
    
    try {
      const files = await fs.readdir(this.tempDir);
      
      for (const file of files) {
        const filepath = path.join(this.tempDir, file);
        const stats = await fs.stat(filepath);
        
        // Delete files older than 1 hour
        const ageInHours = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60);
        if (ageInHours > 1) {
          await fs.unlink(filepath);
          console.log(`Deleted old file: ${file}`);
        }
      }
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }
}