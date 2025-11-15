/**
 * Agent Module Exports
 */

import { BaseAgent } from './BaseAgent.js';
import { AnalysisAgent } from './AnalysisAgent.js';
import { PlannerAgent } from './PlannerAgent.js';
import { EditorAgent } from './EditorAgent.js';
import { ValidatorAgent } from './ValidatorAgent.js';
import { OrchestratorAgent } from './OrchestratorAgent.js';

// Re-export classes
export { BaseAgent, AnalysisAgent, PlannerAgent, EditorAgent, ValidatorAgent, OrchestratorAgent };

// Factory functions for creating pre-configured agents
export const createAnalysisAgent = (config = {}) => new AnalysisAgent(config);
export const createPlannerAgent = (config = {}) => new PlannerAgent(config);
export const createEditorAgent = (config = {}) => new EditorAgent(config);
export const createValidatorAgent = (config = {}) => new ValidatorAgent(config);
export const createOrchestratorAgent = (config = {}) => new OrchestratorAgent(config);