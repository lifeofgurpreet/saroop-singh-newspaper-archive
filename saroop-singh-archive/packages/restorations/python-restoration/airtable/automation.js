/**
 * Airtable Automation Script for Image Restoration
 * 
 * This script runs inside Airtable automations when triggered by:
 * 1. Button click in PhotoGallery table
 * 2. Record update (when Selected Prompt changes)
 * 3. Webhook from external system
 * 
 * Setup:
 * 1. Go to Airtable Automations
 * 2. Create new automation with trigger "When button clicked"
 * 3. Add "Run script" action
 * 4. Paste this code
 * 5. Configure input variables:
 *    - recordId: The triggered record ID
 *    - buttonName: The button that was clicked
 */

// Input configuration (provided by Airtable automation)
const inputConfig = input.config({
    recordId: input.recordId,
    buttonName: input.buttonName || 'Process'
});

// API Configuration
const API_ENDPOINT = 'https://saroop-singh-restorations-7ptnstgba-lifeofgurpreets-projects.vercel.app/api/restore';
const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY'; // Set in Airtable automation secrets

// Table IDs
const PHOTO_GALLERY_TABLE = 'PhotoGallery';
const PROMPTS_TABLE = 'Prompts';
const TEST_RUNS_TABLE = 'Test Runs';

// Main processing function
async function processRestoration() {
    try {
        // Get the record
        const table = base.getTable(PHOTO_GALLERY_TABLE);
        const record = await table.selectRecordAsync(inputConfig.recordId);
        
        if (!record) {
            throw new Error('Record not found');
        }
        
        // Get image attachment
        const attachments = record.getCellValue('Attachments');
        if (!attachments || attachments.length === 0) {
            throw new Error('No image attached to record');
        }
        
        const imageUrl = attachments[0].url;
        
        // Get selected prompt
        const selectedPromptIds = record.getCellValue('Selected Prompt');
        let prompt = 'Restore and enhance this vintage photograph';
        let category = 'Restoration';
        
        if (selectedPromptIds && selectedPromptIds.length > 0) {
            const promptsTable = base.getTable(PROMPTS_TABLE);
            const promptRecord = await promptsTable.selectRecordAsync(selectedPromptIds[0].id);
            
            if (promptRecord) {
                prompt = promptRecord.getCellValue('Prompt Template') || prompt;
                category = promptRecord.getCellValue('Prompt Category') || category;
            }
        }
        
        // Update status to Processing
        await table.updateRecordAsync(inputConfig.recordId, {
            'Status': {name: 'Processing'},
            'Processing Started': new Date().toISOString(),
            'Processing Job ID': `job_${Date.now()}`
        });
        
        // Download image and convert to base64
        const imageResponse = await fetch(imageUrl);
        const imageBlob = await imageResponse.blob();
        const imageBase64 = await blobToBase64(imageBlob);
        
        // Call restoration API
        const apiResponse = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GEMINI_API_KEY}`
            },
            body: JSON.stringify({
                image: imageBase64,
                prompt: prompt,
                category: category,
                recordId: inputConfig.recordId
            })
        });
        
        const result = await apiResponse.json();
        
        if (result.success) {
            // Update record with success
            await table.updateRecordAsync(inputConfig.recordId, {
                'Status': {name: 'Complete'},
                'Processing Completed': new Date().toISOString(),
                'Result URL': result.resultUrl || ''
            });
            
            // Log to Test Runs table
            const testRunsTable = base.getTable(TEST_RUNS_TABLE);
            await testRunsTable.createRecordAsync({
                'Run ID': `run_${Date.now()}`,
                'Prompt': selectedPromptIds || [],
                'Test Date': new Date().toISOString(),
                'Input Image': attachments,
                'Output Image': result.resultUrl ? [{url: result.resultUrl}] : [],
                'Model Used': result.metadata?.model || 'gemini-2.5-flash-image-preview',
                'Execution Time (s)': result.metadata?.processing_time || 0,
                'Success': true,
                'Notes': `Processed via ${inputConfig.buttonName} button`
            });
            
            output.set('success', true);
            output.set('message', 'Image processed successfully');
            
        } else {
            // Update record with failure
            await table.updateRecordAsync(inputConfig.recordId, {
                'Status': {name: 'Failed'},
                'Error Message': result.error || 'Processing failed'
            });
            
            output.set('success', false);
            output.set('message', result.error || 'Processing failed');
        }
        
    } catch (error) {
        // Update record with error
        const table = base.getTable(PHOTO_GALLERY_TABLE);
        await table.updateRecordAsync(inputConfig.recordId, {
            'Status': {name: 'Failed'},
            'Error Message': error.message
        });
        
        output.set('success', false);
        output.set('message', error.message);
    }
}

// Helper function to convert blob to base64
async function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

// Execute the processing
await processRestoration();