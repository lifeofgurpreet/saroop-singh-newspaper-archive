#!/usr/bin/env python3
"""
Airtable-integrated image restoration system using Gemini Nano (Banana).
Fetches prompts and images from Airtable, processes them with Gemini,
and stores results back in Airtable with proper rate limiting.
"""

import os
import sys
import json
import time
import base64
import hashlib
import argparse
import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from io import BytesIO
import requests
from PIL import Image
import google.generativeai as genai

# Add project root to path
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# Airtable configuration
AIRTABLE_API_KEY = os.getenv("AIRTABLE_API_KEY", "your_airtable_api_key_here")
AIRTABLE_BASE_ID = "appQpjCUauAy7Ut1Y"

# Table IDs
PROMPTS_TABLE = "tblEKjaq3I9yfOg0d"
PHOTO_GALLERY_TABLE = "tbl4GR7nRThBJ9y5Z"
TEST_RUNS_TABLE = "tbli5AIwBu8a08yZv"
WORKFLOWS_TABLE = "tblJEswt7T25UopXC"

# Airtable API base URL
AIRTABLE_API_URL = f"https://api.airtable.com/v0/{AIRTABLE_BASE_ID}"

# Rate limiting configuration
AIRTABLE_RATE_LIMIT = 5  # requests per second
GEMINI_RATE_LIMIT = 2  # requests per second


@dataclass
class RateLimiter:
    """Simple rate limiter for API calls."""
    requests_per_second: float
    last_request_time: float = 0
    
    def wait_if_needed(self):
        """Wait if necessary to respect rate limit."""
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        min_interval = 1.0 / self.requests_per_second
        
        if time_since_last < min_interval:
            sleep_time = min_interval - time_since_last
            time.sleep(sleep_time)
        
        self.last_request_time = time.time()


@dataclass
class Prompt:
    """Prompt data from Airtable."""
    id: str
    name: str
    template: str
    use_case: str
    model_config: Dict[str, Any]
    workflow_type: str
    execution_priority: int
    tags: List[str]
    slug: str
    
    @classmethod
    def from_airtable(cls, record: Dict) -> 'Prompt':
        """Create Prompt from Airtable record."""
        fields = record.get('fields', {})
        
        # Parse model config JSON
        model_config = {}
        if config_str := fields.get('Model Config'):
            try:
                model_config = json.loads(config_str)
            except json.JSONDecodeError:
                model_config = {}
        
        return cls(
            id=record['id'],
            name=fields.get('Name', ''),
            template=fields.get('Prompt Template', fields.get('Prompt Content', '')),
            use_case=fields.get('Use Case', ''),
            model_config=model_config,
            workflow_type=fields.get('Workflow Type', 'Standalone'),
            execution_priority=fields.get('Execution Priority', 99),
            tags=fields.get('Tags', []),
            slug=fields.get('Slug', '')
        )


@dataclass
class PhotoRecord:
    """Photo data from Airtable."""
    id: str
    name: str
    attachments: List[Dict]
    notes: str
    
    @classmethod
    def from_airtable(cls, record: Dict) -> 'PhotoRecord':
        """Create PhotoRecord from Airtable record."""
        fields = record.get('fields', {})
        return cls(
            id=record['id'],
            name=fields.get('Name', ''),
            attachments=fields.get('Attachments', []),
            notes=fields.get('Notes', '')
        )
    
    def get_first_image_url(self) -> Optional[str]:
        """Get URL of first image attachment."""
        if self.attachments and len(self.attachments) > 0:
            return self.attachments[0].get('url')
        return None


class AirtableClient:
    """Client for Airtable API with rate limiting."""
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {AIRTABLE_API_KEY}',
            'Content-Type': 'application/json'
        })
        self.rate_limiter = RateLimiter(AIRTABLE_RATE_LIMIT)
    
    def get_records(self, table_id: str, filter_formula: str = None) -> List[Dict]:
        """Fetch all records from a table with optional filtering."""
        self.rate_limiter.wait_if_needed()
        
        url = f"{AIRTABLE_API_URL}/{table_id}"
        params = {}
        if filter_formula:
            params['filterByFormula'] = filter_formula
        
        all_records = []
        offset = None
        
        while True:
            if offset:
                params['offset'] = offset
            
            response = self.session.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            all_records.extend(data.get('records', []))
            
            offset = data.get('offset')
            if not offset:
                break
            
            self.rate_limiter.wait_if_needed()
        
        return all_records
    
    def get_record(self, table_id: str, record_id: str) -> Dict:
        """Fetch a single record."""
        self.rate_limiter.wait_if_needed()
        
        url = f"{AIRTABLE_API_URL}/{table_id}/{record_id}"
        response = self.session.get(url)
        response.raise_for_status()
        return response.json()
    
    def create_record(self, table_id: str, fields: Dict) -> Dict:
        """Create a new record."""
        self.rate_limiter.wait_if_needed()
        
        url = f"{AIRTABLE_API_URL}/{table_id}"
        data = {'fields': fields}
        
        response = self.session.post(url, json=data)
        response.raise_for_status()
        return response.json()
    
    def update_record(self, table_id: str, record_id: str, fields: Dict) -> Dict:
        """Update an existing record."""
        self.rate_limiter.wait_if_needed()
        
        url = f"{AIRTABLE_API_URL}/{table_id}/{record_id}"
        data = {'fields': fields}
        
        response = self.session.patch(url, json=data)
        response.raise_for_status()
        return response.json()


class GeminiProcessor:
    """Process images with Gemini using prompts from Airtable."""
    
    def __init__(self, api_key: str = None):
        """Initialize Gemini client."""
        if api_key:
            genai.configure(api_key=api_key)
        else:
            # Load from environment or .env file
            from tools.gemini import load_settings
            load_settings()
            genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
        
        self.rate_limiter = RateLimiter(GEMINI_RATE_LIMIT)
        # Using the latest Gemini model
        self.default_model = "gemini-2.0-flash-exp"
    
    def download_image(self, url: str) -> Image.Image:
        """Download image from URL."""
        response = requests.get(url)
        response.raise_for_status()
        return Image.open(BytesIO(response.content))
    
    def process_image(self, 
                     image_url: str,
                     prompt: Prompt,
                     variables: Dict[str, str] = None) -> Tuple[Any, float]:
        """Process an image with a prompt."""
        self.rate_limiter.wait_if_needed()
        
        start_time = time.time()
        
        # Download image
        image = self.download_image(image_url)
        
        # Prepare prompt text with variable substitution
        prompt_text = prompt.template
        if variables:
            for key, value in variables.items():
                prompt_text = prompt_text.replace(f"{{{{{key}}}}}", value)
        
        # Add image-only directive for restoration prompts
        if prompt.use_case in ['Color Restoration', 'Modern Remake', 'Creative Reimagining']:
            prompt_text = f"Return only an image; no text.\n\n{prompt_text}"
        
        # Get model from prompt config or use default
        model_name = prompt.model_config.get('model', self.default_model)
        model = genai.GenerativeModel(model_name)
        
        # Prepare generation config
        generation_config = {}
        if 'temperature' in prompt.model_config:
            generation_config['temperature'] = prompt.model_config['temperature']
        if 'top_p' in prompt.model_config:
            generation_config['top_p'] = prompt.model_config['top_p']
        
        # Generate content
        response = model.generate_content(
            [image, prompt_text],
            generation_config=generation_config
        )
        
        execution_time = time.time() - start_time
        
        return response, execution_time
    
    def extract_images(self, response) -> List[bytes]:
        """Extract generated images from response."""
        images = []
        
        if hasattr(response, 'candidates') and response.candidates:
            for candidate in response.candidates:
                if hasattr(candidate.content, 'parts'):
                    for part in candidate.content.parts:
                        if hasattr(part, 'inline_data') and part.inline_data:
                            if part.inline_data.mime_type.startswith('image/'):
                                images.append(base64.b64decode(part.inline_data.data))
        
        return images


class RestorationPipeline:
    """Main pipeline for processing restorations."""
    
    def __init__(self):
        self.airtable = AirtableClient()
        self.gemini = GeminiProcessor()
        self.output_dir = Path("generated/airtable_restorations")
        self.output_dir.mkdir(parents=True, exist_ok=True)
    
    def get_prompts(self, use_case: str = None, workflow_type: str = "Standalone") -> List[Prompt]:
        """Fetch prompts from Airtable."""
        filter_parts = [f"{{Status}} = 'Active'"]
        
        if use_case:
            filter_parts.append(f"{{Use Case}} = '{use_case}'")
        if workflow_type:
            filter_parts.append(f"{{Workflow Type}} = '{workflow_type}'")
        
        filter_formula = f"AND({', '.join(filter_parts)})" if filter_parts else None
        
        records = self.airtable.get_records(PROMPTS_TABLE, filter_formula)
        prompts = [Prompt.from_airtable(r) for r in records]
        
        # Sort by execution priority
        prompts.sort(key=lambda p: p.execution_priority)
        
        return prompts
    
    def get_photos(self, limit: int = None) -> List[PhotoRecord]:
        """Fetch photos from Airtable."""
        records = self.airtable.get_records(PHOTO_GALLERY_TABLE)
        photos = [PhotoRecord.from_airtable(r) for r in records]
        
        if limit:
            photos = photos[:limit]
        
        return photos
    
    def run_prompt_chain(self,
                        photo: PhotoRecord,
                        prompts: List[Prompt],
                        save_intermediate: bool = True) -> Dict:
        """Run a chain of prompts on a photo."""
        results = {
            'photo_id': photo.id,
            'photo_name': photo.name,
            'timestamp': datetime.datetime.now().isoformat(),
            'prompts_executed': [],
            'outputs': []
        }
        
        current_image_url = photo.get_first_image_url()
        if not current_image_url:
            raise ValueError(f"No image found for photo {photo.name}")
        
        for i, prompt in enumerate(prompts):
            print(f"  [{i+1}/{len(prompts)}] Executing: {prompt.name}")
            
            try:
                # Process with Gemini
                response, exec_time = self.gemini.process_image(
                    current_image_url,
                    prompt,
                    variables={'photo_name': photo.name}
                )
                
                # Extract generated images
                generated_images = self.gemini.extract_images(response)
                
                # Save outputs
                saved_paths = []
                for j, img_data in enumerate(generated_images):
                    filename = f"{photo.id}_{prompt.slug}_{j+1}.png"
                    filepath = self.output_dir / filename
                    filepath.write_bytes(img_data)
                    saved_paths.append(str(filepath))
                    
                    # Use first generated image for next prompt in chain
                    if j == 0 and i < len(prompts) - 1:
                        # For chaining, we'd need to upload to temporary storage
                        # For now, we'll use the saved file
                        current_image_url = f"file://{filepath}"
                
                # Record results
                prompt_result = {
                    'prompt_id': prompt.id,
                    'prompt_name': prompt.name,
                    'execution_time': exec_time,
                    'outputs': saved_paths,
                    'success': True
                }
                
                results['prompts_executed'].append(prompt_result)
                results['outputs'].extend(saved_paths)
                
                # Log to test runs table
                self.log_test_run(photo, prompt, exec_time, True)
                
            except Exception as e:
                print(f"    Error: {e}")
                prompt_result = {
                    'prompt_id': prompt.id,
                    'prompt_name': prompt.name,
                    'error': str(e),
                    'success': False
                }
                results['prompts_executed'].append(prompt_result)
                
                # Log failure
                self.log_test_run(photo, prompt, 0, False, str(e))
                
                # Stop chain on error
                if prompt.workflow_type == "Sequential":
                    break
        
        return results
    
    def log_test_run(self,
                    photo: PhotoRecord,
                    prompt: Prompt,
                    exec_time: float,
                    success: bool,
                    notes: str = None):
        """Log test run to Airtable."""
        run_id = f"{photo.id}_{prompt.slug}_{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        fields = {
            'Run ID': run_id,
            'Prompt': [prompt.id],
            'Test Date': datetime.datetime.now().isoformat(),
            'Model Used': prompt.model_config.get('model', self.gemini.default_model),
            'Execution Time (s)': round(exec_time, 2),
            'Success': success
        }
        
        if notes:
            fields['Notes'] = notes
        
        try:
            self.airtable.create_record(TEST_RUNS_TABLE, fields)
        except Exception as e:
            print(f"    Warning: Failed to log test run: {e}")
    
    def process_workflow(self, workflow_name: str, photo_limit: int = 1):
        """Process a complete workflow from Airtable."""
        # Get workflow definition
        workflows = self.airtable.get_records(
            WORKFLOWS_TABLE,
            f"{{Workflow Name}} = '{workflow_name}'"
        )
        
        if not workflows:
            raise ValueError(f"Workflow '{workflow_name}' not found")
        
        workflow = workflows[0]['fields']
        
        # Get linked prompt IDs
        prompt_ids = workflow.get('Steps', [])
        if not prompt_ids:
            print("No prompts linked to this workflow")
            return
        
        # Fetch prompts
        prompts = []
        for prompt_id in prompt_ids:
            record = self.airtable.get_record(PROMPTS_TABLE, prompt_id)
            prompts.append(Prompt.from_airtable(record))
        
        # Sort by execution priority
        prompts.sort(key=lambda p: p.execution_priority)
        
        # Get photos
        photos = self.get_photos(limit=photo_limit)
        
        print(f"Processing workflow: {workflow_name}")
        print(f"  Prompts: {len(prompts)}")
        print(f"  Photos: {len(photos)}")
        
        # Process each photo
        for photo in photos:
            print(f"\nProcessing: {photo.name}")
            results = self.run_prompt_chain(photo, prompts)
            
            # Save results
            results_file = self.output_dir / f"results_{photo.id}.json"
            results_file.write_text(json.dumps(results, indent=2))
            print(f"  Results saved: {results_file}")


def main():
    parser = argparse.ArgumentParser(description="Airtable-integrated restoration pipeline")
    parser.add_argument('--mode', choices=['standalone', 'sequential', 'workflow'],
                       default='standalone',
                       help='Processing mode')
    parser.add_argument('--use-case', 
                       choices=['Color Restoration', 'Modern Remake', 'Creative Reimagining', 
                               '3D Reconstruction', 'Damage Repair'],
                       help='Filter prompts by use case')
    parser.add_argument('--workflow', help='Name of workflow to execute')
    parser.add_argument('--photo-limit', type=int, default=1,
                       help='Maximum number of photos to process')
    parser.add_argument('--prompt-limit', type=int,
                       help='Maximum number of prompts to use')
    
    args = parser.parse_args()
    
    pipeline = RestorationPipeline()
    
    if args.mode == 'workflow' and args.workflow:
        pipeline.process_workflow(args.workflow, args.photo_limit)
    else:
        # Get prompts based on mode
        workflow_type = "Sequential" if args.mode == 'sequential' else "Standalone"
        prompts = pipeline.get_prompts(
            use_case=args.use_case,
            workflow_type=workflow_type
        )
        
        if args.prompt_limit:
            prompts = prompts[:args.prompt_limit]
        
        # Get photos
        photos = pipeline.get_photos(limit=args.photo_limit)
        
        print(f"Mode: {args.mode}")
        print(f"Prompts found: {len(prompts)}")
        print(f"Photos found: {len(photos)}")
        
        # Process each photo
        for photo in photos:
            print(f"\nProcessing: {photo.name}")
            results = pipeline.run_prompt_chain(photo, prompts)
            
            # Save results
            results_file = pipeline.output_dir / f"results_{photo.id}.json"
            results_file.write_text(json.dumps(results, indent=2))
            print(f"  Results saved: {results_file}")


if __name__ == "__main__":
    main()