/**
 * Base Agent Class for ADK Restoration System
 * Provides common functionality for all agents with modern async patterns
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import winston from 'winston';

export class BaseAgent {
  constructor(name, config = {}) {
    this.name = name;
    this.config = {
      modelName: config.modelName || 'gemini-2.5-flash',
      temperature: config.temperature || 0.4,
      topP: config.topP || 0.95,
      topK: config.topK || 40,
      maxOutputTokens: config.maxOutputTokens || 8192,
      rateLimitDelay: config.rateLimitDelay || parseInt(process.env.RATE_LIMIT_DELAY_MS) || 500,
      maxRetries: config.maxRetries || parseInt(process.env.MAX_RETRIES) || 3,
      ...config
    };
    
    this.logger = this._createLogger();
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this._createModel();
  }
  
  _createLogger() {
    return winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
          return `[${timestamp}] [${this.name}] ${level}: ${message}`;
        })
      ),
      transports: [new winston.transports.Console()]
    });
  }
  
  _createModel() {
    return this.genAI.getGenerativeModel({ 
      model: this.config.modelName,
      generationConfig: {
        temperature: this.config.temperature,
        topP: this.config.topP,
        topK: this.config.topK,
        maxOutputTokens: this.config.maxOutputTokens,
      }
    });
  }
  
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  async executeWithRetry(operation, context = {}) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        this.logger.info(`Executing operation (attempt ${attempt}/${this.config.maxRetries})`, { context });
        
        // Rate limiting
        await this.sleep(this.config.rateLimitDelay);
        
        const result = await operation();
        
        this.logger.info(`Operation successful on attempt ${attempt}`);
        return result;
        
      } catch (error) {
        lastError = error;
        this.logger.error(`Attempt ${attempt} failed: ${error.message}`, { 
          error: error.stack,
          context 
        });
        
        if (attempt < this.config.maxRetries) {
          const backoffTime = Math.min(1000 * Math.pow(2, attempt), 10000);
          this.logger.info(`Waiting ${backoffTime}ms before retry...`);
          await this.sleep(backoffTime);
        }
      }
    }
    
    this.logger.error(`All attempts failed: ${lastError.message}`, { 
      error: lastError.stack,
      context 
    });
    throw lastError;
  }
  
  async generateWithSchema(prompt, schema, imageData = null) {
    const operation = async () => {
      const parts = [];
      
      // Add structured output instruction
      parts.push({
        text: `You must respond with valid JSON that conforms to this schema:\n${JSON.stringify(schema, null, 2)}\n\n${prompt}`
      });
      
      // Add image if provided
      if (imageData) {
        parts.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: imageData
          }
        });
      }
      
      const result = await this.model.generateContent(parts);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed;
    };
    
    return this.executeWithRetry(operation);
  }
  
  async generateImage(prompt, imageData) {
    const operation = async () => {
      // Use the image generation model
      const imageModel = this.genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash-image-preview',
        generationConfig: {
          temperature: this.config.temperature || 0.7,
          topP: this.config.topP,
          topK: this.config.topK,
          maxOutputTokens: this.config.maxOutputTokens,
        }
      });
      
      const parts = [
        { text: prompt },
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: imageData
          }
        }
      ];
      
      const result = await imageModel.generateContent(parts);
      const response = await result.response;
      
      // Extract generated image from response
      const generatedImageData = this._extractImageFromResponse(response);
      if (!generatedImageData) {
        throw new Error('No image generated in response');
      }
      
      return generatedImageData;
    };
    
    return this.executeWithRetry(operation, { prompt: prompt.substring(0, 100) + '...' });
  }
  
  _extractImageFromResponse(response) {
    for (const candidate of response.candidates || []) {
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData && part.inlineData.mimeType && part.inlineData.mimeType.startsWith('image')) {
            return part.inlineData.data;
          }
        }
      }
    }
    return null;
  }
  
  logMetrics(metrics) {
    this.logger.info(`Metrics`, { metrics });
  }
  
  // Factory method for creating configured agent instances
  static create(name, config = {}) {
    return new this(name, config);
  }
  
  // Validate environment variables
  static validateEnvironment() {
    const required = ['GEMINI_API_KEY'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }
}