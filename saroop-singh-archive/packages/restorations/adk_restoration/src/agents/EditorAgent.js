/**
 * Editor Agent - Applies Edits with Gemini 2.5 Flash Image
 */

import { BaseAgent } from './BaseAgent.js';
import { EditResultSchema } from '../schemas/index.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

export class EditorAgent extends BaseAgent {
  constructor(config = {}) {
    super('EditorAgent', {
      modelName: 'gemini-2.5-flash-image-preview',
      temperature: 0.3,
      ...config
    });
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  
  async applyEdit(imageData, step, previousResult = null) {
    this.logger.info(`Applying edit: Step ${step.stepNumber} - ${step.action}`);
    
    try {
      const startTime = Date.now();
      
      // Generate the edited image with specific temperature
      const editedImageData = await this.generateImageWithTemp(step.prompt, imageData, step.temperature);
      
      const processingTime = (Date.now() - startTime) / 1000;
      
      // Create result with schema
      const result = {
        stepNumber: step.stepNumber,
        action: step.action,
        success: true,
        imageGenerated: true,
        improvements: {
          sharpnessChange: 0,
          contrastChange: 0,
          brightnessChange: 0,
          defectsRemoved: 0
        },
        metadata: {
          processingTime: processingTime,
          modelUsed: 'gemini-2.5-flash-image-preview',
          temperature: step.temperature
        },
        nextStepRecommended: true,
        notes: `Successfully applied ${step.action}`,
        resultImageData: editedImageData
      };
      
      // Estimate improvements based on action
      if (step.action === 'enhance_sharpness') {
        result.improvements.sharpnessChange = 2.5;
      } else if (step.action === 'adjust_contrast') {
        result.improvements.contrastChange = 2.0;
      } else if (step.action === 'adjust_brightness') {
        result.improvements.brightnessChange = 1.5;
      } else if (step.action === 'remove_defects') {
        result.improvements.defectsRemoved = 5;
      }
      
      this.logger.info(`Edit successful in ${processingTime.toFixed(2)}s`);
      
      return result;
      
    } catch (error) {
      this.logger.error(`Edit failed: ${error.message}`);
      
      return {
        stepNumber: step.stepNumber,
        action: step.action,
        success: false,
        imageGenerated: false,
        improvements: {
          sharpnessChange: 0,
          contrastChange: 0,
          brightnessChange: 0,
          defectsRemoved: 0
        },
        metadata: {
          processingTime: 0,
          modelUsed: 'gemini-2.5-flash-image-preview',
          temperature: step.temperature
        },
        nextStepRecommended: false,
        notes: `Failed: ${error.message}`
      };
    }
  }
  
  /**
   * Generate image with specific temperature setting
   */
  async generateImageWithTemp(prompt, imageData, temperature) {
    const operation = async () => {
      // Create model with specific temperature
      const imageModel = this.genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash-image-preview',
        generationConfig: {
          temperature: temperature || this.config.temperature,
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
    
    return this.executeWithRetry(operation, { prompt: prompt.substring(0, 100) + '...', temperature });
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
  
  async batchEdit(imageData, steps) {
    this.logger.info(`Starting batch edit with ${steps.length} steps`);
    
    const results = [];
    let currentImageData = imageData;
    
    for (const step of steps) {
      const result = await this.applyEdit(
        currentImageData,
        step,
        results.length > 0 ? results[results.length - 1] : null
      );
      
      results.push(result);
      
      if (result.success && result.resultImageData) {
        // Use the edited image for the next step
        currentImageData = result.resultImageData;
        
        // Remove resultImageData from result to save memory
        delete result.resultImageData;
      } else {
        this.logger.warn(`Step ${step.stepNumber} failed, stopping batch`);
        break;
      }
      
      // Rate limiting between steps
      await this.sleep(this.config.rateLimitDelay);
    }
    
    this.logger.info(`Batch edit complete: ${results.filter(r => r.success).length}/${steps.length} successful`);
    
    return {
      results: results,
      finalImageData: currentImageData,
      success: results.every(r => r.success)
    };
  }
}