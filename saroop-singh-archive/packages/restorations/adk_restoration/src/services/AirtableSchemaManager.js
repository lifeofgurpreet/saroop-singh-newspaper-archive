/**
 * Airtable Schema Manager - Sets up and manages comprehensive Airtable schema
 * Creates all required tables and fields for the ADK restoration system
 */

export class AirtableSchemaManager {
  constructor(airtableManager) {
    this.airtable = airtableManager;
    this.requiredTables = this.getRequiredSchema();
  }

  /**
   * Get the complete required schema for ADK restoration system
   */
  getRequiredSchema() {
    return {
      // Enhanced Photos table with all required fields
      Photos: {
        tableId: 'tbl4GR7nRThBJ9y5Z', // Existing PhotoGallery table
        requiredFields: {
          'Record ID': { type: 'singleLineText', description: 'Primary key' },
          'Content Hash': { type: 'singleLineText', description: 'SHA256 hash for idempotency' },
          'Idempotency Key': { type: 'singleLineText', description: 'Unique processing key' },
          'Original URL': { type: 'url', description: 'Original image URL' },
          'Result URL': { type: 'url', description: 'Restored image public URL' },
          'Status': { 
            type: 'singleSelect', 
            options: ['Queued', 'Analyzing', 'Planning', 'Editing', 'Validating', 'Decided', 'Completed', 'Failed'],
            description: 'Current processing status'
          },
          'Quality Score': { type: 'number', precision: 0, description: 'Overall quality score (0-100)' },
          'Preservation Score': { type: 'number', precision: 0, description: 'Historical preservation score' },
          'Defect Removal Score': { type: 'number', precision: 0, description: 'Defect removal effectiveness' },
          'Enhancement Score': { type: 'number', precision: 0, description: 'Enhancement quality score' },
          'Naturalness Score': { type: 'number', precision: 0, description: 'Natural appearance score' },
          'Technical Score': { type: 'number', precision: 0, description: 'Technical quality score' },
          'QC Decision': { 
            type: 'singleSelect',
            options: ['APPROVE', 'APPROVE_WITH_NOTES', 'RETRY', 'MANUAL_REVIEW', 'REJECT'],
            description: 'Quality control decision'
          },
          'Processing Started': { type: 'dateTime', description: 'When processing began' },
          'Processing Completed': { type: 'dateTime', description: 'When processing finished' },
          'Processing Time (s)': { type: 'number', precision: 2, description: 'Total processing time' },
          'Mode': { 
            type: 'singleSelect',
            options: ['RESTORE', 'ENHANCE', 'REIMAGINE'],
            description: 'Restoration mode used'
          },
          'Retry Count': { type: 'number', precision: 0, description: 'Number of retry attempts' },
          'Router Rules Version': { type: 'singleLineText', description: 'Version of router rules used' },
          'Workflow': { type: 'multipleRecordLinks', description: 'Link to workflow record' },
          'Notes': { type: 'multilineText', description: 'Processing notes and details' },
          'Error Message': { type: 'multilineText', description: 'Error details if failed' },
          'Created': { type: 'createdTime', description: 'Record creation timestamp' },
          'Modified': { type: 'lastModifiedTime', description: 'Last modification timestamp' }
        }
      },

      // Runs table for tracking individual processing runs
      Runs: {
        tableId: 'tblRuns001', // New table
        requiredFields: {
          'Run ID': { type: 'singleLineText', description: 'Unique run identifier' },
          'Photo': { type: 'multipleRecordLinks', linkedTable: 'Photos', description: 'Link to photo record' },
          'Session ID': { type: 'singleLineText', description: 'Processing session identifier' },
          'Status': {
            type: 'singleSelect',
            options: ['QUEUED', 'ANALYZING', 'PLANNING', 'EDITING', 'VALIDATING', 'DECIDED', 'COMPLETED', 'FAILED'],
            description: 'Current run status'
          },
          'Mode': {
            type: 'singleSelect', 
            options: ['RESTORE', 'ENHANCE', 'REIMAGINE'],
            description: 'Restoration mode'
          },
          'Started At': { type: 'dateTime', description: 'Run start time' },
          'Completed At': { type: 'dateTime', description: 'Run completion time' },
          'Duration (s)': { type: 'number', precision: 2, description: 'Total run duration' },
          'Steps Completed': { type: 'number', precision: 0, description: 'Number of steps completed' },
          'Total Steps': { type: 'number', precision: 0, description: 'Total planned steps' },
          'Quality Score': { type: 'number', precision: 0, description: 'Final quality score' },
          'QC Decision': {
            type: 'singleSelect',
            options: ['APPROVE', 'APPROVE_WITH_NOTES', 'RETRY', 'MANUAL_REVIEW', 'REJECT'],
            description: 'QC outcome'
          },
          'Router Rules Version': { type: 'singleLineText', description: 'Router rules version used' },
          'Retry Attempt': { type: 'number', precision: 0, description: 'Retry attempt number (0 for first attempt)' },
          'Parent Run': { type: 'multipleRecordLinks', linkedTable: 'Runs', description: 'Original run if this is a retry' },
          'Error Details': { type: 'multilineText', description: 'Error information if failed' },
          'Configuration': { type: 'multilineText', description: 'JSON configuration used' },
          'Created': { type: 'createdTime', description: 'Record creation time' }
        }
      },

      // Run Steps table for detailed step tracking
      RunSteps: {
        tableId: 'tblRunSteps001', // New table
        requiredFields: {
          'Step ID': { type: 'singleLineText', description: 'Unique step identifier' },
          'Run': { type: 'multipleRecordLinks', linkedTable: 'Runs', description: 'Parent run' },
          'Step Number': { type: 'number', precision: 0, description: 'Step sequence number' },
          'Step Name': { type: 'singleLineText', description: 'Name/type of step' },
          'Status': {
            type: 'singleSelect',
            options: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'SKIPPED'],
            description: 'Step status'
          },
          'Started At': { type: 'dateTime', description: 'Step start time' },
          'Completed At': { type: 'dateTime', description: 'Step completion time' },
          'Duration (s)': { type: 'number', precision: 3, description: 'Step duration' },
          'Prompt Used': { type: 'multilineText', description: 'AI prompt used' },
          'Temperature': { type: 'number', precision: 2, description: 'AI temperature setting' },
          'Model Used': { type: 'singleLineText', description: 'AI model identifier' },
          'Token Usage': { type: 'number', precision: 0, description: 'Tokens consumed' },
          'Quality Score': { type: 'number', precision: 0, description: 'Step quality score' },
          'Success': { type: 'checkbox', description: 'Whether step succeeded' },
          'Retry Count': { type: 'number', precision: 0, description: 'Number of retries for this step' },
          'Error Message': { type: 'multilineText', description: 'Error details if failed' },
          'Input Size (bytes)': { type: 'number', precision: 0, description: 'Input data size' },
          'Output Size (bytes)': { type: 'number', precision: 0, description: 'Output data size' },
          'Metadata': { type: 'multilineText', description: 'Additional step metadata (JSON)' },
          'Created': { type: 'createdTime', description: 'Record creation time' }
        }
      },

      // Batches table for batch processing management
      Batches: {
        tableId: 'tblBatches001', // New table
        requiredFields: {
          'Batch ID': { type: 'singleLineText', description: 'Unique batch identifier' },
          'Batch Name': { type: 'singleLineText', description: 'Human-readable batch name' },
          'Status': {
            type: 'singleSelect',
            options: ['QUEUED', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED'],
            description: 'Batch processing status'
          },
          'Total Items': { type: 'number', precision: 0, description: 'Total photos in batch' },
          'Completed Items': { type: 'number', precision: 0, description: 'Successfully completed photos' },
          'Failed Items': { type: 'number', precision: 0, description: 'Failed photos' },
          'Progress %': { type: 'percent', precision: 1, description: 'Completion percentage' },
          'Started At': { type: 'dateTime', description: 'Batch start time' },
          'Completed At': { type: 'dateTime', description: 'Batch completion time' },
          'Estimated Completion': { type: 'dateTime', description: 'ETA for completion' },
          'Total Duration (s)': { type: 'number', precision: 2, description: 'Total processing time' },
          'Average Quality Score': { type: 'number', precision: 1, description: 'Average quality across batch' },
          'Default Mode': {
            type: 'singleSelect',
            options: ['RESTORE', 'ENHANCE', 'REIMAGINE'],
            description: 'Default restoration mode for batch'
          },
          'Concurrency Limit': { type: 'number', precision: 0, description: 'Max concurrent processing' },
          'Retry Policy': { type: 'singleLineText', description: 'Retry policy name' },
          'Configuration': { type: 'multilineText', description: 'Batch configuration (JSON)' },
          'Error Summary': { type: 'multilineText', description: 'Summary of errors encountered' },
          'Created By': { type: 'singleLineText', description: 'User or system that created batch' },
          'Created': { type: 'createdTime', description: 'Batch creation time' }
        }
      },

      // Enhanced existing tables
      Workflows: {
        tableId: 'tblJEswt7T25UopXC', // Existing table
        additionalFields: {
          'Router Rules Version': { type: 'singleLineText', description: 'Compatible router rules version' },
          'Quality Thresholds': { type: 'multilineText', description: 'Quality threshold overrides (JSON)' },
          'Default Mode': {
            type: 'singleSelect',
            options: ['RESTORE', 'ENHANCE', 'REIMAGINE'],
            description: 'Default restoration mode'
          },
          'Success Rate %': { type: 'percent', precision: 1, description: 'Historical success rate' },
          'Average Quality Score': { type: 'number', precision: 1, description: 'Average quality produced' },
          'Last Used': { type: 'dateTime', description: 'When workflow was last used' },
          'Usage Count': { type: 'number', precision: 0, description: 'Times this workflow has been used' }
        }
      },

      TestRuns: {
        tableId: 'tbli5AIwBu8a08yZv', // Existing table
        additionalFields: {
          'Run': { type: 'multipleRecordLinks', linkedTable: 'Runs', description: 'Link to main run' },
          'Step': { type: 'multipleRecordLinks', linkedTable: 'RunSteps', description: 'Link to specific step' },
          'Quality Score': { type: 'number', precision: 0, description: 'Quality score for this test' },
          'Token Usage': { type: 'number', precision: 0, description: 'AI tokens consumed' },
          'Error Category': {
            type: 'singleSelect',
            options: ['API_ERROR', 'QUALITY_FAILURE', 'TIMEOUT', 'RESOURCE_LIMIT', 'VALIDATION_ERROR'],
            description: 'Type of error if failed'
          },
          'Retry Reason': { type: 'multilineText', description: 'Why this test was retried' }
        }
      }
    };
  }

  /**
   * Verify and create missing tables and fields
   */
  async setupSchema() {
    console.log('Setting up Airtable schema for ADK restoration system...');
    
    const results = {
      tablesChecked: 0,
      fieldsAdded: 0,
      errors: []
    };

    for (const [tableName, config] of Object.entries(this.requiredTables)) {
      try {
        results.tablesChecked++;
        console.log(`Checking table: ${tableName}`);

        // Note: Airtable.js doesn't support schema creation via API
        // This method documents what needs to be created manually
        // or via Airtable's metadata API (enterprise feature)
        
        await this.validateTableFields(tableName, config);
        
      } catch (error) {
        console.error(`Error setting up table ${tableName}:`, error);
        results.errors.push({ table: tableName, error: error.message });
      }
    }

    console.log(`Schema setup completed. Checked ${results.tablesChecked} tables.`);
    if (results.errors.length > 0) {
      console.warn(`${results.errors.length} errors encountered:`, results.errors);
    }

    return results;
  }

  /**
   * Validate that a table has required fields (documentary)
   */
  async validateTableFields(tableName, config) {
    // Since we can't create schema via API, we document what's needed
    const requiredFields = config.requiredFields || config.additionalFields || {};
    
    console.log(`Table ${tableName} requires ${Object.keys(requiredFields).length} fields:`);
    
    for (const [fieldName, fieldConfig] of Object.entries(requiredFields)) {
      console.log(`  - ${fieldName}: ${fieldConfig.type} (${fieldConfig.description})`);
      
      if (fieldConfig.type === 'singleSelect' && fieldConfig.options) {
        console.log(`    Options: ${fieldConfig.options.join(', ')}`);
      }
      
      if (fieldConfig.linkedTable) {
        console.log(`    Links to: ${fieldConfig.linkedTable}`);
      }
    }
  }

  /**
   * Generate schema creation script for manual setup
   */
  generateSchemaScript() {
    let script = '# Airtable Schema Setup Script\n\n';
    script += '# This script documents the required schema for the ADK Restoration System\n';
    script += '# Tables and fields must be created manually in Airtable interface\n\n';

    for (const [tableName, config] of Object.entries(this.requiredTables)) {
      script += `## Table: ${tableName}\n`;
      if (config.tableId) {
        script += `Table ID: ${config.tableId}\n`;
      }
      script += '\n### Required Fields:\n\n';

      const fields = config.requiredFields || config.additionalFields || {};
      
      for (const [fieldName, fieldConfig] of Object.entries(fields)) {
        script += `- **${fieldName}**\n`;
        script += `  - Type: ${fieldConfig.type}\n`;
        script += `  - Description: ${fieldConfig.description}\n`;
        
        if (fieldConfig.options) {
          script += `  - Options: ${fieldConfig.options.join(', ')}\n`;
        }
        
        if (fieldConfig.linkedTable) {
          script += `  - Links to: ${fieldConfig.linkedTable}\n`;
        }
        
        if (fieldConfig.precision !== undefined) {
          script += `  - Precision: ${fieldConfig.precision}\n`;
        }
        
        script += '\n';
      }
      
      script += '\n---\n\n';
    }

    return script;
  }

  /**
   * Get current schema documentation
   */
  getSchemaDocumentation() {
    return {
      version: '1.0.0',
      description: 'ADK Restoration System Airtable Schema',
      lastUpdated: new Date().toISOString(),
      tables: Object.keys(this.requiredTables).length,
      totalFields: Object.values(this.requiredTables).reduce((total, config) => {
        const fields = config.requiredFields || config.additionalFields || {};
        return total + Object.keys(fields).length;
      }, 0),
      schema: this.requiredTables
    };
  }
}