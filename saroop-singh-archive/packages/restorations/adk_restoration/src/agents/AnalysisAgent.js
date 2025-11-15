/**
 * Analysis Agent - Image Understanding with Gemini 2.5 Flash
 */

import { BaseAgent } from './BaseAgent.js';
import { AnalysisSchema } from '../schemas/index.js';

export class AnalysisAgent extends BaseAgent {
  constructor(config = {}) {
    super('AnalysisAgent', {
      modelName: 'gemini-2.5-flash',
      temperature: 0.1, // Low temperature for consistent analysis
      ...config
    });
  }
  
  async analyzeImage(imageData) {
    this.logger.info('Starting image analysis');
    
    const prompt = `Analyze this vintage photograph in detail. Identify:
1. The type of image and its overall quality
2. All visible defects (scratches, tears, fading, stains, etc.)
3. The content (people, setting, era, cultural context)
4. Technical details about the original format

Be thorough and precise in your analysis. This will be used to plan restoration steps.`;
    
    try {
      const analysis = await this.generateWithSchema(prompt, AnalysisSchema, imageData);
      
      this.logger.info(`Analysis complete: ${analysis.imageType}, Quality: ${analysis.quality.overall}/100`);
      this.logger.info(`Defects found: ${analysis.defects.length}`);
      
      // Add metadata
      analysis.metadata = {
        analyzedAt: new Date().toISOString(),
        agent: this.name,
        model: this.modelName
      };
      
      return analysis;
      
    } catch (error) {
      this.logger.error(`Analysis failed: ${error.message}`);
      throw error;
    }
  }
  
  async compareImages(originalData, restoredData) {
    this.logger.info('Comparing original and restored images');
    
    const prompt = `Compare these two images:
1. First image is the original vintage photograph
2. Second image is the restored version

Analyze the improvements made and any remaining issues.`;
    
    const parts = [
      { text: prompt },
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: originalData
        }
      },
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: restoredData
        }
      }
    ];
    
    try {
      const result = await this.model.generateContent(parts);
      const response = await result.response;
      const comparison = response.text();
      
      this.logger.info('Comparison complete');
      return comparison;
      
    } catch (error) {
      this.logger.error(`Comparison failed: ${error.message}`);
      throw error;
    }
  }
}