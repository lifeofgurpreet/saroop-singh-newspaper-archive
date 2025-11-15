/**
 * Airtable Setup Helper Script
 * 
 * This script helps verify and partially automate the setup of your PhotoGallery table.
 * Run this script in Airtable to check if all required fields exist and get setup guidance.
 * 
 * Note: This script cannot create Button fields automatically (Airtable limitation),
 * but it will guide you through the manual setup process.
 */

// Get the PhotoGallery table
let table = base.getTable('PhotoGallery');

// Define required field configurations
const REQUIRED_FIELDS = {
    // Core fields
    'Status': {
        type: 'singleSelect',
        options: ['Pending', 'Queued', 'Processing', 'Complete', 'Failed'],
        colors: ['grayLight2', 'yellowLight2', 'orangeLight2', 'greenLight2', 'redLight2']
    },
    'Processing Job ID': {
        type: 'singleLineText',
        description: 'UUID for tracking restoration jobs'
    },
    'Result URL': {
        type: 'url',
        description: 'URL to the processed image'
    },
    'Error Message': {
        type: 'multilineText',
        description: 'Error details if processing fails'
    },
    'Processing Started': {
        type: 'dateTime',
        description: 'When processing began'
    },
    'Processing Completed': {
        type: 'dateTime',
        description: 'When processing finished'
    },
    'Last Updated': {
        type: 'dateTime',
        description: 'Last modification timestamp'
    },
    'Restoration Type': {
        type: 'singleSelect',
        options: ['standard', 'colorization', 'enhancement', 'artistic'],
        default: 'standard'
    }
};

// Button fields that need manual creation
const BUTTON_FIELDS = {
    'Process': {
        label: '🔄 Process Photo',
        script: 'trigger_restoration.js',
        description: 'Triggers individual photo restoration'
    },
    'Batch Process': {
        label: '🚀 Batch Process',
        script: 'batch_process.js', 
        description: 'Process multiple photos at once'
    },
    'Update Status': {
        label: '📊 Update Status',
        script: 'update_status.js',
        description: 'Check and update job statuses'
    }
};

async function setupHelper() {
    output.text(`
🔧 Airtable Setup Helper for Photo Restoration
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Checking your PhotoGallery table configuration...
    `);

    // Check existing fields
    const existingFields = table.fields;
    const existingFieldNames = existingFields.map(f => f.name);
    
    output.text('📋 Current Fields:');
    existingFieldNames.forEach(name => {
        output.text(`   ✓ ${name}`);
    });

    // Check for required fields
    output.text('\n🔍 Checking Required Fields:');
    
    const missingFields = [];
    const incorrectFields = [];
    
    for (const [fieldName, config] of Object.entries(REQUIRED_FIELDS)) {
        const existingField = existingFields.find(f => f.name === fieldName);
        
        if (!existingField) {
            missingFields.push({name: fieldName, config});
            output.text(`   ❌ Missing: ${fieldName} (${config.type})`);
        } else {
            // Check if type matches
            if (existingField.type !== config.type) {
                incorrectFields.push({
                    name: fieldName, 
                    current: existingField.type, 
                    expected: config.type
                });
                output.text(`   ⚠️  Wrong type: ${fieldName} (is ${existingField.type}, should be ${config.type})`);
            } else {
                output.text(`   ✅ Correct: ${fieldName}`);
            }
        }
    }

    // Check for button fields
    output.text('\n🔘 Checking Button Fields:');
    const buttonFieldsExist = [];
    
    for (const [fieldName, config] of Object.entries(BUTTON_FIELDS)) {
        const existingField = existingFields.find(f => f.name === fieldName);
        
        if (!existingField) {
            output.text(`   ❌ Missing: ${fieldName} button`);
        } else if (existingField.type === 'button') {
            buttonFieldsExist.push(fieldName);
            output.text(`   ✅ Found: ${fieldName} button`);
        } else {
            output.text(`   ⚠️  Wrong type: ${fieldName} (is ${existingField.type}, should be button)`);
        }
    }

    // Provide setup instructions
    if (missingFields.length > 0 || incorrectFields.length > 0) {
        output.text(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 SETUP INSTRUCTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        `);

        if (missingFields.length > 0) {
            output.text('🔧 Fields to Create:');
            
            for (const {name, config} of missingFields) {
                output.text(`\n   📄 Create field: "${name}"`);
                output.text(`      Type: ${config.type}`);
                
                if (config.options) {
                    output.text(`      Options: ${config.options.join(', ')}`);
                }
                if (config.description) {
                    output.text(`      Description: ${config.description}`);
                }
                if (config.default) {
                    output.text(`      Default: ${config.default}`);
                }
            }
        }

        if (incorrectFields.length > 0) {
            output.text('\n⚠️  Fields to Fix:');
            for (const {name, current, expected} of incorrectFields) {
                output.text(`   • Change "${name}" from ${current} to ${expected}`);
            }
        }
    }

    // Button field instructions
    output.text(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔘 BUTTON FIELD SETUP (Manual Steps Required)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);

    for (const [fieldName, config] of Object.entries(BUTTON_FIELDS)) {
        const exists = buttonFieldsExist.includes(fieldName);
        const status = exists ? '✅' : '❌';
        
        output.text(`${status} ${fieldName} Button:`);
        output.text(`   1. Add Button field named "${fieldName}"`);
        output.text(`   2. Set label to "${config.label}"`);
        output.text(`   3. Action: "Run script"`);
        output.text(`   4. Use script: ${config.script}`);
        output.text(`   5. Description: ${config.description}\n`);
    }

    // API Configuration reminder
    output.text(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 API CONFIGURATION REMINDER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Don't forget to update the API_BASE_URL in all three scripts:
• trigger_restoration.js
• batch_process.js  
• update_status.js

Set it to your deployed Vercel app URL:
const API_BASE_URL = 'https://your-vercel-app.vercel.app';
    `);

    // Summary
    const totalRequired = Object.keys(REQUIRED_FIELDS).length;
    const totalButtons = Object.keys(BUTTON_FIELDS).length;
    const correctFields = totalRequired - missingFields.length - incorrectFields.length;
    const correctButtons = buttonFieldsExist.length;

    output.text(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 SETUP SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Required Fields: ${correctFields}/${totalRequired} configured correctly
Button Fields: ${correctButtons}/${totalButtons} created
    `);

    if (correctFields === totalRequired && correctButtons === totalButtons) {
        output.text(`
🎉 SETUP COMPLETE!
Your PhotoGallery table is properly configured for photo restoration automation.

Next steps:
1. Update API_BASE_URL in all scripts
2. Deploy your Vercel API if not already done
3. Test with a single photo first
        `);
    } else {
        output.text(`
⚠️  SETUP INCOMPLETE
Please complete the missing field configurations above, then run this helper again to verify.
        `);
    }
}

// Test API configuration
async function testAPIConfiguration() {
    const apiUrl = await input.textAsync('Enter your Vercel API URL (e.g., https://your-app.vercel.app):');
    
    if (!apiUrl) {
        output.text('❌ No API URL provided');
        return;
    }

    try {
        output.text('🧪 Testing API connection...');
        
        const response = await fetch(`${apiUrl}/health`, {
            method: 'GET'
        });

        if (response.ok) {
            output.text('✅ API is accessible!');
            const data = await response.json();
            output.text(`Response: ${JSON.stringify(data, null, 2)}`);
        } else {
            output.text(`❌ API returned status: ${response.status} ${response.statusText}`);
        }
    } catch (error) {
        output.text(`❌ API test failed: ${error.message}`);
        output.text('Make sure your Vercel app is deployed and the URL is correct.');
    }
}

// Ask user what they want to do
const action = await input.buttonAsync(
    'What would you like to do?',
    [
        {label: '🔧 Check Table Setup', value: 'setup'},
        {label: '🧪 Test API Connection', value: 'test'},
        {label: '📚 Show Setup Guide', value: 'guide'}
    ]
);

if (action === 'setup') {
    await setupHelper();
} else if (action === 'test') {
    await testAPIConfiguration();
} else if (action === 'guide') {
    output.text(`
📚 QUICK SETUP GUIDE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. 🏗️  Database Setup:
   • Run "Check Table Setup" to see what's missing
   • Create any missing fields as indicated
   • Add the three button fields manually

2. 📝 Script Setup:
   • Copy scripts from the /airtable/scripts/ folder
   • Paste into respective button field script editors
   • Update API_BASE_URL in each script

3. 🚀 API Setup:
   • Deploy your Vercel app
   • Set environment variables
   • Test connection with "Test API Connection"

4. ✅ Testing:
   • Start with one photo using "Process Photo" button
   • Check status with "Update Status" button
   • Once working, try batch processing

5. 🔄 Automation:
   • Set up webhooks for real-time updates
   • Create automations for notifications
   • Configure scheduled status checks

For detailed instructions, see the README.md file.
    `);
}