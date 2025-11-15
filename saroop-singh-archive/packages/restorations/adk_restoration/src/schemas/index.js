/**
 * Structured Output Schemas for ADK Agents
 * These schemas ensure deterministic JSON responses from Gemini
 * Updated to match exact requirements from comprehensive plan
 */

// Exact analyst schema as specified in requirements
export const AnalysisSchema = {
  type: "object",
  properties: {
    // Core image classification
    imageType: {
      type: "string",
      enum: ["portrait", "group_photo", "document", "landscape", "object", "mixed", "unknown"]
    },
    
    // Quality assessment (0-100 scale as per requirements)
    quality: {
      type: "object",
      properties: {
        overall: { type: "number", minimum: 0, maximum: 100 },
        sharpness: { type: "number", minimum: 0, maximum: 100 },
        contrast: { type: "number", minimum: 0, maximum: 100 },
        brightness: { type: "number", minimum: 0, maximum: 100 },
        colorAccuracy: { type: "number", minimum: 0, maximum: 100 },
        grain: { type: "number", minimum: 0, maximum: 100 },
        exposure: { type: "number", minimum: 0, maximum: 100 }
      },
      required: ["overall", "sharpness", "contrast", "brightness", "colorAccuracy", "grain", "exposure"]
    },
    
    // Comprehensive defect detection
    defects: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: [
              "scratch", "tear", "fade", "stain", "dust", "fold", "water_damage", 
              "mold", "missing_part", "burn", "chemical_damage", "foxing",
              "edge_damage", "corner_damage", "pin_holes", "tape_residue",
              "writing_marks", "fingerprints", "discoloration"
            ]
          },
          severity: {
            type: "string",
            enum: ["minor", "moderate", "severe", "critical"]
          },
          location: { type: "string" },
          size: { type: "string" },
          confidence: { type: "number", minimum: 0, maximum: 100 }
        },
        required: ["type", "severity", "location", "confidence"]
      }
    },
    
    // Enhanced content analysis
    content: {
      type: "object",
      properties: {
        people: {
          type: "array",
          items: {
            type: "object",
            properties: {
              position: { type: "string" },
              age: { type: "string" },
              gender: { type: "string" },
              clothing: { type: "string" },
              expression: { type: "string" },
              pose: { type: "string" },
              ethnicity: { type: "string" }
            }
          }
        },
        setting: { type: "string" },
        location: { type: "string" },
        era: { type: "string" },
        culturalContext: { type: "string" },
        occasion: { type: "string" },
        objects: { type: "array", items: { type: "string" } },
        background: { type: "string" },
        composition: { type: "string" }
      }
    },
    
    // Detailed technical analysis
    technicalDetails: {
      type: "object",
      properties: {
        originalFormat: { type: "string" },
        isColorized: { type: "boolean" },
        hasWatermark: { type: "boolean" },
        resolution: { type: "string" },
        aspectRatio: { type: "string" },
        colorSpace: { type: "string" },
        bitDepth: { type: "string" },
        processingHistory: { type: "array", items: { type: "string" } },
        cameraType: { type: "string" },
        printType: { type: "string" }
      }
    },
    
    // Restoration recommendations
    recommendations: {
      type: "object",
      properties: {
        priority: {
          type: "string",
          enum: ["low", "medium", "high", "urgent"]
        },
        complexity: {
          type: "string",
          enum: ["simple", "moderate", "complex", "expert_required"]
        },
        estimatedTime: { type: "string" },
        riskFactors: { type: "array", items: { type: "string" } },
        preservationConcerns: { type: "array", items: { type: "string" } }
      }
    },
    
    // Metadata
    analysisMetadata: {
      type: "object",
      properties: {
        version: { type: "string" },
        timestamp: { type: "string" },
        confidence: { type: "number", minimum: 0, maximum: 100 },
        processingTime: { type: "number" },
        modelUsed: { type: "string" }
      }
    }
  },
  required: ["imageType", "quality", "defects", "content", "technicalDetails", "recommendations", "analysisMetadata"]
};

export const PlanSchema = {
  type: "object",
  properties: {
    strategy: {
      type: "string",
      enum: ["minimal_restoration", "moderate_restoration", "heavy_restoration", "creative_remake", "colorization_only"]
    },
    steps: {
      type: "array",
      items: {
        type: "object",
        properties: {
          stepNumber: { type: "integer", minimum: 1 },
          action: {
            type: "string",
            enum: ["remove_defects", "enhance_sharpness", "adjust_brightness", "adjust_contrast", "colorize", "reconstruct_missing", "creative_enhancement"]
          },
          prompt: { type: "string" },
          temperature: { type: "number", minimum: 0, maximum: 1 },
          expectedOutcome: { type: "string" }
        },
        required: ["stepNumber", "action", "prompt", "temperature", "expectedOutcome"]
      }
    },
    reasoning: { type: "string" },
    estimatedSteps: { type: "integer", minimum: 1, maximum: 10 },
    riskLevel: {
      type: "string",
      enum: ["low", "medium", "high"]
    }
  },
  required: ["strategy", "steps", "reasoning", "estimatedSteps", "riskLevel"]
};

export const EditResultSchema = {
  type: "object",
  properties: {
    stepNumber: { type: "integer" },
    action: { type: "string" },
    success: { type: "boolean" },
    imageGenerated: { type: "boolean" },
    improvements: {
      type: "object",
      properties: {
        sharpnessChange: { type: "number" },
        contrastChange: { type: "number" },
        brightnessChange: { type: "number" },
        defectsRemoved: { type: "integer" }
      }
    },
    metadata: {
      type: "object",
      properties: {
        processingTime: { type: "number" },
        modelUsed: { type: "string" },
        temperature: { type: "number" }
      }
    },
    nextStepRecommended: { type: "boolean" },
    notes: { type: "string" }
  },
  required: ["stepNumber", "action", "success", "imageGenerated", "metadata"]
};

// Exact verifier schema as specified in requirements
export const ValidationSchema = {
  type: "object",
  properties: {
    // Overall quality assessment
    overallScore: { type: "number", minimum: 0, maximum: 100 },
    
    // Detailed criteria scoring (weighted)
    criteria: {
      type: "object",
      properties: {
        preservationOfOriginal: { 
          type: "object",
          properties: {
            score: { type: "number", minimum: 0, maximum: 100 },
            weight: { type: "number", minimum: 0, maximum: 1 },
            details: { type: "string" },
            subScores: {
              type: "object",
              properties: {
                facialFeatures: { type: "number", minimum: 0, maximum: 100 },
                composition: { type: "number", minimum: 0, maximum: 100 },
                historicalAccuracy: { type: "number", minimum: 0, maximum: 100 },
                originalCharacter: { type: "number", minimum: 0, maximum: 100 }
              }
            }
          },
          required: ["score", "weight", "details"]
        },
        defectRemoval: {
          type: "object", 
          properties: {
            score: { type: "number", minimum: 0, maximum: 100 },
            weight: { type: "number", minimum: 0, maximum: 1 },
            details: { type: "string" },
            defectsAddressed: { type: "array", items: { type: "string" } },
            defectsRemaining: { type: "array", items: { type: "string" } }
          },
          required: ["score", "weight", "details"]
        },
        enhancementQuality: {
          type: "object",
          properties: {
            score: { type: "number", minimum: 0, maximum: 100 },
            weight: { type: "number", minimum: 0, maximum: 1 },
            details: { type: "string" },
            improvements: { type: "array", items: { type: "string" } }
          },
          required: ["score", "weight", "details"]
        },
        naturalness: {
          type: "object",
          properties: {
            score: { type: "number", minimum: 0, maximum: 100 },
            weight: { type: "number", minimum: 0, maximum: 1 },
            details: { type: "string" },
            artificialArtifacts: { type: "array", items: { type: "string" } }
          },
          required: ["score", "weight", "details"]
        },
        technicalQuality: {
          type: "object",
          properties: {
            score: { type: "number", minimum: 0, maximum: 100 },
            weight: { type: "number", minimum: 0, maximum: 1 },
            details: { type: "string" },
            technicalMetrics: {
              type: "object",
              properties: {
                sharpness: { type: "number", minimum: 0, maximum: 100 },
                contrast: { type: "number", minimum: 0, maximum: 100 },
                colorBalance: { type: "number", minimum: 0, maximum: 100 },
                noiseLevel: { type: "number", minimum: 0, maximum: 100 }
              }
            }
          },
          required: ["score", "weight", "details"]
        }
      },
      required: ["preservationOfOriginal", "defectRemoval", "enhancementQuality", "naturalness", "technicalQuality"]
    },
    
    // Comprehensive issue detection
    issues: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: [
              "preservation_loss", "over_enhancement", "artificial_artifacts",
              "color_inaccuracy", "detail_loss", "composition_change",
              "face_distortion", "unnatural_enhancement", "technical_degradation",
              "historical_inaccuracy", "texture_loss", "contrast_issues"
            ]
          },
          severity: {
            type: "string", 
            enum: ["minor", "moderate", "critical", "blocker"]
          },
          description: { type: "string" },
          location: { type: "string" },
          impact: { type: "string" },
          suggestedFix: { type: "string" },
          confidence: { type: "number", minimum: 0, maximum: 100 }
        },
        required: ["type", "severity", "description", "confidence"]
      }
    },
    
    // Decision and recommendations
    recommendation: {
      type: "string",
      enum: ["accept", "retry", "refine", "reject", "manual_review"]
    },
    
    confidence: {
      type: "number",
      minimum: 0,
      maximum: 100
    },
    
    // Detailed recommendations for improvement
    refinementSuggestions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: { type: "string" },
          priority: { type: "string", enum: ["low", "medium", "high"] },
          suggestion: { type: "string" },
          expectedImprovement: { type: "number", minimum: 0, maximum: 100 }
        }
      }
    },
    
    // Comparison metrics with original
    comparison: {
      type: "object",
      properties: {
        improvementAreas: { type: "array", items: { type: "string" } },
        regressionAreas: { type: "array", items: { type: "string" } },
        netImprovement: { type: "number", minimum: -100, maximum: 100 },
        keyChanges: { type: "array", items: { type: "string" } }
      }
    },
    
    // QC metadata
    validationMetadata: {
      type: "object", 
      properties: {
        version: { type: "string" },
        timestamp: { type: "string" },
        processingTime: { type: "number" },
        modelUsed: { type: "string" },
        thresholdsUsed: { type: "object" },
        flags: { type: "array", items: { type: "string" } }
      }
    },
    
    // Next steps
    nextSteps: {
      type: "array",
      items: {
        type: "object",
        properties: {
          action: { type: "string" },
          reason: { type: "string" },
          priority: { type: "string", enum: ["low", "medium", "high"] }
        }
      }
    }
  },
  required: ["overallScore", "criteria", "issues", "recommendation", "confidence", "validationMetadata"]
};