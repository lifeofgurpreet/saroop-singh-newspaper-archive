# Saroop Singh Archive - Photo Restoration System

## Overview

The Saroop Singh Archive includes a sophisticated AI-powered photo restoration system that uses Google's Gemini AI to restore and enhance historical photographs. The system provides both batch processing capabilities and a web interface for real-time restoration.

## Architecture

### Components

1. **Gemini Restoration Package** (`packages/restorations/`)
   - Python-based restoration engine using Google Gemini AI
   - Batch processing scripts for multiple photos
   - REST API server for web integration
   - 6 different restoration styles with custom prompts

2. **Web Interface** (`packages/web/`)
   - Next.js-based web application
   - Photo upload and restoration interface
   - Gallery for viewing restored photos
   - Submission system for community contributions

3. **Shared Data** (`shared/data/`)
   - Centralized storage for articles and metadata
   - CMS integration for content management

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Python 3.9+
- Google Gemini API key

### 1. Configure Gemini API

Create `.env` file in `packages/restorations/`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash-002
GEMINI_GENERATION_CONFIG='{"temperature": 0.4, "top_p": 1, "top_k": 32, "max_output_tokens": 4096}'
```

### 2. Install Dependencies

#### Python Dependencies (Restoration Engine)
```bash
cd packages/restorations
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

#### Node.js Dependencies (Web App)
```bash
cd packages/web
npm install
```

### 3. Start the Services

#### Start Gemini API Server (Port 5001)
```bash
cd packages/restorations
./start-api.sh
# Or manually:
# source venv/bin/activate
# python api/server.py
```

#### Start Web Application (Port 3000)
```bash
cd packages/web
npm run dev
```

## Usage

### Web Interface

1. Navigate to http://localhost:3000
2. Click "Restore Photos" in the navigation
3. Upload a historical photograph
4. Click "Process Image" to generate 6 restoration variants
5. Compare results and download preferred versions
6. Optionally submit to public gallery

### Batch Processing

For processing multiple photos offline:

```bash
cd packages/restorations
python scripts/gemini_batch_restore.py
```

This will:
- Process all images in `raw-files/` directory
- Generate 6 restoration variants per image
- Save results to `generated/restorations/`
- Create metadata JSON files

### Populating the Gallery

To add Gemini-restored photos to the web gallery:

```bash
cd packages/web
node scripts/populate-gallery.js
```

This imports all restorations from `packages/restorations/generated/` into the web gallery.

## Restoration Styles

The system provides 6 different restoration approaches:

1. **Enhanced** - Basic restoration with dust/scratch removal
2. **Colorized** - Adds historically accurate colors 
3. **Repaired** - Fixes tears, fading, and missing sections
4. **Denoised** - Removes grain while preserving details
5. **Sharpened** - Enhances clarity and detail
6. **Artistic** - Creative restoration with enhanced contrast

## API Endpoints

### Gemini Restoration API (Python)

- `GET /health` - Health check
- `POST /restore` - Restore single image (multipart/form-data)
- `POST /restore/batch` - Batch restoration (JSON with base64 images)

### Web Application API

- `POST /api/restore` - Process image (uses Gemini if available, falls back to Sharp)
- `GET /api/gallery` - Fetch gallery items
- `POST /api/gallery/submit` - Submit restoration to gallery

## File Structure

```
saroop-singh-archive/
├── packages/
│   ├── restorations/          # Gemini restoration engine
│   │   ├── api/               # REST API server
│   │   ├── scripts/           # Batch processing scripts
│   │   ├── tools/             # Gemini client and utilities
│   │   ├── prompts/           # Restoration prompt templates
│   │   └── generated/         # Output directory
│   │
│   └── web/                   # Next.js web application
│       ├── src/
│       │   ├── app/
│       │   │   ├── restore/   # Restoration interface
│       │   │   ├── gallery/   # Gallery viewer
│       │   │   └── api/       # API routes
│       │   └── components/    # React components
│       └── public/
│           └── gallery-data/  # Gallery metadata
│
└── shared/
    └── data/                  # Shared content
        └── articles/          # Article markdown files
```

## Environment Variables

### Restoration Package
- `GEMINI_API_KEY` - Google Gemini API key (required)
- `GEMINI_MODEL` - Model name (default: gemini-1.5-flash-002)
- `PORT` - API server port (default: 5001)

### Web Application
- `GEMINI_API_URL` - Gemini API server URL (default: http://localhost:5001)
- `NEXT_PUBLIC_API_URL` - Public API URL for client-side requests

## Troubleshooting

### Gemini API Not Working
1. Check API key is valid
2. Ensure Python dependencies are installed
3. Verify API server is running on port 5001
4. Check console for error messages

### Gallery Not Showing Items
1. Run `node scripts/populate-gallery.js` to import restorations
2. Check `public/gallery-data/index.json` exists
3. Verify image files are in `public/gallery/` directory

### Restoration Fails
1. Check image format (JPEG, PNG supported)
2. Verify file size < 10MB
3. Ensure adequate memory available
4. Check Gemini API quota

## Development

### Adding New Restoration Styles

1. Add prompt file to `packages/restorations/prompts/`
2. Update `restoration_prompts` in `api/server.py`
3. Test with batch processing script

### Modifying Web Interface

1. Edit components in `packages/web/src/components/`
2. Update API routes in `packages/web/src/app/api/`
3. Test with `npm run dev`

## Production Deployment

### Gemini API Server
- Deploy as Python application (Heroku, Railway, etc.)
- Set environment variables
- Configure CORS for production domain

### Web Application
- Deploy to Vercel (recommended)
- Set `GEMINI_API_URL` to production API endpoint
- Configure environment variables in Vercel dashboard

## License

This restoration system is part of the Saroop Singh Archive project, preserving Malaysian athletics history through AI-enhanced photograph restoration.