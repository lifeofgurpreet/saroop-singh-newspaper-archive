/**
 * Orchestration Module Exports
 */

export { startServer } from './server.js';

// Application lifecycle functions
export const initializeApplication = async () => {
  // Validate environment
  const { BaseAgent } = await import('../agents/index.js');
  BaseAgent.validateEnvironment();
  
  console.log('ADK Restoration System initialized successfully');
};

export const shutdownApplication = async (server) => {
  if (server) {
    await new Promise((resolve) => {
      server.close(resolve);
    });
    console.log('ADK Restoration System shut down successfully');
  }
};