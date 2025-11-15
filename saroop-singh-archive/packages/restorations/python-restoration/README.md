# Saroop Singh Archive - Image Restoration API

A production-ready API service for automated vintage photograph restoration using Google's Gemini 2.5 Flash, deployed on Vercel with Airtable integration and Redis job queuing.

## Features

- **AI-Powered Restoration**: Uses Google Gemini 2.5 Flash for intelligent photo restoration and image generation
- **Multiple Restoration Types**: Standard, colorization, enhancement, and artistic restoration
- **Scalable Architecture**: Async processing with Redis job queues
- **Airtable Integration**: Automated workflow triggers via webhooks
- **Multiple Storage Backends**: Cloudinary, AWS S3, or local filesystem
- **Real-time Status Tracking**: Monitor job progress and batch processing
- **Error Handling & Retries**: Robust error handling with automatic retries
- **Rate Limiting**: Respects API limits for all external services
- **Security**: Webhook signature verification and secure file handling

## Quick Start

1. **Deploy to Vercel**: `vercel --prod`
2. **Configure Environment**: Copy `.env.example` to `.env` and fill in API keys
3. **Set up Airtable**: Create webhooks pointing to your deployed endpoints
4. **Start Processing**: Use `process_workflow_final.py` for production workflows or `/api/process` endpoint

## API Endpoints

### POST /api/process
Process single image or batch restoration.

### POST /api/webhook  
Airtable webhook endpoint for automated processing.

### GET /api/status
Check job status and queue statistics.

### POST /api/restore
Direct restoration endpoint with image upload.

## Production Workflows

The main production workflow is handled by `process_workflow_final.py`, which provides:
- Complete image pipeline from download to upload
- Airtable integration with status tracking
- Support for multiple restoration types
- Error handling and retry logic

## Environment Setup

Essential configuration in `.env`:

```bash
# Gemini AI (Primary processing model)
GEMINI_API_KEY=your_gemini_api_key

# Airtable CMS
AIRTABLE_BASE_ID=appQpjCUauAy7Ut1Y
AIRTABLE_API_KEY=your_airtable_key

# Redis Job Queue
REDIS_URL=your_redis_url

# Image Storage (Cloudinary or S3)
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

See `.env.example` for complete configuration options.

## Architecture

The service uses a serverless architecture with:
- Vercel for API hosting
- Redis for job queue management  
- Gemini 2.5 Flash for image processing (understanding + generation)
- Airtable for CMS and workflow automation
- Cloudinary/S3 for image storage

## Implementation Options

### Python API (Primary)
Production-ready Vercel API with serverless functions:
- Located in `/api` and `/lib` directories
- Uses `scripts/run_workflow.py` for complete workflows (production script)
- Integrated with Airtable CMS for prompt management
- Test suite in `/tests` directory

### ADK Multi-Agent System (Alternative)
Node.js-based multi-agent restoration system:
- Located in `/adk_restoration` directory
- Uses Composio ADK for agent orchestration
- Supports complex multi-step restoration workflows

## Quick Start Example

```javascript
// Process an image using the API
const response = await fetch('/api/process', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    image_url: 'https://example.com/photo.jpg',
    restoration_type: 'colorization'
  })
});
```

## Documentation

### 📚 Core Documentation
- **[API Reference](docs/API_REFERENCE.md)** - Complete API endpoints, examples, authentication
- **[System Architecture](SYSTEM_ARCHITECTURE.md)** - System overview and implementation details
- **[Airtable Setup](docs/AIRTABLE_SETUP.md)** - CMS configuration and integration guide

### 🗂️ Legacy Documentation (Historical Reference)
- **[Testing Strategy](docs/TESTING_STRATEGY.md)** - ⚠️ Deprecated - see API Reference for current testing
- **[Engineering Test Plan](docs/ENGINEERING_TEST_PLAN.md)** - ⚠️ Deprecated - outdated approach

For complete deployment guides and advanced usage, see the full documentation sections below.

---

# Complete Documentation

## Restoration Types

1. **Standard** - Basic damage repair and quality improvement
2. **Colorization** - Add realistic colors to black & white photos
3. **Enhancement** - Advanced quality improvement with professional retouching
4. **Artistic** - Creative restoration with enhanced dramatic effects

## Deployment

### Vercel Deployment
```bash
npm i -g vercel
vercel --prod
```

### Environment Variables
Configure in Vercel dashboard or `.env`:
- API keys for Gemini, Airtable, Redis, Cloudinary
- Feature flags and performance settings
- Security and monitoring configuration

### Airtable Setup
Create automation with webhook trigger pointing to your API endpoints.

## Development

```bash
pip install -r requirements.txt
cp .env.example .env
vercel dev
```

## Monitoring

- Queue statistics via `/api/status?stats=queue`
- Error tracking with Sentry integration
- Automatic cleanup of old jobs
- Real-time processing status

This service provides a complete solution for automated vintage photo restoration with enterprise-grade reliability and scalability.