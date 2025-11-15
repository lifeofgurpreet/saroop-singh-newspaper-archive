/**
 * Airtable Script: Trigger Photo Restoration
 * 
 * This script is designed to be run from a Button field in Airtable.
 * It triggers the photo restoration process by calling the Vercel API.
 * 
 * Setup Instructions:
 * 1. Create a Button field in your PhotoGallery table
 * 2. Set the button action to "Run script"
 * 3. Paste this script into the script editor
 * 4. Update the API_BASE_URL to match your deployed Vercel app
 */

// Configuration - Update this URL to match your deployed Vercel app
const API_BASE_URL = 'https://your-vercel-app.vercel.app';

// Get the current record context
let table = base.getTable('PhotoGallery');

// Main function to trigger restoration
async function triggerRestoration() {
    try {
        // Get the current record from button context
        let record = await input.recordAsync('Select a photo to restore', table);
        
        if (!record) {
            output.text('❌ No record selected');
            return;
        }

        // Get required fields
        const imageUrl = record.getCellValue('Image URL') || record.getCellValue('Photo');
        const recordId = record.id;
        
        if (!imageUrl) {
            output.text('❌ No image URL found in record');
            return;
        }

        // Update status to "Processing"
        await table.updateRecordAsync(recordId, {
            'Status': {name: 'Processing'},
            'Processing Started': new Date()
        });

        output.text('🔄 Starting restoration process...');

        // Prepare the API request payload
        const payload = {
            record_id: recordId,
            image_url: Array.isArray(imageUrl) ? imageUrl[0].url : imageUrl,
            restoration_type: record.getCellValue('Restoration Type') || 'standard',
            metadata: {
                title: record.getCellValue('Title') || '',
                description: record.getCellValue('Description') || '',
                date_taken: record.getCellValue('Date Taken') || '',
                source: 'airtable_button'
            }
        };

        // Call the Vercel API
        const response = await fetch(`${API_BASE_URL}/api/process`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        
        // Update record with job ID
        await table.updateRecordAsync(recordId, {
            'Processing Job ID': result.job_id,
            'Status': {name: 'Processing'},
            'Last API Response': JSON.stringify(result, null, 2)
        });

        output.text(`✅ Restoration started successfully!
Job ID: ${result.job_id}
Status: Processing

The restoration process has been queued. You can check the status using the "Check Status" button or wait for the webhook to update this record automatically.`);

    } catch (error) {
        console.error('Restoration trigger error:', error);
        
        // Update record with error status if we have a record
        if (record) {
            await table.updateRecordAsync(record.id, {
                'Status': {name: 'Failed'},
                'Error Message': error.message,
                'Last Updated': new Date()
            });
        }
        
        output.text(`❌ Error triggering restoration: ${error.message}`);
    }
}

// Execute the function
await triggerRestoration();