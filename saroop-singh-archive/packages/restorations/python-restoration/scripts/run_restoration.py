#!/usr/bin/env python3
"""
Direct Image Restoration Runner
Run restorations directly from codebase without Airtable automations
"""

import os
import sys
import json
import argparse
from pathlib import Path
from datetime import datetime
import base64
import requests
from io import BytesIO
from PIL import Image

# Add lib to path
sys.path.append(str(Path(__file__).parent))

from lib.gemini_image_processor import create_processor, ProcessingConfig
from lib.airtable_client import AirtableClient
from pyairtable import Api

def get_airtable_client():
    """Initialize Airtable client"""
    api_key = os.getenv("AIRTABLE_API_KEY", "your_airtable_api_key_here")
    base_id = "appQpjCUauAy7Ut1Y"
    
    api = Api(api_key)
    return api, base_id

def fetch_records_to_process(api, base_id, limit=5):
    """Fetch records that need processing"""
    table = api.table(base_id, "PhotoGallery")
    
    # Get records without restored version or marked for reprocessing
    records = table.all(
        formula="OR({Status} = '', {Status} = 'Pending', {Status} = 'Ready')",
        max_records=limit
    )
    
    return records

def fetch_prompt(api, base_id, prompt_id):
    """Fetch prompt details"""
    if not prompt_id:
        return None, "Restoration"
        
    table = api.table(base_id, "Prompts")
    prompt_record = table.get(prompt_id[0])  # Get first linked prompt
    
    return (
        prompt_record['fields'].get('Prompt Text', ''),
        prompt_record['fields'].get('Category', 'Restoration')
    )

def download_image(url):
    """Download image from URL"""
    response = requests.get(url)
    return Image.open(BytesIO(response.content))

def process_single_record(api, base_id, record, processor):
    """Process a single record"""
    record_id = record['id']
    fields = record['fields']
    
    print(f"\n{'='*60}")
    print(f"Processing: {fields.get('Title', 'Untitled')} (ID: {record_id})")
    
    try:
        # Get attachments
        attachments = fields.get('Attachments', [])
        if not attachments:
            print("  ❌ No attachments found")
            return False
            
        # Download original image
        image_url = attachments[0]['url']
        print(f"  📥 Downloading image...")
        image = download_image(image_url)
        
        # Convert RGBA to RGB if needed
        if image.mode == 'RGBA':
            # Create a white background
            background = Image.new('RGB', image.size, (255, 255, 255))
            background.paste(image, mask=image.split()[3])  # Use alpha channel as mask
            image = background
        elif image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Save temp file
        temp_path = f"/tmp/{record_id}_original.jpg"
        image.save(temp_path)
        
        # Get prompt
        prompt_ids = fields.get('Selected Prompt', [])
        prompt_text, category = fetch_prompt(api, base_id, prompt_ids[0] if prompt_ids else None)
        
        if not prompt_text:
            prompt_text = "Restore and enhance this vintage photograph. Improve clarity, remove damage, and preserve historical authenticity."
        
        print(f"  📝 Category: {category}")
        print(f"  🤖 Processing with Gemini 2.5...")
        
        # Update status to Processing
        table = api.table(base_id, "PhotoGallery")
        table.update(record_id, {
            'Status': 'Processing',
            'Processing Started': datetime.now().isoformat()
        })
        
        # Process with Gemini
        config = ProcessingConfig.from_prompt_category(category)
        result_path, metadata = processor.process_restoration(
            temp_path,
            prompt_text,
            config
        )
        
        if metadata['status'] == 'completed':
            print(f"  ✅ Processing complete!")
            
            # Show analysis
            if 'analysis' in metadata:
                print(f"\n  📝 Analysis/Result:")
                analysis_lines = metadata['analysis'].split('\n')
                for line in analysis_lines[:10]:  # Show first 10 lines
                    if line.strip():
                        print(f"     {line[:100]}")
                if len(analysis_lines) > 10:
                    print(f"     ... ({len(analysis_lines) - 10} more lines)")
            
            # Update record
            table = api.table(base_id, "PhotoGallery")
            
            # Update record with actual fields
            update_data = {
                'Status': 'Complete',
                'Processing Completed': datetime.now().isoformat(),
                'Notes': metadata.get('analysis', '')[:1000] if metadata.get('analysis') else 'Processing completed'
            }
            
            # Add processing metadata if we have it
            if metadata.get('processing_time'):
                update_data['Notes'] += f"\n\nProcessing time: {metadata['processing_time']:.2f} seconds"
                update_data['Notes'] += f"\nModel: {metadata.get('model', 'gemini-2.5-flash')}"
            
            # If there's a result image (for generation models)
            if result_path:
                print(f"  💾 Generated image saved to: {result_path}")
                # Note: Can't upload images via API directly
                # Would need to upload to external service first
            else:
                print(f"  📊 Analysis completed (no image generation for {category})")
            
            table.update(record_id, update_data)
            print(f"  ✅ Record updated in Airtable")
            
            # Clean up temp files
            os.unlink(temp_path)
            
            return True
            
        else:
            print(f"  ❌ Processing failed: {metadata.get('error')}")
            
            # Update record with error
            table = api.table(base_id, "PhotoGallery")
            table.update(record_id, {
                'Status': 'Failed',
                'Processing Completed': datetime.now().isoformat(),
                'Error Message': f"Error: {metadata.get('error', 'Unknown error')}"
            })
            
            return False
            
    except Exception as e:
        print(f"  ❌ Error: {str(e)}")
        
        # Update record with error
        try:
            table = api.table(base_id, "PhotoGallery")
            table.update(record_id, {
                'Status': 'Failed',
                'Processing Completed': datetime.now().isoformat(),
                'Error Message': f"Error: {str(e)}"
            })
        except:
            pass
            
        return False

def main():
    """Main processing function"""
    parser = argparse.ArgumentParser(description='Process images from Airtable')
    parser.add_argument('--limit', type=int, default=3, help='Number of records to process')
    parser.add_argument('--record-id', help='Process specific record ID')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be processed without doing it')
    
    args = parser.parse_args()
    
    print("="*60)
    print("SAROOP SINGH ARCHIVE - IMAGE RESTORATION")
    print("Using Gemini 2.5 Flash Image (Nano Banana)")
    print("="*60)
    
    # Initialize
    api, base_id = get_airtable_client()
    processor = create_processor()
    
    if args.record_id:
        # Process specific record
        table = api.table(base_id, "PhotoGallery")
        record = table.get(args.record_id)
        records = [record]
    else:
        # Fetch records to process
        records = fetch_records_to_process(api, base_id, args.limit)
    
    if not records:
        print("\n✨ No records to process!")
        return
    
    print(f"\nFound {len(records)} record(s) to process")
    
    if args.dry_run:
        print("\n🔍 DRY RUN - Showing records that would be processed:")
        for record in records:
            fields = record['fields']
            print(f"  - {fields.get('Title', 'Untitled')} (ID: {record['id']})")
        return
    
    # Process each record
    successful = 0
    failed = 0
    
    for record in records:
        if process_single_record(api, base_id, record, processor):
            successful += 1
        else:
            failed += 1
    
    # Summary
    print("\n" + "="*60)
    print("PROCESSING COMPLETE")
    print(f"  ✅ Successful: {successful}")
    print(f"  ❌ Failed: {failed}")
    print("="*60)

if __name__ == "__main__":
    main()