/**
 * Airtable Manager - Handles all Airtable operations
 */

import Airtable from 'airtable';

export class AirtableManager {
  constructor() {
    this.base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
      .base(process.env.AIRTABLE_BASE_ID);
    
    // Table references with correct IDs
    this.tables = {
      photoGallery: this.base('tbl4GR7nRThBJ9y5Z'),
      prompts: this.base('tblEKjaq3I9yfOg0d'),
      workflows: this.base('tblJEswt7T25UopXC'),
      testRuns: this.base('tbli5AIwBu8a08yZv'),
      runs: this.base('tblQVPVpffCJGrHxe'),
      runSteps: this.base('tblHmf4l3diGiiPcq')
    };
  }
  
  async getPhotoRecord(recordId) {
    try {
      const record = await this.tables.photoGallery.find(recordId);
      return {
        id: record.id,
        fields: record.fields
      };
    } catch (error) {
      console.error(`Failed to get photo record: ${error.message}`);
      throw error;
    }
  }
  
  async getWorkflow(workflowId) {
    try {
      const record = await this.tables.workflows.find(workflowId);
      return {
        id: record.id,
        fields: record.fields,
        prompts: record.fields['Prompts'] || []
      };
    } catch (error) {
      console.error(`Failed to get workflow: ${error.message}`);
      throw error;
    }
  }
  
  async getPrompt(promptId) {
    try {
      const record = await this.tables.prompts.find(promptId);
      return {
        id: record.id,
        fields: record.fields
      };
    } catch (error) {
      console.error(`Failed to get prompt: ${error.message}`);
      throw error;
    }
  }
  
  async updatePhotoStatus(recordId, status, jobId = null, errorMessage = null) {
    // Ensure status matches the schema-defined values
    const validStatuses = ['Queued', 'Analyzing', 'Planning', 'Editing', 'Validating', 'Decided', 'Completed', 'Failed'];
    if (!validStatuses.includes(status)) {
      console.warn(`Invalid status value: ${status}. Using 'Queued' instead.`);
      status = 'Queued';
    }
    
    const fields = {
      'Status': status,
      'Processing Started': status === 'Analyzing' ? new Date().toISOString() : undefined,
      'Processing Completed': status === 'Completed' || status === 'Failed' ? new Date().toISOString() : undefined
    };
    
    if (jobId) {
      fields['Processing Job ID'] = jobId;
    }
    
    if (errorMessage) {
      fields['Error Message'] = errorMessage.substring(0, 500);
    }
    
    try {
      await this.tables.photoGallery.update(recordId, fields);
      console.log(`Updated photo status: ${recordId} -> ${status}`);
    } catch (error) {
      console.error(`Failed to update photo status: ${error.message}`);
    }
  }
  
  async updatePhotoResults(recordId, results) {
    // Validate status against schema
    const validStatuses = ['Queued', 'Analyzing', 'Planning', 'Editing', 'Validating', 'Decided', 'Completed', 'Failed'];
    let status = results.status || 'Completed';
    if (!validStatuses.includes(status)) {
      console.warn(`Invalid status value: ${status}. Using 'Completed' instead.`);
      status = 'Completed';
    }
    
    // Quality Score field is missing from PhotoGallery, so include it in Notes
    let notesContent = results.notes || '';
    if (results.qualityScore !== undefined) {
      notesContent = `Quality Score: ${results.qualityScore}/100\n${notesContent}`;
    }
    
    const fields = {
      'Status': status,
      'Result URL': results.resultUrl,
      'Notes': notesContent,
      'Processing Completed': new Date().toISOString()
    };
    
    try {
      await this.tables.photoGallery.update(recordId, fields);
      console.log(`Updated photo results: ${recordId}`);
    } catch (error) {
      console.error(`Failed to update photo results: ${error.message}`);
      throw error;
    }
  }
  
  async createTestRun(data) {
    const fields = {
      'Run ID': `run_${data.sessionId}_step${data.stepNumber}`,
      'Test Date': new Date().toISOString(),
      'Model Used': 'gemini-2.5-flash-image-preview',
      'Success': data.success,
      'Execution Time (s)': data.processingTime || 0,
      'Notes': data.notes || ''
    };
    
    if (data.action) {
      fields['Notes'] = `Action: ${data.action}\n${fields['Notes']}`;
    }
    
    if (data.temperature !== undefined) {
      fields['Notes'] += `\nTemperature: ${data.temperature}`;
    }
    
    if (data.qualityScore !== undefined) {
      fields['Quality Score'] = data.qualityScore / 100; // Convert to percentage for Airtable
      fields['Notes'] += `\nQuality Score: ${data.qualityScore}/100`;
    }
    
    // Add input image attachment if provided
    if (data.inputImageUrl) {
      fields['Input Image'] = [{
        url: data.inputImageUrl,
        filename: data.inputImageFilename || `input_${data.sessionId}_step${data.stepNumber}.jpg`
      }];
    }
    
    // Add output image attachment if provided
    if (data.outputImageUrl) {
      fields['Output Image'] = [{
        url: data.outputImageUrl,
        filename: data.outputImageFilename || `output_${data.sessionId}_step${data.stepNumber}.jpg`
      }];
    }
    
    try {
      const record = await this.tables.testRuns.create(fields);
      console.log(`✅ Created test run: ${fields['Run ID']}`);
      if (data.inputImageUrl) {
        console.log(`   📎 Input image: ${data.inputImageUrl}`);
      }
      if (data.outputImageUrl) {
        console.log(`   📎 Output image: ${data.outputImageUrl}`);
      }
      return record.id;
    } catch (error) {
      console.error(`❌ Failed to create test run: ${error.message}`);
      // Log the data for debugging
      console.error('Data attempted:', JSON.stringify(fields, null, 2));
      return null;
    }
  }
  
  async getRecentPhotos(status = null, limit = 10) {
    try {
      let filterFormula = '';
      if (status) {
        filterFormula = `{Status} = '${status}'`;
      }
      
      const records = await this.tables.photoGallery
        .select({
          maxRecords: limit,
          filterByFormula: filterFormula,
          // Remove sort since 'Created' field doesn't exist in PhotoGallery table
        })
        .firstPage();
      
      return records.map(record => ({
        id: record.id,
        fields: record.fields
      }));
    } catch (error) {
      console.error(`Failed to get recent photos: ${error.message}`);
      return [];
    }
  }
  
  async getPhotosByWorkflow(workflowId) {
    try {
      const records = await this.tables.photoGallery
        .select({
          filterByFormula: `FIND('${workflowId}', ARRAYJOIN({Workflow})) > 0`
        })
        .all();
      
      return records.map(record => ({
        id: record.id,
        fields: record.fields
      }));
    } catch (error) {
      console.error(`Failed to get photos by workflow: ${error.message}`);
      return [];
    }
  }
  
  async getTestRunsByPhoto(photoRecordId) {
    try {
      const records = await this.tables.testRuns
        .select({
          filterByFormula: `SEARCH('${photoRecordId}', {Notes}) > 0`,
          sort: [{ field: 'Test Date', direction: 'desc' }]
        })
        .all();
      
      return records.map(record => ({
        id: record.id,
        fields: record.fields
      }));
    } catch (error) {
      console.error(`Failed to get test runs: ${error.message}`);
      return [];
    }
  }
  
  async getAllWorkflows() {
    try {
      const records = await this.tables.workflows
        .select({
          // Remove sort since 'Created' field doesn't exist in Workflows table
        })
        .all();
      
      return records.map(record => ({
        id: record.id,
        name: record.fields['Workflow Name'],
        prompts: record.fields['Prompts'] || [],
        description: record.fields['Description']
      }));
    } catch (error) {
      console.error(`Failed to get workflows: ${error.message}`);
      return [];
    }
  }

  /**
   * Create a new Run record
   */
  async createRun(data) {
    // Validate status against schema
    const validStatuses = ['QUEUED', 'ANALYZING', 'PLANNING', 'EDITING', 'VALIDATING', 'DECIDED', 'COMPLETED', 'FAILED'];
    let status = data.status || 'QUEUED';
    if (!validStatuses.includes(status)) {
      console.warn(`Invalid run status value: ${status}. Using 'QUEUED' instead.`);
      status = 'QUEUED';
    }

    // Validate mode against schema
    const validModes = ['RESTORE', 'ENHANCE', 'REIMAGINE'];
    let mode = data.mode || 'RESTORE';
    if (!validModes.includes(mode)) {
      console.warn(`Invalid mode value: ${mode}. Using 'RESTORE' instead.`);
      mode = 'RESTORE';
    }

    const fields = {
      'Run ID': data.runId || `run_${Date.now()}`,
      'Session ID': data.sessionId,
      'Status': status,
      'Mode': mode,
      'Started At': data.startedAt || new Date().toISOString(),
      'Total Steps': data.totalSteps || 0,
      'Steps Completed': data.stepsCompleted || 0,
      'Retry Attempt': data.retryAttempt || 0
    };

    // Link to photo if provided
    if (data.photoRecordId) {
      fields['Photo'] = [data.photoRecordId];
    }

    // Add quality score if available
    if (data.qualityScore !== undefined) {
      fields['Quality Score'] = data.qualityScore;
    }

    // Add QC decision if available (validate against schema)
    if (data.qcDecision) {
      const validQcDecisions = ['APPROVE', 'APPROVE_WITH_NOTES', 'RETRY', 'MANUAL_REVIEW', 'REJECT'];
      if (validQcDecisions.includes(data.qcDecision)) {
        fields['QC Decision'] = data.qcDecision;
      } else {
        console.warn(`Invalid QC Decision: ${data.qcDecision}. Skipping field.`);
      }
    }

    // Add configuration as JSON
    if (data.configuration) {
      fields['Configuration'] = typeof data.configuration === 'string' 
        ? data.configuration 
        : JSON.stringify(data.configuration, null, 2);
    }

    // Add completion data if provided
    if (data.completedAt) {
      fields['Completed At'] = data.completedAt;
    }

    if (data.duration !== undefined) {
      fields['Duration (s)'] = data.duration;
    }

    if (data.errorDetails) {
      fields['Error Details'] = data.errorDetails;
    }

    try {
      const record = await this.tables.runs.create(fields);
      console.log(`✅ Created run: ${fields['Run ID']}`);
      return record.id;
    } catch (error) {
      console.error(`❌ Failed to create run: ${error.message}`);
      console.error('Data attempted:', JSON.stringify(fields, null, 2));
      return null;
    }
  }

  /**
   * Update a Run record
   */
  async updateRun(recordId, updates) {
    const fields = {};

    if (updates.status) fields['Status'] = updates.status;
    if (updates.stepsCompleted !== undefined) fields['Steps Completed'] = updates.stepsCompleted;
    if (updates.qualityScore !== undefined) fields['Quality Score'] = updates.qualityScore;
    if (updates.qcDecision) fields['QC Decision'] = updates.qcDecision;
    if (updates.completedAt) fields['Completed At'] = updates.completedAt;
    if (updates.duration !== undefined) fields['Duration (s)'] = updates.duration;
    if (updates.errorDetails) fields['Error Details'] = updates.errorDetails;

    try {
      await this.tables.runs.update(recordId, fields);
      console.log(`✅ Updated run: ${recordId}`);
    } catch (error) {
      console.error(`❌ Failed to update run: ${error.message}`);
    }
  }

  /**
   * Create a new RunStep record
   */
  async createRunStep(data) {
    // Validate step status against schema
    const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'SKIPPED'];
    let status = data.status || 'PENDING';
    if (!validStatuses.includes(status)) {
      console.warn(`Invalid step status value: ${status}. Using 'PENDING' instead.`);
      status = 'PENDING';
    }

    const fields = {
      'Step ID': data.stepId || `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      'Step Number': data.stepNumber || 1,
      'Step Name': data.stepName || 'Unknown Step',
      'Status': status,
      'Started At': data.startedAt || new Date().toISOString(),
      'Success': data.success || false
    };

    // Link to run if provided
    if (data.runRecordId) {
      fields['Run'] = [data.runRecordId];
    }

    // Add processing details
    if (data.completedAt) fields['Completed At'] = data.completedAt;
    if (data.duration !== undefined) fields['Duration (s)'] = data.duration;
    if (data.promptUsed) fields['Prompt Used'] = data.promptUsed;
    if (data.temperature !== undefined) fields['Temperature'] = data.temperature;
    if (data.modelUsed) fields['Model Used'] = data.modelUsed;
    if (data.tokenUsage !== undefined) fields['Token Usage'] = data.tokenUsage;
    if (data.qualityScore !== undefined) fields['Quality Score'] = data.qualityScore;
    if (data.retryCount !== undefined) fields['Retry Count'] = data.retryCount;
    if (data.errorMessage) fields['Error Message'] = data.errorMessage;
    if (data.inputSize !== undefined) fields['Input Size (bytes)'] = data.inputSize;
    if (data.outputSize !== undefined) fields['Output Size (bytes)'] = data.outputSize;

    // Add metadata as JSON
    if (data.metadata) {
      fields['Metadata'] = typeof data.metadata === 'string' 
        ? data.metadata 
        : JSON.stringify(data.metadata, null, 2);
    }

    try {
      const record = await this.tables.runSteps.create(fields);
      console.log(`✅ Created run step: ${fields['Step ID']} - ${fields['Step Name']}`);
      return record.id;
    } catch (error) {
      console.error(`❌ Failed to create run step: ${error.message}`);
      console.error('Data attempted:', JSON.stringify(fields, null, 2));
      return null;
    }
  }

  /**
   * Update a RunStep record
   */
  async updateRunStep(recordId, updates) {
    const fields = {};

    if (updates.status) fields['Status'] = updates.status;
    if (updates.success !== undefined) fields['Success'] = updates.success;
    if (updates.completedAt) fields['Completed At'] = updates.completedAt;
    if (updates.duration !== undefined) fields['Duration (s)'] = updates.duration;
    if (updates.qualityScore !== undefined) fields['Quality Score'] = updates.qualityScore;
    if (updates.errorMessage) fields['Error Message'] = updates.errorMessage;
    if (updates.tokenUsage !== undefined) fields['Token Usage'] = updates.tokenUsage;

    try {
      await this.tables.runSteps.update(recordId, fields);
      console.log(`✅ Updated run step: ${recordId}`);
    } catch (error) {
      console.error(`❌ Failed to update run step: ${error.message}`);
    }
  }

  /**
   * Enhanced createTestRun that integrates with the new Run system
   */
  async createTestRunWithImages(data) {
    const fields = {
      'Run ID': data.runId || `run_${data.sessionId}_step${data.stepNumber}`,
      'Test Date': new Date().toISOString(),
      'Model Used': data.modelUsed || 'gemini-2.5-flash-image-preview',
      'Success': data.success || false,
      'Execution Time (s)': data.processingTime || 0,
      'Notes': data.notes || ''
    };
    
    if (data.action) {
      fields['Notes'] = `Action: ${data.action}\n${fields['Notes']}`;
    }
    
    if (data.temperature !== undefined) {
      fields['Notes'] += `\nTemperature: ${data.temperature}`;
    }
    
    if (data.qualityScore !== undefined) {
      fields['Quality Score'] = data.qualityScore / 100; // Convert to percentage for Airtable
      fields['Notes'] += `\nQuality Score: ${data.qualityScore}/100`;
    }

    // Link to Run record if provided
    if (data.runRecordId) {
      fields['Run'] = [data.runRecordId];
    }

    // Link to RunStep if provided
    if (data.runStepRecordId) {
      fields['Step'] = [data.runStepRecordId];
    }
    
    // Add input image attachment from URL (will be uploaded to Airtable)
    if (data.inputImageUrl) {
      fields['Input Image'] = [{
        url: data.inputImageUrl,
        filename: data.inputImageFilename || `input_${data.sessionId}_step${data.stepNumber}.jpg`
      }];
    }
    
    // Add output image attachment from URL (will be uploaded to Airtable)
    if (data.outputImageUrl) {
      fields['Output Image'] = [{
        url: data.outputImageUrl,
        filename: data.outputImageFilename || `output_${data.sessionId}_step${data.stepNumber}.jpg`
      }];
    }
    
    try {
      const record = await this.tables.testRuns.create(fields);
      console.log(`✅ Created test run with images: ${fields['Run ID']}`);
      if (data.inputImageUrl) {
        console.log(`   📎 Input image: ${data.inputImageUrl}`);
      }
      if (data.outputImageUrl) {
        console.log(`   📎 Output image: ${data.outputImageUrl}`);
      }
      return record.id;
    } catch (error) {
      console.error(`❌ Failed to create test run with images: ${error.message}`);
      console.error('Data attempted:', JSON.stringify(fields, null, 2));
      return null;
    }
  }
}