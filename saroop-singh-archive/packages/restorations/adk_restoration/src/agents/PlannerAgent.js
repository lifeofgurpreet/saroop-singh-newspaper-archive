/**
 * Planner Agent - Creates Restoration Plan Based on Analysis
 */

import { BaseAgent } from './BaseAgent.js';
import { PlanSchema } from '../schemas/index.js';

export class PlannerAgent extends BaseAgent {
  constructor(config = {}) {
    super('PlannerAgent', {
      modelName: 'gemini-2.5-flash',
      temperature: 0.3,
      ...config
    });
    
    // Define restoration rules for different situations
    this.rules = {
      heavyDamage: {
        condition: (analysis) => analysis.quality.overall < 40 || analysis.defects.filter(d => d.severity === 'severe').length > 2,
        strategy: 'heavy_restoration',
        steps: [
          { action: 'remove_defects', temperature: 0.3 },
          { action: 'reconstruct_missing', temperature: 0.5 },
          { action: 'enhance_sharpness', temperature: 0.3 },
          { action: 'adjust_brightness', temperature: 0.2 },
          { action: 'colorize', temperature: 0.4 }
        ]
      },
      moderateDamage: {
        condition: (analysis) => analysis.quality.overall >= 40 && analysis.quality.overall < 70,
        strategy: 'moderate_restoration',
        steps: [
          { action: 'remove_defects', temperature: 0.3 },
          { action: 'enhance_sharpness', temperature: 0.3 },
          { action: 'adjust_contrast', temperature: 0.2 },
          { action: 'colorize', temperature: 0.4 }
        ]
      },
      minorDamage: {
        condition: (analysis) => analysis.quality.overall >= 70,
        strategy: 'minimal_restoration',
        steps: [
          { action: 'remove_defects', temperature: 0.2 },
          { action: 'enhance_sharpness', temperature: 0.2 },
          { action: 'adjust_brightness', temperature: 0.2 }
        ]
      },
      blackAndWhite: {
        condition: (analysis) => !analysis.technicalDetails.isColorized,
        strategy: 'colorization_only',
        steps: [
          { action: 'colorize', temperature: 0.5 }
        ]
      }
    };
  }
  
  async createPlan(analysis, mode = 'RESTORE') {
    this.logger.info(`Creating ${mode} plan based on analysis`);
    
    // Determine strategy based on rules
    let selectedRule = null;
    for (const [name, rule] of Object.entries(this.rules)) {
      if (rule.condition(analysis)) {
        selectedRule = rule;
        this.logger.info(`Selected rule: ${name}`);
        break;
      }
    }
    
    if (!selectedRule) {
      selectedRule = this.rules.moderateDamage;
    }
    
    // Build prompt for plan generation
    const prompt = `Based on this image analysis, create a detailed restoration plan.

Analysis Summary:
- Image Type: ${analysis.imageType}
- Overall Quality: ${analysis.quality.overall}/100
- Defects: ${analysis.defects.map(d => `${d.type} (${d.severity})`).join(', ')}
- Era: ${analysis.content.era}
- Mode: ${mode}

Create a step-by-step plan to ${mode === 'RESTORE' ? 'restore this image to its original quality' : 'creatively remake this image with modern techniques'}.`;
    
    try {
      const plan = await this.generateWithSchema(prompt, PlanSchema);
      
      // Override with rule-based steps if in RESTORE mode
      if (mode === 'RESTORE') {
        plan.strategy = selectedRule.strategy;
        plan.steps = selectedRule.steps.map((step, index) => ({
          stepNumber: index + 1,
          action: step.action,
          prompt: this.generateStepPrompt(step.action, analysis),
          temperature: step.temperature,
          expectedOutcome: this.getExpectedOutcome(step.action)
        }));
      }
      
      // Adjust temperatures for REMAKE mode
      if (mode === 'REMAKE') {
        plan.steps = plan.steps.map(step => ({
          ...step,
          temperature: Math.min(step.temperature + 0.3, 0.9)
        }));
      }
      
      this.logger.info(`Plan created: ${plan.strategy}, ${plan.steps.length} steps`);
      
      plan.metadata = {
        createdAt: new Date().toISOString(),
        agent: this.name,
        mode: mode
      };
      
      return plan;
      
    } catch (error) {
      this.logger.error(`Plan creation failed: ${error.message}`);
      throw error;
    }
  }
  
  generateStepPrompt(action, analysis) {
    const prompts = {
      remove_defects: `Remove all visible defects from this vintage photograph including: ${analysis.defects.map(d => d.type).join(', ')}. Preserve all original content and composition.`,
      
      enhance_sharpness: 'Enhance the sharpness and clarity of this image. Make details crisp and clear while maintaining natural appearance.',
      
      adjust_brightness: 'Adjust the brightness levels to optimal values. Remove any darkness or overexposure while preserving the vintage aesthetic.',
      
      adjust_contrast: 'Improve contrast to make the image more vibrant. Enhance the difference between light and dark areas.',
      
      colorize: `Add natural, historically accurate colors to this ${analysis.content.era} photograph. Consider the cultural context: ${analysis.content.culturalContext}.`,
      
      reconstruct_missing: 'Reconstruct any missing or severely damaged parts of the image using context clues from the surrounding areas.',
      
      creative_enhancement: 'Apply artistic enhancements to create a modern, professional-quality version while preserving the original subjects and composition.'
    };
    
    return prompts[action] || 'Process this image to improve its quality.';
  }
  
  getExpectedOutcome(action) {
    const outcomes = {
      remove_defects: 'All scratches, stains, and damage removed',
      enhance_sharpness: 'Image appears sharp and clear with enhanced details',
      adjust_brightness: 'Properly exposed image with balanced lighting',
      adjust_contrast: 'Improved visual depth and vibrancy',
      colorize: 'Natural-looking colors appropriate to the era',
      reconstruct_missing: 'Missing parts seamlessly reconstructed',
      creative_enhancement: 'Artistically enhanced version with modern quality'
    };
    
    return outcomes[action] || 'Image quality improved';
  }
}