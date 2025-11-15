"""
API endpoint for checking processing status of jobs.
Supports individual job status, batch status, and queue statistics.
"""

import json
import os
from datetime import datetime, timedelta
from http.server import BaseHTTPRequestHandler
import asyncio
import logging
from typing import Dict, List, Optional

from lib.queue_manager import QueueManager
from lib.airtable_client import AirtableClient

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class StatusHandler(BaseHTTPRequestHandler):
    def __init__(self):
        self.queue = QueueManager()
        self.airtable = AirtableClient()
    
    async def get_job_status(self, job_id: str) -> Dict:
        """Get status of a specific job."""
        try:
            job = await self.queue.get_job(job_id)
            
            if not job:
                return {
                    'error': 'Job not found',
                    'job_id': job_id
                }
            
            # Calculate processing time
            created_at = datetime.fromisoformat(job['created_at'])
            now = datetime.utcnow()
            processing_time = (now - created_at).total_seconds()
            
            status_info = {
                'job_id': job_id,
                'status': job['status'],
                'created_at': job['created_at'],
                'processing_time_seconds': processing_time,
                'image_url': job.get('image_url'),
                'restoration_type': job.get('restoration_type'),
                'priority': job.get('priority', 'normal')
            }
            
            # Add completion info if completed
            if job['status'] == 'completed' and 'result' in job:
                status_info.update({
                    'result_url': job['result'].get('result_url'),
                    'completed_at': job['result'].get('completed_at')
                })
            
            # Add error info if failed
            if job['status'] == 'failed' and 'result' in job:
                status_info['error'] = job['result'].get('error')
            
            # Add batch info if part of batch
            if 'batch_id' in job:
                batch_status = await self.get_batch_status(job['batch_id'])
                status_info['batch_info'] = batch_status
            
            return status_info
            
        except Exception as e:
            logger.error(f"Error getting job status: {str(e)}")
            return {'error': str(e)}
    
    async def get_batch_status(self, batch_id: str) -> Dict:
        """Get status of a batch processing job."""
        try:
            batch_jobs = await self.queue.get_batch_jobs(batch_id)
            
            if not batch_jobs:
                return {
                    'error': 'Batch not found',
                    'batch_id': batch_id
                }
            
            # Count jobs by status
            status_counts = {
                'queued': 0,
                'processing': 0,
                'completed': 0,
                'failed': 0
            }
            
            for job in batch_jobs:
                status = job.get('status', 'unknown')
                if status in status_counts:
                    status_counts[status] += 1
            
            total_jobs = len(batch_jobs)
            completed_jobs = status_counts['completed']
            failed_jobs = status_counts['failed']
            
            # Calculate progress
            progress_percentage = (completed_jobs / total_jobs) * 100 if total_jobs > 0 else 0
            
            # Determine overall batch status
            if failed_jobs == total_jobs:
                overall_status = 'failed'
            elif completed_jobs == total_jobs:
                overall_status = 'completed'
            elif status_counts['processing'] > 0 or status_counts['queued'] > 0:
                overall_status = 'processing'
            else:
                overall_status = 'unknown'
            
            # Calculate timing
            created_times = [datetime.fromisoformat(job['created_at']) for job in batch_jobs]
            earliest_created = min(created_times) if created_times else datetime.utcnow()
            processing_time = (datetime.utcnow() - earliest_created).total_seconds()
            
            return {
                'batch_id': batch_id,
                'overall_status': overall_status,
                'progress_percentage': round(progress_percentage, 2),
                'total_jobs': total_jobs,
                'status_breakdown': status_counts,
                'created_at': earliest_created.isoformat(),
                'processing_time_seconds': processing_time,
                'jobs': [
                    {
                        'job_id': job['job_id'],
                        'status': job['status'],
                        'image_url': job.get('image_url'),
                        'result_url': job.get('result', {}).get('result_url') if job.get('result') else None
                    }
                    for job in batch_jobs
                ]
            }
            
        except Exception as e:
            logger.error(f"Error getting batch status: {str(e)}")
            return {'error': str(e)}
    
    async def get_queue_statistics(self) -> Dict:
        """Get overall queue statistics."""
        try:
            stats = await self.queue.get_queue_stats()
            
            # Add timing information
            now = datetime.utcnow()
            stats['timestamp'] = now.isoformat()
            
            # Get recent activity (last 24 hours)
            yesterday = now - timedelta(days=1)
            recent_jobs = await self.queue.get_jobs_since(yesterday)
            
            recent_stats = {
                'last_24_hours': {
                    'total_jobs': len(recent_jobs),
                    'completed': len([j for j in recent_jobs if j.get('status') == 'completed']),
                    'failed': len([j for j in recent_jobs if j.get('status') == 'failed']),
                    'processing': len([j for j in recent_jobs if j.get('status') == 'processing'])
                }
            }
            
            stats.update(recent_stats)
            
            return stats
            
        except Exception as e:
            logger.error(f"Error getting queue statistics: {str(e)}")
            return {'error': str(e)}
    
    async def get_airtable_sync_status(self) -> Dict:
        """Get synchronization status with Airtable."""
        try:
            # Get recent records from Airtable
            recent_records = await self.airtable.get_recent_records('Restorations', limit=50)
            
            sync_stats = {
                'total_records': len(recent_records),
                'status_breakdown': {},
                'last_sync': datetime.utcnow().isoformat()
            }
            
            # Count by processing status
            for record in recent_records:
                status = record.get('fields', {}).get('Processing_Status', 'Unknown')
                sync_stats['status_breakdown'][status] = sync_stats['status_breakdown'].get(status, 0) + 1
            
            return sync_stats
            
        except Exception as e:
            logger.error(f"Error getting Airtable sync status: {str(e)}")
            return {'error': str(e)}

def handler(request):
    """Vercel serverless function handler."""
    status_handler = StatusHandler()
    
    if request.method == 'GET':
        try:
            # Parse query parameters
            query_params = getattr(request, 'args', {})
            job_id = query_params.get('job_id')
            batch_id = query_params.get('batch_id')
            stats_type = query_params.get('stats', 'queue')
            
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            # Handle different types of status requests
            if job_id:
                result = loop.run_until_complete(status_handler.get_job_status(job_id))
            elif batch_id:
                result = loop.run_until_complete(status_handler.get_batch_status(batch_id))
            elif stats_type == 'queue':
                result = loop.run_until_complete(status_handler.get_queue_statistics())
            elif stats_type == 'airtable':
                result = loop.run_until_complete(status_handler.get_airtable_sync_status())
            else:
                # Default: return queue statistics
                result = loop.run_until_complete(status_handler.get_queue_statistics())
            
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
            logger.error(f"Status request error: {str(e)}")
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': str(e)})
            }
    
    elif request.method == 'POST':
        # Handle bulk status requests
        try:
            data = json.loads(request.body.decode())
            job_ids = data.get('job_ids', [])
            
            if not job_ids:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'job_ids array required'})
                }
            
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            # Get status for all requested jobs
            results = []
            for job_id in job_ids:
                job_status = loop.run_until_complete(status_handler.get_job_status(job_id))
                results.append(job_status)
            
            loop.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'jobs': results,
                    'total': len(results)
                })
            }
            
        except Exception as e:
            logger.error(f"Bulk status request error: {str(e)}")
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': str(e)})
            }
    
    else:
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Method not allowed'})
        }