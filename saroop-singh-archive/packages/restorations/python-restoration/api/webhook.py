"""
Webhook endpoint for Airtable automation triggers.
Handles automated processing when records are created or updated.
"""

import json
import os
import hashlib
import hmac
from datetime import datetime
from http.server import BaseHTTPRequestHandler
import asyncio
import logging

from lib.airtable_client import AirtableClient
from lib.gemini_processor import GeminiProcessor
from lib.queue_manager import QueueManager
from lib.storage import StorageManager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class WebhookHandler(BaseHTTPRequestHandler):
    def __init__(self):
        self.airtable = AirtableClient()
        self.gemini = GeminiProcessor()
        self.queue = QueueManager()
        self.storage = StorageManager()
        self.webhook_secret = os.getenv('AIRTABLE_WEBHOOK_SECRET')
    
    def verify_webhook_signature(self, request_body: bytes, signature: str) -> bool:
        """Verify webhook signature for security."""
        if not self.webhook_secret:
            logger.warning("No webhook secret configured")
            return True  # Allow in development
            
        expected_signature = hmac.new(
            self.webhook_secret.encode(),
            request_body,
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(signature, expected_signature)
    
    async def handle_record_created(self, payload: dict) -> dict:
        """Handle new record creation from Airtable."""
        try:
            record_id = payload.get('record_id')
            table_name = payload.get('table_name')
            
            logger.info(f"Processing new record: {record_id} from table: {table_name}")
            
            # Get record details from Airtable
            record_data = await self.airtable.get_record(table_name, record_id)
            
            if not record_data:
                return {'error': 'Record not found'}
            
            # Extract image information
            image_attachments = record_data.get('fields', {}).get('Original_Image', [])
            
            if not image_attachments:
                return {'error': 'No images found in record'}
            
            # Process each image attachment
            results = []
            for attachment in image_attachments:
                job_result = await self._process_attachment(
                    attachment,
                    record_id,
                    record_data
                )
                results.append(job_result)
            
            # Update record status
            await self.airtable.update_record(table_name, record_id, {
                'Processing_Status': 'Processing Started',
                'Last_Updated': datetime.utcnow().isoformat()
            })
            
            return {
                'success': True,
                'record_id': record_id,
                'jobs_created': len(results),
                'results': results
            }
            
        except Exception as e:
            logger.error(f"Error handling record creation: {str(e)}")
            return {'error': str(e)}
    
    async def handle_record_updated(self, payload: dict) -> dict:
        """Handle record updates from Airtable."""
        try:
            record_id = payload.get('record_id')
            table_name = payload.get('table_name')
            changed_fields = payload.get('changed_fields', [])
            
            logger.info(f"Processing record update: {record_id}, changed fields: {changed_fields}")
            
            # Check if restoration-related fields changed
            restoration_fields = ['Restoration_Type', 'Processing_Priority', 'Reprocess_Request']
            
            if any(field in changed_fields for field in restoration_fields):
                # Get updated record data
                record_data = await self.airtable.get_record(table_name, record_id)
                
                # Check if reprocessing is requested
                if record_data.get('fields', {}).get('Reprocess_Request'):
                    return await self._reprocess_record(record_id, record_data)
            
            return {'message': 'No action required'}
            
        except Exception as e:
            logger.error(f"Error handling record update: {str(e)}")
            return {'error': str(e)}
    
    async def _process_attachment(self, attachment: dict, record_id: str, record_data: dict) -> dict:
        """Process a single image attachment."""
        try:
            job_id = f"{record_id}_{attachment['id']}"
            
            job_record = {
                'job_id': job_id,
                'airtable_record_id': record_id,
                'status': 'queued',
                'created_at': datetime.utcnow().isoformat(),
                'image_url': attachment['url'],
                'filename': attachment['filename'],
                'restoration_type': record_data.get('fields', {}).get('Restoration_Type', 'standard'),
                'priority': record_data.get('fields', {}).get('Processing_Priority', 'normal'),
                'metadata': {
                    'original_filename': attachment['filename'],
                    'file_size': attachment.get('size', 0),
                    'mime_type': attachment.get('type', ''),
                    'airtable_attachment_id': attachment['id']
                }
            }
            
            # Add to processing queue
            await self.queue.add_job(job_record)
            
            # Start processing if high priority
            if job_record['priority'] == 'high':
                asyncio.create_task(self._process_job_immediate(job_record))
            
            return {
                'job_id': job_id,
                'status': 'queued',
                'priority': job_record['priority']
            }
            
        except Exception as e:
            logger.error(f"Error processing attachment: {str(e)}")
            return {'error': str(e)}
    
    async def _reprocess_record(self, record_id: str, record_data: dict) -> dict:
        """Reprocess an existing record."""
        try:
            # Cancel existing jobs for this record
            await self.queue.cancel_jobs_for_record(record_id)
            
            # Process images again
            image_attachments = record_data.get('fields', {}).get('Original_Image', [])
            results = []
            
            for attachment in image_attachments:
                job_result = await self._process_attachment(
                    attachment,
                    record_id,
                    record_data
                )
                results.append(job_result)
            
            # Update record to clear reprocess flag
            await self.airtable.update_record('Restorations', record_id, {
                'Reprocess_Request': False,
                'Processing_Status': 'Reprocessing Started',
                'Last_Updated': datetime.utcnow().isoformat()
            })
            
            return {
                'success': True,
                'message': 'Reprocessing started',
                'jobs_created': len(results)
            }
            
        except Exception as e:
            logger.error(f"Error reprocessing record: {str(e)}")
            return {'error': str(e)}
    
    async def _process_job_immediate(self, job_record: dict):
        """Process high-priority job immediately."""
        try:
            from api.process import ProcessHandler
            processor = ProcessHandler()
            await processor._process_restoration(job_record)
            
        except Exception as e:
            logger.error(f"Error in immediate processing: {str(e)}")

def handler(request):
    """Vercel serverless function handler."""
    webhook_handler = WebhookHandler()
    
    if request.method == 'POST':
        try:
            # Verify webhook signature
            signature = request.headers.get('X-Airtable-Signature', '')
            request_body = request.body
            
            if not webhook_handler.verify_webhook_signature(request_body, signature):
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Invalid signature'})
                }
            
            # Parse payload
            payload = json.loads(request_body.decode())
            
            # Determine webhook type
            webhook_type = payload.get('type', '')
            
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            if webhook_type == 'record_created':
                result = loop.run_until_complete(
                    webhook_handler.handle_record_created(payload)
                )
            elif webhook_type == 'record_updated':
                result = loop.run_until_complete(
                    webhook_handler.handle_record_updated(payload)
                )
            else:
                result = {'error': f'Unknown webhook type: {webhook_type}'}
            
            loop.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps(result)
            }
            
        except Exception as e:
            logger.error(f"Webhook processing error: {str(e)}")
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': str(e)})
            }
    
    elif request.method == 'GET':
        # Health check endpoint
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'service': 'Airtable Webhook Handler',
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