/**
 * Files API Manager - Handles Gemini Files API for large files (>20MB)
 * Replaces base64 encoding for better performance and reliability
 */

import fs from 'fs/promises';
import path from 'path';
import { GoogleGenerativeAI, GoogleAIFileManager } from '@google/generative-ai/server';
import { FileManager } from '../utils/FileManager.js';
import winston from 'winston';

export class FilesApiManager {
  constructor() {
    this.localFiles = new FileManager();
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Create proper GoogleAI File Manager instance
    this.gaiFiles = new GoogleAIFileManager(process.env.GEMINI_API_KEY);
    
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
          return `[${timestamp}] [FilesApiManager] ${level}: ${message}`;
        })
      ),
      transports: [new winston.transports.Console()]
    });
    
    // Track uploaded files for cleanup
    this.uploadedFiles = new Set();
    this.maxFileSize = 20 * 1024 * 1024; // 20MB threshold
  }

  /**
   * Determines whether to use Files API or base64 based on file size
   */
  async shouldUseFilesApi(imageData) {
    let sizeInBytes;
    
    if (Buffer.isBuffer(imageData)) {
      sizeInBytes = imageData.length;
    } else if (typeof imageData === 'string') {
      // Base64 string - estimate actual size
      sizeInBytes = (imageData.length * 3) / 4;
    } else {
      this.logger.warn('Unknown image data format, using Files API');
      return true;
    }
    
    this.logger.info(`Image size: ${(sizeInBytes / 1024 / 1024).toFixed(2)}MB`);
    return sizeInBytes > this.maxFileSize;
  }

  /**
   * Upload image to Files API and return file reference
   */
  async uploadImageToFilesApi(imageData, filename = null) {
    try {
      if (!filename) {
        filename = `restoration_${Date.now()}.jpg`;
      }

      // Save image locally first
      const tempPath = await this.localFiles.saveImage(imageData, filename);
      
      this.logger.info(`Uploading ${filename} to Files API...`);
      
      // Upload to Files API
      const uploadResponse = await this.gaiFiles.uploadFile(tempPath, {
        mimeType: 'image/jpeg',
        displayName: filename
      });

      this.logger.info(`File uploaded successfully: ${uploadResponse.file.name}`);
      
      // Track for cleanup
      this.uploadedFiles.add(uploadResponse.file.name);
      
      // Clean up local temp file
      await fs.unlink(tempPath);
      
      return {
        fileUri: `gs://generative-ai-uploads/${uploadResponse.file.name}`,
        fileName: uploadResponse.file.name,
        mimeType: uploadResponse.file.mimeType,
        sizeBytes: uploadResponse.file.sizeBytes
      };
      
    } catch (error) {
      this.logger.error(`Failed to upload to Files API: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create appropriate image parts for Gemini API
   * Automatically chooses between Files API and base64 based on size
   */
  async createImageParts(imageData, filename = null) {
    const useFilesApi = await this.shouldUseFilesApi(imageData);
    
    if (useFilesApi) {
      this.logger.info('Using Files API for large image');
      const fileRef = await this.uploadImageToFilesApi(imageData, filename);
      
      return [{
        fileData: {
          mimeType: fileRef.mimeType,
          fileUri: fileRef.fileUri
        }
      }];
      
    } else {
      this.logger.info('Using base64 encoding for small image');
      
      // Ensure we have base64 data
      let base64Data;
      if (Buffer.isBuffer(imageData)) {
        base64Data = imageData.toString('base64');
      } else if (typeof imageData === 'string') {
        base64Data = imageData;
      } else {
        throw new Error('Invalid image data format');
      }
      
      return [{
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Data
        }
      }];
    }
  }

  /**
   * Generate content with automatic file handling
   */
  async generateWithImage(model, prompt, imageData, filename = null) {
    try {
      const imageParts = await this.createImageParts(imageData, filename);
      
      const parts = [
        { text: prompt },
        ...imageParts
      ];
      
      this.logger.info('Generating content with image...');
      
      const result = await model.generateContent(parts);
      const response = await result.response;
      
      return response;
      
    } catch (error) {
      this.logger.error(`Content generation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate image with automatic file handling
   */
  async generateImageWithFiles(model, prompt, inputImageData, filename = null) {
    try {
      const imageParts = await this.createImageParts(inputImageData, filename);
      
      const parts = [
        { text: prompt },
        ...imageParts
      ];
      
      this.logger.info('Generating image with Files API support...');
      
      const result = await model.generateContent(parts);
      const response = await result.response;
      
      // Extract generated image from response
      for (const candidate of response.candidates || []) {
        if (candidate.content && candidate.content.parts) {
          for (const part of candidate.content.parts) {
            if (part.inlineData && part.inlineData.mimeType && part.inlineData.mimeType.startsWith('image')) {
              return part.inlineData.data;
            }
          }
        }
      }
      
      throw new Error('No image generated in response');
      
    } catch (error) {
      this.logger.error(`Image generation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Download file from Files API
   */
  async downloadFromFilesApi(fileUri) {
    try {
      this.logger.info(`Downloading file: ${fileUri}`);
      
      const response = await fetch(fileUri);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const buffer = await response.buffer();
      return buffer.toString('base64');
      
    } catch (error) {
      this.logger.error(`Download from Files API failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * List all uploaded files
   */
  async listFiles() {
    try {
      const response = await this.gaiFiles.listFiles();
      return response.files || [];
    } catch (error) {
      this.logger.error(`Failed to list files: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete a file from Files API
   */
  async deleteFile(fileName) {
    try {
      this.logger.info(`Deleting file: ${fileName}`);
      
      await this.gaiFiles.deleteFile(fileName);
      this.uploadedFiles.delete(fileName);
      
      this.logger.info(`File deleted successfully: ${fileName}`);
      
    } catch (error) {
      this.logger.error(`Failed to delete file ${fileName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Clean up all uploaded files
   */
  async cleanup() {
    this.logger.info('Cleaning up uploaded files from Files API...');
    
    const deletePromises = Array.from(this.uploadedFiles).map(async (fileName) => {
      try {
        await this.deleteFile(fileName);
      } catch (error) {
        this.logger.warn(`Failed to delete ${fileName}: ${error.message}`);
      }
    });
    
    await Promise.all(deletePromises);
    this.uploadedFiles.clear();
    
    this.logger.info('Files API cleanup completed');
  }

  /**
   * Get file info
   */
  async getFileInfo(fileName) {
    try {
      const response = await this.gaiFiles.getFile(fileName);
      return response.file;
    } catch (error) {
      this.logger.error(`Failed to get file info for ${fileName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Auto-cleanup old files (files older than specified hours)
   */
  async autoCleanup(maxAgeHours = 24) {
    try {
      this.logger.info(`Starting auto-cleanup for files older than ${maxAgeHours} hours`);
      
      const files = await this.listFiles();
      const now = Date.now();
      const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
      
      for (const file of files) {
        const fileAge = now - new Date(file.createTime).getTime();
        
        if (fileAge > maxAgeMs) {
          try {
            await this.deleteFile(file.name);
            this.logger.info(`Auto-deleted old file: ${file.displayName}`);
          } catch (error) {
            this.logger.warn(`Failed to auto-delete ${file.name}: ${error.message}`);
          }
        }
      }
      
    } catch (error) {
      this.logger.error(`Auto-cleanup failed: ${error.message}`);
    }
  }
}