/**
 * Airtable Script: Update Processing Status
 * 
 * This script checks the status of restoration jobs and updates records accordingly.
 * It can be run from a Button field, scheduled automation, or manually.
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

// Main status update function
async function updateProcessingStatus() {
    try {
        output.text('🔍 Checking processing status for all jobs...');

        // Query for records with processing job IDs
        const queryResult = await table.selectRecordsAsync({
            fields: [
                'Title',
                'Status',
                'Processing Job ID',
                'Result URL',
                'Error Message',
                'Last Updated',
                'Processing Started',
                'Processing Completed'
            ]
        });

        // Filter records that need status updates
        const recordsToCheck = queryResult.records.filter(record => {
            const jobId = record.getCellValue('Processing Job ID');
            const status = record.getCellValue('Status');
            
            // Check records that have job IDs and are still processing
            return jobId && status && (
                status.name === 'Processing' || 
                status.name === 'Queued' ||
                status.name === 'Failed' // Also check failed jobs in case they've been retried
            );
        });

        if (recordsToCheck.length === 0) {
            output.text('✅ No records found with pending processing jobs.');
            return;
        }

        output.text(`📋 Found ${recordsToCheck.length} records to check`);

        let updatedCount = 0;
        let completedCount = 0;
        let stillProcessingCount = 0;
        let failedCount = 0;

        // Check status for each record
        for (const record of recordsToCheck) {
            try {
                const jobId = record.getCellValue('Processing Job ID');
                const result = await checkJobStatus(jobId);
                
                if (result.updated) {
                    await updateRecordStatus(record, result.status);
                    updatedCount++;
                    
                    switch (result.status.status) {
                        case 'completed':
                            completedCount++;
                            break;
                        case 'failed':
                            failedCount++;
                            break;
                        case 'processing':
                            stillProcessingCount++;
                            break;
                    }
                }
                
                // Small delay to avoid overwhelming the API
                await delay(500);
                
            } catch (error) {
                console.error(`Error checking status for record ${record.id}:`, error);
                
                // Update record with status check error
                await table.updateRecordAsync(record.id, {
                    'Error Message': `Status check failed: ${error.message}`,
                    'Last Updated': new Date()
                });
            }
        }

        // Final report
        output.text(`
📊 Status Update Complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 Records updated: ${updatedCount}
✅ Completed: ${completedCount}
🔄 Still processing: ${stillProcessingCount}
❌ Failed: ${failedCount}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${completedCount > 0 ? '🎉 New restorations completed! Check the Result URL field for processed images.' : ''}
${stillProcessingCount > 0 ? '⏳ Some jobs are still processing. Run this script again later to check progress.' : ''}
${failedCount > 0 ? '⚠️  Some jobs failed. Check the Error Message field for details.' : ''}
        `);

    } catch (error) {
        console.error('Status update error:', error);
        output.text(`❌ Status update failed: ${error.message}`);
    }
}

// Check job status via API
async function checkJobStatus(jobId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/status?job_id=${jobId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`Status API request failed: ${response.status} ${response.statusText}`);
        }

        const statusData = await response.json();
        
        // Determine if we need to update the record
        const needsUpdate = statusData.status !== 'processing' && statusData.status !== 'queued';
        
        return {
            updated: needsUpdate,
            status: statusData
        };

    } catch (error) {
        console.error(`Error checking status for job ${jobId}:`, error);
        throw error;
    }
}

// Update record with new status information
async function updateRecordStatus(record, statusData) {
    try {
        const updates = {
            'Last Updated': new Date()
        };

        // Update status field based on job status
        switch (statusData.status) {
            case 'completed':
                updates['Status'] = {name: 'Complete'};
                updates['Processing Completed'] = new Date();
                
                if (statusData.result_url) {
                    updates['Result URL'] = statusData.result_url;
                }
                
                // Clear any previous error messages
                updates['Error Message'] = '';
                
                output.text(`✅ Job completed: ${record.getCellValue('Title') || record.id}`);
                break;

            case 'failed':
                updates['Status'] = {name: 'Failed'};
                
                if (statusData.error) {
                    updates['Error Message'] = statusData.error;
                }
                
                output.text(`❌ Job failed: ${record.getCellValue('Title') || record.id}`);
                break;

            case 'processing':
                updates['Status'] = {name: 'Processing'};
                output.text(`🔄 Still processing: ${record.getCellValue('Title') || record.id}`);
                break;

            case 'queued':
                updates['Status'] = {name: 'Queued'};
                output.text(`⏳ Still queued: ${record.getCellValue('Title') || record.id}`);
                break;

            default:
                updates['Status'] = {name: 'Unknown'};
                updates['Error Message'] = `Unknown status: ${statusData.status}`;
                break;
        }

        // Add additional metadata if available
        if (statusData.progress) {
            updates['Processing Progress'] = `${statusData.progress}%`;
        }

        if (statusData.estimated_completion) {
            updates['Estimated Completion'] = new Date(statusData.estimated_completion);
        }

        // Update the record
        await table.updateRecordAsync(record.id, updates);

    } catch (error) {
        console.error(`Error updating record ${record.id}:`, error);
        throw error;
    }
}

// Helper function to delay execution
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Option to update specific record by job ID
async function updateSpecificJob() {
    const jobId = await input.textAsync('Enter Job ID to check:');
    
    if (!jobId) {
        output.text('❌ No Job ID provided');
        return;
    }

    try {
        output.text(`🔍 Checking status for Job ID: ${jobId}`);
        
        const result = await checkJobStatus(jobId);
        
        // Find the record with this job ID
        const queryResult = await table.selectRecordsAsync({
            fields: ['Processing Job ID', 'Title']
        });
        
        const record = queryResult.records.find(r => 
            r.getCellValue('Processing Job ID') === jobId
        );
        
        if (!record) {
            output.text(`❌ No record found with Job ID: ${jobId}`);
            return;
        }
        
        if (result.updated) {
            await updateRecordStatus(record, result.status);
            output.text(`✅ Status updated for record: ${record.getCellValue('Title') || record.id}`);
        } else {
            output.text(`ℹ️ Job is still processing: ${result.status.status}`);
        }
        
    } catch (error) {
        output.text(`❌ Error checking specific job: ${error.message}`);
    }
}

// Ask user which operation to perform
const operation = await input.buttonAsync(
    'Choose an operation:',
    [
        {label: '🔄 Update All Processing Jobs', value: 'all'},
        {label: '🎯 Check Specific Job ID', value: 'specific'}
    ]
);

if (operation === 'all') {
    await updateProcessingStatus();
} else if (operation === 'specific') {
    await updateSpecificJob();
}