"""
Vercel API endpoint for image restoration using Gemini 2.5 Flash Image
"""

import json
import os
import base64
from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs
import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from lib.gemini_image_processor import create_processor, ProcessingConfig

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        """Handle restoration request"""
        try:
            # Read request body
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data)
            
            # Extract parameters
            image_data = data.get('image')
            prompt = data.get('prompt', 'Restore and enhance this vintage photograph')
            category = data.get('category', 'Restoration')
            
            if not image_data:
                self.send_error(400, 'No image provided')
                return
            
            # Decode base64 image
            if ',' in image_data:
                image_data = image_data.split(',')[1]
            
            # Save temporary image
            import tempfile
            import base64
            from PIL import Image
            import io
            
            image_bytes = base64.b64decode(image_data)
            image = Image.open(io.BytesIO(image_bytes))
            
            with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp:
                image.save(tmp.name)
                temp_path = tmp.name
            
            # Process image
            processor = create_processor()
            config = ProcessingConfig.from_prompt_category(category)
            
            result_image, metadata = processor.process_restoration(
                temp_path,
                prompt,
                config
            )
            
            # Clean up temp file
            os.unlink(temp_path)
            
            if result_image and metadata['status'] == 'completed':
                # Convert result to base64
                buffer = io.BytesIO()
                result_image.save(buffer, format='PNG')
                result_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
                
                # Send response
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                response = {
                    'success': True,
                    'image': f'data:image/png;base64,{result_base64}',
                    'metadata': {
                        'model': metadata.get('model'),
                        'processing_time': metadata.get('processing_time'),
                        'category': category
                    }
                }
                
                self.wfile.write(json.dumps(response).encode())
            else:
                # Send error response
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                response = {
                    'success': False,
                    'error': metadata.get('error', 'Processing failed')
                }
                
                self.wfile.write(json.dumps(response).encode())
                
        except Exception as e:
            self.send_error(500, str(e))