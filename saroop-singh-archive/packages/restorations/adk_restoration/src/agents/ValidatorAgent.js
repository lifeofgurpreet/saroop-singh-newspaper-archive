/**
 * Validator Agent - Quality Check and Validation
 */

import { BaseAgent } from './BaseAgent.js';
import { ValidationSchema } from '../schemas/index.js';

export class ValidatorAgent extends BaseAgent {
  constructor(config = {}) {
    super('ValidatorAgent', {
      modelName: 'gemini-2.5-flash',
      temperature: 0.1,
      ...config
    });
    
    this.thresholds = {
      minimum: 60,
      acceptable: 75,
      excellent: 90
    };
  }
  
  async validateRestoration(originalData, restoredData, plan) {
    this.logger.info('Validating restoration quality');
    
    const prompt = `Compare the original vintage photograph with the restored version and evaluate the restoration quality.

Original plan strategy: ${plan.strategy}
Expected outcomes: ${plan.steps.map(s => s.expectedOutcome).join(', ')}

Evaluate based on:
1. How well the original content and people are preserved
2. Success in removing defects
3. Quality of enhancements
4. Naturalness of the result
5. Overall technical quality

Be critical but fair. This validation will determine if the restoration is acceptable.`;
    
    try {
      // Create parts with both images for comparison
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
      
      // Get structured validation comparing both images using direct model call
      const operation = async () => {
        const schemaParts = [
          {
            text: `You must respond with valid JSON that conforms to this schema:\n${JSON.stringify(ValidationSchema, null, 2)}\n\n${prompt}`
          },
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
        
        const result = await this.model.generateContent(schemaParts);
        const response = await result.response;
        const text = response.text();
        
        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No valid JSON found in response');
        }
        
        return JSON.parse(jsonMatch[0]);
      };
      
      const validation = await this.executeWithRetry(operation);
      
      // Determine final recommendation based on score
      if (validation.overallScore < this.thresholds.minimum) {
        validation.recommendation = 'reject';
        this.logger.warn(`Restoration rejected: Score ${validation.overallScore}`);
      } else if (validation.overallScore < this.thresholds.acceptable) {
        validation.recommendation = 'retry';
        this.logger.info(`Restoration needs retry: Score ${validation.overallScore}`);
      } else if (validation.overallScore < this.thresholds.excellent) {
        validation.recommendation = 'refine';
        this.logger.info(`Restoration needs refinement: Score ${validation.overallScore}`);
      } else {
        validation.recommendation = 'accept';
        this.logger.info(`Restoration accepted: Score ${validation.overallScore}`);
      }
      
      validation.metadata = {
        validatedAt: new Date().toISOString(),
        agent: this.name,
        planStrategy: plan.strategy
      };
      
      return validation;
      
    } catch (error) {
      this.logger.error(`Validation failed: ${error.message}`);
      throw error;
    }
  }
  
  async quickCheck(imageData) {
    this.logger.info('Performing quick quality check');
    
    const prompt = `Quickly assess the quality of this image:
1. Is it properly exposed?
2. Is it sharp and clear?
3. Are there obvious defects?
4. Rate overall quality from 1-10`;
    
    try {
      const parts = [
        { text: prompt },
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: imageData
          }
        }
      ];
      
      const result = await this.model.generateContent(parts);
      const response = await result.response;
      const assessment = response.text();
      
      // Extract score from text
      const scoreMatch = assessment.match(/(\d+)\/10|\b([1-9]|10)\b.*quality/i);
      const score = scoreMatch ? parseInt(scoreMatch[1] || scoreMatch[2]) : 5;
      
      return {
        score: score * 10, // Convert to 0-100 scale
        assessment: assessment,
        passedQuickCheck: score >= 6
      };
      
    } catch (error) {
      this.logger.error(`Quick check failed: ${error.message}`);
      return {
        score: 0,
        assessment: 'Check failed',
        passedQuickCheck: false
      };
    }
  }
}