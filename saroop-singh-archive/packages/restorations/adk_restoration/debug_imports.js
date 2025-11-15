#!/usr/bin/env node

// Test individual imports to identify the issue

console.log('Testing imports...');

try {
  console.log('1. Testing OrchestratorAgent import...');
  const { OrchestratorAgent } = await import('./src/agents/OrchestratorAgent.js');
  console.log('✅ OrchestratorAgent imported successfully');
} catch (error) {
  console.error('❌ Failed to import OrchestratorAgent:', error.message);
}

try {
  console.log('2. Testing AirtableManager import...');
  const { AirtableManager } = await import('./src/tools/AirtableManager.js');
  console.log('✅ AirtableManager imported successfully');
} catch (error) {
  console.error('❌ Failed to import AirtableManager:', error.message);
}

try {
  console.log('3. Testing FilesApiManager import...');
  const { FilesApiManager } = await import('./src/tools/FilesApiManager.js');
  console.log('✅ FilesApiManager imported successfully');
} catch (error) {
  console.error('❌ Failed to import FilesApiManager:', error.message);
}

try {
  console.log('4. Testing CloudImageUploadService import...');
  const { CloudImageUploadService } = await import('./src/services/CloudImageUploadService.js');
  console.log('✅ CloudImageUploadService imported successfully');
} catch (error) {
  console.error('❌ Failed to import CloudImageUploadService:', error.message);
}

try {
  console.log('5. Testing E2ETestSuite import...');
  const { E2ETestSuite } = await import('./src/testing/E2ETestSuite.js');
  console.log('✅ E2ETestSuite imported successfully');
} catch (error) {
  console.error('❌ Failed to import E2ETestSuite:', error.message);
}

try {
  console.log('6. Testing AuditLogger import...');
  const { AuditLogger } = await import('./src/utils/AuditLogger.js');
  console.log('✅ AuditLogger imported successfully');
} catch (error) {
  console.error('❌ Failed to import AuditLogger:', error.message);
}

try {
  console.log('7. Testing AdkRestorationService import...');
  const { AdkRestorationService } = await import('./src/services/AdkRestorationService.js');
  console.log('✅ AdkRestorationService imported successfully');
} catch (error) {
  console.error('❌ Failed to import AdkRestorationService:', error.message);
  console.error('Full error:', error);
}

console.log('Import testing complete.');