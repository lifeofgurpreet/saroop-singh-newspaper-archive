#!/usr/bin/env python3
"""
FINAL Workflow Processor - Complete Pipeline
- Generates images with Gemini
- Uploads to public URLs
- Updates Airtable with viewable results
"""

import os
import sys
import json
import argparse
import uuid
from pathlib import Path
from datetime import datetime
import time
import requests
from io import BytesIO
from PIL import Image

sys.path.append(str(Path(__file__).parent))

from lib.gemini_image_processor import create_processor, ProcessingConfig
from lib.image_uploader import upload_image
from pyairtable import Api

class FinalWorkflowProcessor:
    """Final version with complete image pipeline"""
    
    def __init__(self):
        self.api_key = os.getenv("AIRTABLE_API_KEY", "your_airtable_api_key_here")
        self.base_id = "appQpjCUauAy7Ut1Y"
        self.api = Api(self.api_key)
        self.processor = create_processor()
        
        # Table references
        self.photo_gallery = self.api.table(self.base_id, "PhotoGallery")
        self.prompts = self.api.table(self.base_id, "Prompts")
        self.workflows = self.api.table(self.base_id, "Workflows")
        self.test_runs = self.api.table(self.base_id, "Test Runs")
        
        self.workflow_run_id = None
        self.results_summary = []
    
    def download_image(self, url):
        """Download and prepare image"""
        response = requests.get(url)
        img = Image.open(BytesIO(response.content))
        
        if img.mode == 'RGBA':
            background = Image.new('RGB', img.size, (255, 255, 255))
            background.paste(img, mask=img.split()[3])
            img = background
        elif img.mode != 'RGB':
            img = img.convert('RGB')
            
        return img
    
    def create_generation_prompt(self, step_number, title, category):
        """Create effective generation prompts based on step and category"""
        
        prompts = {
            1: {
                "Restoration": "Generate a professionally restored version of this vintage photograph. Remove all damage, dust, scratches, and fading. Enhance clarity and sharpness. Preserve the original people, composition, and vintage aesthetic. Output a clean, restored vintage photograph.",
                
                "Enhancement": "Generate an enhanced version of this photograph. Improve overall quality, sharpness, and clarity. Adjust contrast and brightness for optimal viewing. Keep all original elements intact.",
                
                "Creative Remake": "Create an artistic interpretation of this vintage photograph. Maintain the original composition and people but add creative elements and modern styling."
            },
            2: {
                "Restoration": "Based on the previous restoration, generate a colorized version. Add natural, historically accurate colors. Enhance skin tones, clothing colors, and background. Make it look like it was originally shot in color.",
                
                "Enhancement": "Generate a further enhanced version with improved lighting and detail. Add subtle color correction, enhance facial features, improve background clarity.",
                
                "Creative Remake": "Transform the previous version with dramatic artistic effects. Add cinematic lighting, enhanced colors, and professional photography aesthetics."
            },
            3: {
                "Restoration": "Generate the final museum-quality restoration. Apply professional color grading, maximize detail and sharpness. Create a pristine restoration that looks freshly photographed with period-appropriate equipment.",
                
                "Enhancement": "Generate the final ultra-high-quality version. Apply professional finishing touches, ensure perfect color balance, maximum sharpness, and gallery-ready presentation.",
                
                "Creative Remake": "Create the final artistic masterpiece. Apply cinematic color grading, dramatic lighting effects, and create a stunning modern interpretation while preserving the original subjects."
            }
        }
        
        # Get appropriate prompt
        category_key = category if category in prompts[1] else "Restoration"
        step_key = min(step_number, 3)
        
        return prompts[step_key][category_key]
    
    def process_generation_step(self, input_image_path, prompt_config, step_number):
        """Process a step with image generation"""
        
        # Create focused generation prompt
        generation_prompt = self.create_generation_prompt(
            step_number,
            prompt_config['title'],
            prompt_config['category']
        )
        
        print(f"   📝 Prompt: {generation_prompt[:80]}...")
        
        # Configure for generation
        config = ProcessingConfig(
            temperature=min(prompt_config['temperature'], 0.8),
            top_p=prompt_config['top_p'],
            model='generation'  # Use generation model
        )
        
        try:
            # Generate image
            output_path, metadata = self.processor.process_restoration(
                input_image_path,
                generation_prompt,
                config
            )
            
            if metadata['status'] == 'completed' and output_path:
                # Upload to public URL
                public_url = upload_image(output_path)
                metadata['public_url'] = public_url
                return output_path, public_url, metadata
            else:
                return None, None, metadata
                
        except Exception as e:
            return None, None, {
                'status': 'failed',
                'error': str(e),
                'processing_time': 0
            }
    
    def create_test_run(self, prompt_id, input_url, output_url, step_num, total_steps, metadata):
        """Create Test Run with proper image attachments"""
        
        run_id = f"step{step_num}_{uuid.uuid4().hex[:6]}_{datetime.now().strftime('%H%M%S')}"
        
        fields = {
            'Run ID': run_id,
            'Prompt': [prompt_id],
            'Test Date': datetime.now().isoformat(),
            'Model Used': 'gemini-2.5-flash-image-preview',
            'Success': metadata['status'] == 'completed',
            'Execution Time (s)': round(metadata.get('processing_time', 0), 2)
        }
        
        # Add input image if URL
        if input_url and input_url.startswith('http'):
            fields['Input Image'] = [{'url': input_url}]
        
        # Add output image if available
        if output_url and output_url.startswith('http'):
            fields['Output Image'] = [{'url': output_url}]
            fields['Notes'] = f"Step {step_num}/{total_steps} - SUCCESS\nGenerated image available at URL"
        else:
            fields['Notes'] = f"Step {step_num}/{total_steps} - {metadata.get('status', 'failed').upper()}\n{metadata.get('error', '')[:200]}"
        
        # Add workflow reference
        if self.workflow_run_id:
            fields['Notes'] += f"\nWorkflow: {self.workflow_run_id}"
        
        test_run = self.test_runs.create(fields)
        return test_run['id'], run_id
    
    def process_workflow(self, photo_record_id):
        """Complete workflow processing with image generation and upload"""
        
        # Get photo record
        photo_record = self.photo_gallery.get(photo_record_id)
        fields = photo_record['fields']
        
        print(f"\n{'='*60}")
        print(f"FINAL WORKFLOW PROCESSOR")
        print(f"Photo: {fields.get('Name', 'Untitled')}")
        print(f"ID: {photo_record_id}")
        print("="*60)
        
        # Check attachments
        attachments = fields.get('Attachments', [])
        if not attachments:
            print("❌ No attachments")
            return False
        
        # Get workflow or prompt
        workflow_ids = fields.get('Workflow', [])
        prompt_ids = fields.get('Selected Prompt', [])
        
        if workflow_ids:
            workflow_record = self.workflows.get(workflow_ids[0])
            workflow_name = workflow_record['fields'].get('Workflow Name', 'Unnamed')
            prompts_to_process = workflow_record['fields'].get('Prompts', [])
            self.workflow_run_id = f"wf_{uuid.uuid4().hex[:8]}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            print(f"🔄 Workflow: {workflow_name}")
            print(f"📊 Workflow Run: {self.workflow_run_id}")
        elif prompt_ids:
            prompts_to_process = prompt_ids
            workflow_name = "Single Prompt"
            print(f"📝 Single Prompt Processing")
        else:
            print("❌ No workflow or prompt selected")
            return False
        
        print(f"📌 Steps: {len(prompts_to_process)}")
        
        # Update status
        self.photo_gallery.update(photo_record_id, {
            'Status': 'Processing',
            'Processing Started': datetime.now().isoformat(),
            'Processing Job ID': self.workflow_run_id or f"job_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        })
        
        # Download original
        print("\n📥 Downloading original image...")
        original_url = attachments[0]['url']
        original_image = self.download_image(original_url)
        
        current_image_path = f"/tmp/{photo_record_id}_original.jpg"
        original_image.save(current_image_path)
        
        # Upload original for comparison
        original_public_url = upload_image(current_image_path)
        
        current_input_url = original_public_url
        self.results_summary = []
        success_count = 0
        fail_count = 0
        
        # Process each step
        for step_num, prompt_id in enumerate(prompts_to_process, 1):
            print(f"\n{'─'*40}")
            print(f"📌 Step {step_num}/{len(prompts_to_process)}")
            
            # Get prompt config
            prompt_record = self.prompts.get(prompt_id)
            prompt_fields = prompt_record['fields']
            
            model_config = {}
            if 'Model Config' in prompt_fields:
                try:
                    model_config = json.loads(prompt_fields['Model Config'])
                except:
                    pass
            
            prompt_config = {
                'title': prompt_fields.get('Title', 'Untitled'),
                'category': prompt_fields.get('Category', 'Photo Restoration'),
                'temperature': model_config.get('temperature', 0.7),
                'top_p': model_config.get('top_p', 0.95)
            }
            
            print(f"   Title: {prompt_config['title'][:50]}")
            print(f"   Category: {prompt_config['category']}")
            
            # Process with generation
            start_time = time.time()
            output_path, output_url, metadata = self.process_generation_step(
                current_image_path,
                prompt_config,
                step_num
            )
            execution_time = time.time() - start_time
            metadata['processing_time'] = execution_time
            
            # Create test run
            test_run_id, run_id = self.create_test_run(
                prompt_id,
                current_input_url,
                output_url,
                step_num,
                len(prompts_to_process),
                metadata
            )
            
            # Handle results
            if metadata['status'] == 'completed' and output_path:
                print(f"   ✅ Generated in {execution_time:.2f}s")
                print(f"   📸 Output: {output_path}")
                if output_url:
                    print(f"   🌐 Public URL: {output_url[:50]}...")
                
                # Use for next step
                current_image_path = output_path
                current_input_url = output_url
                
                # Store result
                self.results_summary.append({
                    'step': step_num,
                    'title': prompt_config['title'],
                    'local_path': output_path,
                    'public_url': output_url,
                    'test_run': run_id
                })
                
                success_count += 1
                
            else:
                print(f"   ❌ Failed: {metadata.get('error', 'Unknown')[:100]}")
                fail_count += 1
        
        # Update photo gallery with final results
        final_status = 'Complete' if fail_count == 0 else ('Failed' if success_count == 0 else 'Partial')
        
        update_fields = {
            'Status': final_status,
            'Processing Completed': datetime.now().isoformat()
        }
        
        # Set final result URL
        if self.results_summary:
            final_result = self.results_summary[-1]
            if final_result['public_url']:
                update_fields['Result URL'] = final_result['public_url']
            
            # Create comprehensive notes
            notes = f"Workflow: {workflow_name}\n"
            notes += f"Steps completed: {success_count}/{len(prompts_to_process)}\n\n"
            
            for result in self.results_summary:
                notes += f"Step {result['step']}: {result['title'][:30]}\n"
                if result['public_url']:
                    notes += f"  URL: {result['public_url']}\n"
            
            update_fields['Notes'] = notes[:2000]  # Airtable limit
        
        if fail_count > 0:
            update_fields['Error Message'] = f"{fail_count} steps failed"
        
        self.photo_gallery.update(photo_record_id, update_fields)
        
        # Print summary
        print(f"\n{'='*60}")
        print(f"WORKFLOW COMPLETE: {workflow_name}")
        print(f"  ✅ Successful: {success_count}")
        print(f"  ❌ Failed: {fail_count}")
        print(f"  📊 Status: {final_status}")
        
        if self.results_summary:
            print(f"\n📸 Generated Images:")
            for result in self.results_summary:
                print(f"  Step {result['step']}: {result['title'][:30]}")
                if result['public_url']:
                    print(f"    🌐 {result['public_url']}")
        
        print("="*60)
        
        return success_count > 0

def main():
    parser = argparse.ArgumentParser(description='Final workflow processor with complete pipeline')
    parser.add_argument('--photo-id', required=True, help='Photo ID to process')
    parser.add_argument('--dry-run', action='store_true', help='Test without processing')
    
    args = parser.parse_args()
    
    if args.dry_run:
        print("DRY RUN - Would process:", args.photo_id)
        return
    
    processor = FinalWorkflowProcessor()
    success = processor.process_workflow(args.photo_id)
    
    if not success:
        sys.exit(1)

if __name__ == "__main__":
    main()