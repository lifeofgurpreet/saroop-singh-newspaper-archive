"""
Main API endpoint for processing image restoration requests.
Handles both direct API calls and batch processing.
"""

import json
import os
from datetime import datetime
from typing import Dict, List, Optional
from http.server import BaseHTTPRequestHandler
import asyncio
import uuid
import logging

from lib.airtable_client import AirtableClient
from lib.gemini_processor import GeminiProcessor
from lib.queue_manager import QueueManager
from lib.storage import StorageManager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ProcessHandler(BaseHTTPRequestHandler):
    def __init__(self):
        self.airtable = AirtableClient()
        self.gemini = GeminiProcessor()
        self.queue = QueueManager()
        self.storage = StorageManager()
        
    async def process_single_image(self, image_data: Dict) -> Dict:
        """Process a single image restoration request."""
        try:
            job_id = str(uuid.uuid4())
            
            # Create job record
            job_record = {
                'job_id': job_id,
                'status': 'processing',
                'created_at': datetime.utcnow().isoformat(),
                'image_url': image_data.get('image_url'),
                'restoration_type': image_data.get('restoration_type', 'standard'),
                'metadata': image_data.get('metadata', {})
            }
            
            # Add to queue
            await self.queue.add_job(job_record)
            
            # Start processing
            result = await self._process_restoration(job_record)
            
            return {
                'success': True,
                'job_id': job_id,
                'result': result
            }
            
        except Exception as e:
            logger.error(f"Error processing image: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    async def process_batch(self, images: List[Dict]) -> Dict:
        """Process multiple images in batch."""
        try:
            batch_id = str(uuid.uuid4())
            job_ids = []
            
            for image_data in images:
                job_id = str(uuid.uuid4())
                job_ids.append(job_id)
                
                job_record = {
                    'job_id': job_id,
                    'batch_id': batch_id,
                    'status': 'queued',
                    'created_at': datetime.utcnow().isoformat(),
                    'image_url': image_data.get('image_url'),
                    'restoration_type': image_data.get('restoration_type', 'standard'),
                    'metadata': image_data.get('metadata', {})
                }
                
                await self.queue.add_job(job_record)
            
            # Start background processing
            asyncio.create_task(self._process_batch_background(batch_id, job_ids))
            
            return {
                'success': True,
                'batch_id': batch_id,
                'job_ids': job_ids,
                'message': f'Batch processing started for {len(images)} images'
            }
            
        except Exception as e:
            logger.error(f"Error starting batch processing: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    async def _process_restoration(self, job_record: Dict) -> Dict:
        """Core restoration processing logic."""
        try:
            job_id = job_record['job_id']
            image_url = job_record['image_url']
            restoration_type = job_record['restoration_type']
            
            # Update status
            await self.queue.update_job_status(job_id, 'processing')
            
            # Download image
            image_data = await self.storage.download_image(image_url)
            
            # Process with Gemini
            restored_image = await self.gemini.restore_image(
                image_data,
                restoration_type=restoration_type,
                metadata=job_record.get('metadata', {})
            )
            
            # Upload result
            result_url = await self.storage.upload_result(
                restored_image,
                job_id,
                f"restored_{job_id}.jpg"
            )
            
            # Update job with result
            result = {
                'status': 'completed',
                'result_url': result_url,
                'completed_at': datetime.utcnow().isoformat()
            }
            
            await self.queue.update_job_status(job_id, 'completed', result)
            
            # Update Airtable if record ID provided
            if 'airtable_record_id' in job_record:
                await self.airtable.update_restoration_status(
                    job_record['airtable_record_id'],
                    'completed',
                    result_url
                )
            
            return result
            
        except Exception as e:
            logger.error(f"Error in restoration processing: {str(e)}")
            await self.queue.update_job_status(job_id, 'failed', {'error': str(e)})
            raise
    
    async def _process_batch_background(self, batch_id: str, job_ids: List[str]):
        """Process batch jobs in background."""
        try:
            for job_id in job_ids:
                job_record = await self.queue.get_job(job_id)
                if job_record:
                    await self._process_restoration(job_record)
                    
        except Exception as e:
            logger.error(f"Error in batch processing: {str(e)}")

def handler(request):
    """Vercel serverless function handler."""
    processor = ProcessHandler()
    
    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode())
            
            # Single image processing
            if 'image_url' in data:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                result = loop.run_until_complete(processor.process_single_image(data))
                loop.close()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps(result)
                }
            
            # Batch processing
            elif 'images' in data:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                result = loop.run_until_complete(processor.process_batch(data['images']))
                loop.close()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps(result)
                }
            
            else:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Invalid request format'})
                }
                
        except Exception as e:
            logger.error(f"Request processing error: {str(e)}")
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': str(e)})
            }
    
    elif request.method == 'GET':
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'service': 'Image Restoration API',
                'version': '1.0.0',
                'status': 'healthy'
            })
        }
    
    else:
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Method not allowed'})
        }