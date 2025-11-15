/**
 * Airtable Script: Batch Process Photos
 * 
 * This script processes multiple photos in batch mode.
 * It can be run from a Button field or as a scheduled automation.
 * 
 * Setup Instructions:
 * 1. Create a Button field in your PhotoGallery table or dashboard
 * 2. Set the button action to "Run script"
 * 3. Paste this script into the script editor
 * 4. Update the API_BASE_URL to match your deployed Vercel app
 */

// Configuration - Update this URL to match your deployed Vercel app
const API_BASE_URL = 'https://your-vercel-app.vercel.app';

// Get the table
let table = base.getTable('PhotoGallery');

// Configuration options
const BATCH_SIZE = 5; // Process 5 records at a time
const MAX_CONCURRENT = 3; // Maximum concurrent API calls

// Main batch processing function
async function batchProcessPhotos() {
    try {
        output.text('🚀 Starting batch photo processing...');

        // Query for records that need processing
        const queryResult = await table.selectRecordsAsync({
            fields: [
                'Title',
                'Image URL', 
                'Photo',
                'Status',
                'Restoration Type',
                'Description',
                'Date Taken',
                'Processing Job ID',
                'Last Updated'
            ],
            sorts: [{field: 'Last Updated', direction: 'asc'}]
        });

        // Filter records that need processing
        const recordsToProcess = queryResult.records.filter(record => {
            const status = record.getCellValue('Status');
            const imageUrl = record.getCellValue('Image URL') || record.getCellValue('Photo');
            
            // Include records that are:
            // 1. Not processed yet (no status or status is "Pending")
            // 2. Have an image URL
            // 3. Don't already have a processing job ID
            return imageUrl && 
                   (!status || status.name === 'Pending' || status.name === 'Failed') &&
                   !record.getCellValue('Processing Job ID');
        });

        if (recordsToProcess.length === 0) {
            output.text('✅ No records found that need processing.');
            return;
        }

        output.text(`📋 Found ${recordsToProcess.length} records to process`);

        // Process records in batches
        let processedCount = 0;
        let successCount = 0;
        let failedCount = 0;

        for (let i = 0; i < recordsToProcess.length; i += BATCH_SIZE) {
            const batch = recordsToProcess.slice(i, i + BATCH_SIZE);
            output.text(`🔄 Processing batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} records)...`);

            // Process batch with concurrency control
            const batchResults = await processBatchWithConcurrency(batch, MAX_CONCURRENT);
            
            // Update statistics
            batchResults.forEach(result => {
                processedCount++;
                if (result.success) {
                    successCount++;
                } else {
                    failedCount++;
                }
            });

            // Brief pause between batches to avoid overwhelming the API
            if (i + BATCH_SIZE < recordsToProcess.length) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        // Final report
        output.text(`
📊 Batch Processing Complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Successfully processed: ${successCount}
❌ Failed: ${failedCount}  
📁 Total processed: ${processedCount}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${successCount > 0 ? 'Processing jobs have been queued. Check individual records for job IDs and status updates.' : ''}
${failedCount > 0 ? 'Check failed records for error messages and retry if needed.' : ''}
        `);

    } catch (error) {
        console.error('Batch processing error:', error);
        output.text(`❌ Batch processing failed: ${error.message}`);
    }
}

// Process a batch of records with concurrency control
async function processBatchWithConcurrency(records, maxConcurrent) {
    const results = [];
    
    // Create processing functions for each record
    const processingTasks = records.map(record => () => processRecord(record));
    
    // Process with concurrency control
    for (let i = 0; i < processingTasks.length; i += maxConcurrent) {
        const currentBatch = processingTasks.slice(i, i + maxConcurrent);
        const batchResults = await Promise.allSettled(
            currentBatch.map(task => task())
        );
        
        // Convert results
        batchResults.forEach(result => {
            if (result.status === 'fulfilled') {
                results.push(result.value);
            } else {
                results.push({
                    success: false,
                    error: result.reason?.message || 'Unknown error'
                });
            }
        });
    }
    
    return results;
}

// Process a single record
async function processRecord(record) {
    try {
        const recordId = record.id;
        const imageUrl = record.getCellValue('Image URL') || record.getCellValue('Photo');
        
        if (!imageUrl) {
            throw new Error('No image URL found');
        }

        // Mark as processing
        await table.updateRecordAsync(recordId, {
            'Status': {name: 'Processing'},
            'Processing Started': new Date()
        });

        // Prepare API payload
        const payload = {
            record_id: recordId,
            image_url: Array.isArray(imageUrl) ? imageUrl[0].url : imageUrl,
            restoration_type: record.getCellValue('Restoration Type') || 'standard',
            metadata: {
                title: record.getCellValue('Title') || '',
                description: record.getCellValue('Description') || '',
                date_taken: record.getCellValue('Date Taken') || '',
                source: 'airtable_batch'
            }
        };

        // Call API
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

        // Update record with success
        await table.updateRecordAsync(recordId, {
            'Processing Job ID': result.job_id,
            'Status': {name: 'Processing'},
            'Last Updated': new Date(),
            'Last API Response': JSON.stringify(result, null, 2)
        });

        return {
            success: true,
            recordId: recordId,
            jobId: result.job_id
        };

    } catch (error) {
        console.error(`Error processing record ${record.id}:`, error);
        
        // Update record with error
        try {
            await table.updateRecordAsync(record.id, {
                'Status': {name: 'Failed'},
                'Error Message': error.message,
                'Last Updated': new Date()
            });
        } catch (updateError) {
            console.error('Failed to update record with error:', updateError);
        }

        return {
            success: false,
            recordId: record.id,
            error: error.message
        };
    }
}

// Helper function to delay execution
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Execute the batch processing
await batchProcessPhotos();