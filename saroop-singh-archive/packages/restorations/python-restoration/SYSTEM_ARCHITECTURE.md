# Photo Restoration System Architecture

## Complete End-to-End Implementation

> **Production Model**: Gemini 2.5 Flash (understanding + image generation)
> **Production Workflow**: `scripts/run_workflow.py`
> **Alternative System**: ADK multi-agent restoration in `/adk_restoration`

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     USER INTERFACES                          │
├──────────────┬──────────────┬────────────────┬──────────────┤
│  Web App     │  Airtable    │  Direct API    │  Webhooks    │
│  (Next.js)   │  Buttons     │  Calls         │  Automation  │
└──────┬───────┴──────┬───────┴────────┬───────┴──────┬───────┘
       │              │                 │              │
       ▼              ▼                 ▼              ▼
┌──────────────────────────────────────────────────────────────┐
│                    VERCEL API LAYER                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ /process    │  │ /webhook    │  │ /status     │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│                   PROCESSING LAYER                           │
│  ┌─────────────┐  ┌──────────────────┐  ┌─────────────┐    │
│  │ Queue       │  │ Gemini 2.5 Flash │  │ Storage     │    │
│  │ (Redis)     │  │ Understanding +  │  │ (S3/Cloud)  │    │
│  │             │  │ Image Generation │  │             │    │
│  └─────────────┘  └──────────────────┘  └─────────────┘    │
└──────────────────────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│                    DATA LAYER                                │
│  ┌─────────────────────────────────────────────────┐        │
│  │ Airtable CMS                                    │        │
│  │ - Prompts (Categorized & Optimized)             │        │
│  │ - PhotoGallery (Source Images)                  │        │
│  │ - Workflows (Test & Production)                 │        │
│  │ - Test Runs (Performance Metrics)               │        │
│  └─────────────────────────────────────────────────┘        │
└──────────────────────────────────────────────────────────────┘
```

## Components Built

### 1. Airtable CMS (Data Layer)
- **Prompts Table**: Properly categorized with 6 types
  - Restoration (damage repair)
  - Colorization (B&W to color)
  - Enhancement (quality improvement)
  - Creative Remake (artistic)
  - Cutout to Photo (clipping conversion)
  - Document Processing (text/OCR)
- **Workflows Table**: 5 test workflows for systematic evaluation
- **PhotoGallery Table**: Source images with processing buttons
- **Test Runs Table**: Performance tracking and metrics

### 2. Python API Service (Processing Layer)
```
packages/restorations/
├── api/
│   ├── process.py           # Main processing endpoint
│   ├── webhook.py           # Airtable webhook handler
│   ├── status.py            # Job status checking
│   └── restore.py           # Direct restoration endpoint
├── lib/
│   ├── airtable_client.py   # Airtable operations
│   ├── gemini_image_processor.py  # Gemini 2.5 Flash processing
│   ├── queue_manager.py     # Redis job queue
│   ├── storage.py           # Cloud storage
│   └── image_uploader.py    # Image upload utilities
├── scripts/
│   ├── run_workflow.py      # Production workflow processor
│   ├── run_restoration.py   # Direct restoration runner
│   └── [other scripts]      # Utility scripts
├── tests/
│   ├── test_system.py       # System tests
│   └── test_local.py        # Local tests
└── vercel.json             # Deployment config
```

### 3. Alternative: ADK Multi-Agent System
```
packages/restorations/adk_restoration/
├── src/
│   ├── agents/          # Individual restoration agents
│   ├── workflows/       # Multi-step workflows
│   ├── utils/          # Utilities and helpers
│   └── config/         # Configuration management
├── config/
│   ├── agents.json     # Agent configurations
│   └── workflows.json  # Workflow definitions
├── run_local.js        # Local execution script
└── test_complete_pipeline.js  # Integration tests
```

### 4. Web Interface (User Layer)
```
packages/restorations/web/
├── pages/               # Next.js pages
├── components/         # React components
└── lib/               # API client utilities
```

### 5. Airtable Integration
```
packages/restorations/airtable/
├── automations/        # Airtable automation scripts
└── scripts/           # Utility scripts
```

## AI Model Configuration

### Gemini 2.5 Flash Models
| Model | Purpose | Use Case |
|-------|---------|----------|
| **gemini-2.5-flash** | Image understanding & analysis | Damage assessment, restoration instructions |
| **gemini-2.5-flash-image-preview** | Image generation | Creating restored images ("Nano Banana") |
| **gemini-1.5-flash-8b** | Legacy fallback | Backup model for compatibility |

### Restoration Types & Optimal Settings
| Category | Temperature | Top-P | Model | Use When |
|----------|-------------|-------|-------|----------|
| **Restoration** | 0.5 | 0.9 | understanding | Photos have damage, artifacts |
| **Colorization** | 0.4 | 0.85 | understanding | B&W photos need realistic color |
| **Enhancement** | 0.6 | 0.95 | generation | Low resolution, quality improvement |
| **Creative Remake** | 0.7 | 0.95 | generation | Artistic reinterpretation |
| **Document Processing** | 0.2 | 0.8 | understanding | Text extraction, OCR |

## Deployment Instructions

### 1. Deploy Python API to Vercel
```bash
cd packages/restorations
./deploy.sh
# Configure environment variables in Vercel dashboard
```

### 2. Configure Airtable
1. Add button fields to PhotoGallery table
2. Copy scripts from `airtable/scripts/`
3. Set API URL in scripts to your Vercel deployment
4. Test with single photo first

### 3. Deploy Web Interface
```bash
cd packages/restorations/web
npm install
npm run build
vercel --prod
```

### 4. Set Environment Variables
```env
# Gemini AI
GEMINI_API_KEY=your-gemini-api-key
GOOGLE_API_KEY=your-gemini-api-key  # Alternative key name

# Airtable CMS
AIRTABLE_API_KEY=your-airtable-key
AIRTABLE_BASE_ID=appQpjCUauAy7Ut1Y

# Storage & Queue
REDIS_URL=your-redis-url
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret

# ADK System (if using alternative)
COMPOSIO_API_KEY=your-composio-key
```

## Production Usage

### 1. Using Production Workflow
```bash
# Process single photo with specific restoration type
python scripts/run_workflow.py --restoration-type colorization --photo-limit 1

# Process batch with workflow
python scripts/run_workflow.py --workflow "Complete Restoration" --photo-limit 10

# Via API endpoint
curl -X POST https://your-api.vercel.app/api/process \
  -H "Content-Type: application/json" \
  -d '{"image_url": "https://example.com/photo.jpg", "restoration_type": "colorization"}'
```

### 2. ADK Multi-Agent System
```bash
# Run ADK restoration workflow
cd packages/restorations/adk_restoration
node run_local.js --workflow complete-restoration --input photo.jpg

# Test complete pipeline
node test_complete_pipeline.js
```

### 3. Monitoring & Status
```bash
# Check processing status
curl -X GET https://your-api.vercel.app/api/status?job_id=abc123

# View queue statistics
curl -X GET https://your-api.vercel.app/api/status?stats=queue

# Process via webhook (Airtable automation)
# Webhook automatically triggers when record is updated
```

## Monitoring & Analytics

### Key Metrics Tracked
- **Success Rate**: % of successful restorations
- **Execution Time**: Average processing time
- **Quality Score**: SSIM, PSNR metrics
- **Category Performance**: Success by prompt type
- **Temperature Impact**: Quality vs temperature

### Airtable Views
1. **Performance Dashboard**: Group by workflow, show averages
2. **Failed Jobs**: Filter Status = "Failed", analyze errors
3. **Processing Queue**: Filter Status = "Processing"
4. **Best Results**: Filter Quality Score > 90%

## API Endpoints

### Process Image
```http
POST /api/process
{
  "image_url": "string",
  "restoration_type": "standard|colorization|enhancement|artistic",
  "metadata": {
    "description": "string",
    "date_taken": "string"
  }
}
```

### Check Status
```http
GET /api/status?job_id=abc123
{
  "job_id": "abc123",
  "status": "processing|complete|failed",
  "progress": 75,
  "result_url": "https://..."
}
```

### Webhook Handler
```http
POST /api/webhook
{
  "record_id": "recXYZ",
  "action": "process",
  "restoration_type": "colorization"
}
```

## Performance Optimizations

### Rate Limiting
- Airtable: 5 requests/second
- Gemini: 2 requests/second  
- Redis queue prevents overwhelming

### Caching Strategy
- Processed images cached for 30 days
- Prompt templates cached in memory
- API responses cached with CDN

### Scalability
- Serverless functions auto-scale
- Redis queue handles burst traffic
- CDN for static assets

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Rate limit errors | Reduce batch size, add delays |
| Poor quality results | Adjust temperature, try different category |
| Processing timeout | Reduce image size, simplify prompt |
| Webhook not firing | Check signature, verify URL |
| Queue backed up | Scale Redis, add workers |

## Next Steps

### Immediate
1. ✅ Test each workflow with sample photos
2. ✅ Optimize temperatures based on results
3. ✅ Set up monitoring dashboards

### Short-term
1. Add more restoration categories
2. Implement A/B testing framework
3. Build evaluation metrics

### Long-term
1. Train custom models
2. Add video restoration
3. Build mobile app

---

**System Status**: Production Ready
**Documentation Version**: 1.0.0
**Last Updated**: December 2024