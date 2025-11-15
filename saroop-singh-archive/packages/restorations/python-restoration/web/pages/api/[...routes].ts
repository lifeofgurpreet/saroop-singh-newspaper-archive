import { NextApiRequest, NextApiResponse } from 'next';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { ServerResponse } from 'http';

// Configuration for the API proxy
const API_URL = process.env.API_URL || 'http://localhost:3000';

// Create proxy middleware
const proxy = createProxyMiddleware({
  target: API_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api', // Keep the /api prefix
  },
  onError: (err, req, res) => {
    console.error('Proxy Error:', err);
    if (res instanceof ServerResponse) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Proxy Error',
        message: err.message,
      }));
    }
  },
  onProxyReq: (proxyReq, req: any, res) => {
    console.log(`Proxying ${req.method} ${req.url} -> ${API_URL}${req.url}`);
  },
  onProxyRes: (proxyRes, req: any, res) => {
    console.log(`Response ${proxyRes.statusCode} from ${req.url}`);
  },
});

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Remove the /api prefix from the route for internal processing
  const route = req.query.routes as string[];
  const apiPath = route.join('/');
  
  console.log(`API Proxy: ${req.method} /api/${apiPath}`);
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
    res.status(200).end();
    return;
  }
  
  // Set CORS headers for all requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Check if the backend is available
  try {
    // Use the proxy middleware
    (proxy as any)(req, res);
  } catch (error) {
    console.error('API Proxy Error:', error);
    
    // Fallback response when backend is not available
    if (req.url?.includes('/workflows/templates')) {
      // Return mock workflow templates
      res.status(200).json([
        {
          id: '1',
          name: 'Photo Restoration',
          description: 'Basic photo restoration for scratches, tears, and fading',
          category: 'restoration',
          parameters: {
            scratchRepair: true,
            colorCorrection: true,
            noiseReduction: true,
          },
          estimatedTime: 300,
          complexity: 'moderate',
          tags: ['restoration', 'repair', 'vintage'],
        },
        {
          id: '2',
          name: 'Colorization',
          description: 'Add realistic colors to black and white photos',
          category: 'enhancement',
          parameters: {
            skinToneDetection: true,
            naturalColors: true,
            preserveOriginal: true,
          },
          estimatedTime: 600,
          complexity: 'complex',
          tags: ['colorization', 'enhancement', 'artistic'],
        },
        {
          id: '3',
          name: 'Super Resolution',
          description: 'Enhance image resolution and clarity',
          category: 'enhancement',
          parameters: {
            upscaleFactor: 4,
            sharpening: true,
            detailEnhancement: true,
          },
          estimatedTime: 180,
          complexity: 'simple',
          tags: ['upscaling', 'resolution', 'clarity'],
        },
        {
          id: '4',
          name: 'Damage Repair',
          description: 'Repair severe damage including tears, stains, and missing parts',
          category: 'restoration',
          parameters: {
            tearRepair: true,
            stainRemoval: true,
            contentInpainting: true,
          },
          estimatedTime: 900,
          complexity: 'complex',
          tags: ['repair', 'damage', 'reconstruction'],
        }
      ]);
      return;
    }
    
    if (req.url?.includes('/processing/jobs') && req.method === 'GET') {
      // Return empty jobs array
      res.status(200).json([]);
      return;
    }
    
    if (req.url?.includes('/processing/upload') && req.method === 'POST') {
      // Return mock upload response
      res.status(200).json({
        jobId: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        uploadUrl: '/mock/upload',
        message: 'Upload successful (mock)'
      });
      return;
    }
    
    if (req.url?.includes('/processing/batch') && req.method === 'POST') {
      // Return mock batch upload response
      const fileCount = req.body?.images?.length || 3;
      const responses = Array.from({ length: fileCount }, (_, i) => ({
        jobId: `job_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`,
        uploadUrl: `/mock/upload/${i}`,
        message: 'Batch upload successful (mock)'
      }));
      
      res.status(200).json(responses);
      return;
    }
    
    if (req.url?.includes('/health')) {
      res.status(200).json({
        status: 'ok (mock)',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    // Default error response
    res.status(503).json({
      error: 'Service Unavailable',
      message: 'Backend API is not available. Using fallback responses.',
      timestamp: new Date().toISOString(),
    });
  }
}

// Disable body parsing for file uploads
export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};