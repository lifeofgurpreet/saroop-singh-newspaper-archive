/**
 * Cloud Image Upload Service - Handles uploading restored images to cloud storage
 * Provides public HTTPS URLs that Airtable can display
 */

import { v2 as cloudinary } from 'cloudinary';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

export class CloudImageUploadService {
  constructor() {
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
    
    this.uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || 'saroop-restoration';
    this.folder = 'saroop-restoration';
  }

  /**
   * Normalize base64 data by stripping data URI prefixes
   */
  normalizeBase64(base64Data) {
    if (typeof base64Data !== 'string') {
      throw new Error('base64Data must be a string');
    }
    
    // Remove data URI prefix if present (e.g., "data:image/jpeg;base64,")
    const dataUriMatch = base64Data.match(/^data:([^;]+);base64,(.+)$/);
    if (dataUriMatch) {
      return dataUriMatch[2]; // Return just the base64 part
    }
    
    // Return as-is if no data URI prefix
    return base64Data;
  }

  /**
   * Upload base64 image to Cloudinary and return public HTTPS URL
   */
  async uploadBase64Image(base64Data, metadata = {}) {
    try {
      // First test if Cloudinary is properly configured
      const configCheck = this.isConfigured();
      if (!configCheck.cloudinary) {
        throw new Error('Cloudinary not properly configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.');
      }

      // Test API connection first
      try {
        await cloudinary.api.ping();
      } catch (pingError) {
        throw new Error(`Cloudinary API not accessible: ${pingError.message}`);
      }

      // Normalize base64 data to prevent double-prefixing
      const normalizedBase64 = this.normalizeBase64(base64Data);

      // Generate unique filename with timestamp and hash
      const timestamp = Date.now();
      const hash = crypto.createHash('md5').update(normalizedBase64.slice(0, 1000)).digest('hex').slice(0, 8);
      const filename = `restored_${timestamp}_${hash}`;

      const uploadOptions = {
        public_id: `${this.folder}/${filename}`,
        resource_type: 'image',
        tags: [
          'saroop-restoration',
          metadata.mode || 'RESTORE',
          `quality-${Math.floor((metadata.qualityScore || 0) / 10) * 10}` // Round to nearest 10
        ]
      };

      // Upload to Cloudinary with proper data URI
      const result = await cloudinary.uploader.upload(
        `data:image/jpeg;base64,${normalizedBase64}`,
        uploadOptions
      );

      return {
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
        metadata: {
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
          cloudinaryUrl: result.secure_url,
          uploadedAt: new Date().toISOString(),
          service: 'cloudinary'
        }
      };

    } catch (error) {
      console.error('Failed to upload image to Cloudinary:', error);
      return {
        success: false,
        error: `Cloudinary upload failed: ${error.message}`,
        url: null
      };
    }
  }

  /**
   * Upload image file from disk to Cloudinary
   */
  async uploadImageFile(filePath, metadata = {}) {
    try {
      // Read file and convert to base64
      const imageBuffer = await fs.readFile(filePath);
      const base64Data = imageBuffer.toString('base64');
      
      // Add filename metadata
      const enrichedMetadata = {
        ...metadata,
        originalFilename: path.basename(filePath),
        originalPath: filePath
      };

      return await this.uploadBase64Image(base64Data, enrichedMetadata);

    } catch (error) {
      console.error(`Failed to upload image file ${filePath}:`, error);
      return {
        success: false,
        error: error.message,
        url: null
      };
    }
  }

  /**
   * Upload with automatic fallback to alternative service
   */
  async uploadWithFallback(imageData, metadata = {}, isBase64 = true) {
    // Try Cloudinary only - no fallback to fake services
    const cloudinaryResult = isBase64 
      ? await this.uploadBase64Image(imageData, metadata)
      : await this.uploadImageFile(imageData, metadata);

    return cloudinaryResult;
  }

  /**
   * Fallback when Cloudinary is not available - returns error instead of fake service
   */
  async uploadToFreeService(imageData, metadata = {}, isBase64 = true) {
    console.error('Cloudinary is not properly configured and no alternative upload service is available.');
    console.error('Please configure Cloudinary credentials in your environment variables:');
    console.error('- CLOUDINARY_CLOUD_NAME');
    console.error('- CLOUDINARY_API_KEY'); 
    console.error('- CLOUDINARY_API_SECRET');
    
    return {
      success: false,
      error: 'No upload service available. Please configure Cloudinary.',
      url: null,
      fallbackNeeded: false
    };
  }

  /**
   * Fallback upload service using imgbb (free) - kept for reference
   */
  async uploadToImgbb(imageData, metadata = {}, isBase64 = true) {
    try {
      const fetch = (await import('node-fetch')).default;
      
      let base64Data = imageData;
      if (!isBase64) {
        // Read file if it's a path
        const imageBuffer = await fs.readFile(imageData);
        base64Data = imageBuffer.toString('base64');
      }

      // imgbb API (free tier: 32MB per image, no account needed for basic use)
      const formData = new FormData();
      formData.append('image', base64Data);
      formData.append('name', metadata.originalFilename || 'restored_image');

      const response = await fetch('https://api.imgbb.com/1/upload?key=your_imgbb_key_here', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`imgbb upload failed: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        return {
          success: true,
          url: result.data.display_url,
          publicId: result.data.id,
          metadata: {
            width: result.data.width,
            height: result.data.height,
            size: result.data.size,
            service: 'imgbb',
            uploadedAt: new Date().toISOString()
          }
        };
      } else {
        throw new Error('imgbb upload failed');
      }

    } catch (error) {
      console.error('Fallback imgbb upload failed:', error);
      
      // Last resort: return a temporary local file server URL
      // (This should be replaced with proper local file serving)
      return {
        success: false,
        error: `All upload services failed: ${error.message}`,
        url: null,
        fallbackNeeded: true
      };
    }
  }

  /**
   * Delete image from cloud storage
   */
  async deleteImage(publicId) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return {
        success: result.result === 'ok',
        result: result.result
      };
    } catch (error) {
      console.error(`Failed to delete image ${publicId}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get upload statistics
   */
  async getUploadStats() {
    try {
      const result = await cloudinary.api.usage();
      return {
        success: true,
        stats: {
          totalImages: result.resources,
          storageUsed: result.storage,
          bandwidth: result.bandwidth,
          lastUpdated: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Failed to get upload stats:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Validate service configuration
   */
  isConfigured() {
    const required = [
      process.env.CLOUDINARY_CLOUD_NAME,
      process.env.CLOUDINARY_API_KEY,
      process.env.CLOUDINARY_API_SECRET
    ];

    const isCloudinaryConfigured = required.every(val => val && val !== 'your-cloud-name' && val !== 'your-api-key' && val !== 'your-api-secret');

    return {
      cloudinary: isCloudinaryConfigured,
      hasAnyService: isCloudinaryConfigured,
      warnings: isCloudinaryConfigured ? [] : ['Cloudinary not configured - images will not be viewable in Airtable']
    };
  }
}