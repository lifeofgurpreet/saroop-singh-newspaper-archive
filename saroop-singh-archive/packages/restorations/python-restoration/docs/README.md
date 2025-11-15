# Documentation Index - Photo Restoration System

## Current Documentation (Updated)

### Core Documentation
- **[API Reference](API_REFERENCE.md)** - Complete API endpoints with examples and authentication
- **[Airtable Setup](AIRTABLE_SETUP.md)** - CMS configuration, table structure, and integration guide

### Architecture & Implementation
- **[System Architecture](../SYSTEM_ARCHITECTURE.md)** - Complete system overview with current implementation details
- **[Main README](../README.md)** - Quick start guide and feature overview

## Legacy Documentation (Archived)

> **⚠️ These documents contain outdated information and are kept for reference only.**

### Legacy Files
- **[Airtable Integration](AIRTABLE_INTEGRATION.md)** - Legacy integration document (superseded by AIRTABLE_SETUP.md)
- **[Testing Strategy](TESTING_STRATEGY.md)** - Legacy testing approach (workflow references outdated)
- **[Engineering Test Plan](ENGINEERING_TEST_PLAN.md)** - Legacy test specifications

## Quick Navigation

### For Developers
1. Start with [System Architecture](../SYSTEM_ARCHITECTURE.md) for implementation overview
2. Review [API Reference](API_REFERENCE.md) for endpoint specifications
3. Configure [Airtable Setup](AIRTABLE_SETUP.md) for CMS integration

### For Users
1. Check [Main README](../README.md) for quick start instructions
2. Follow [Airtable Setup](AIRTABLE_SETUP.md) for CMS configuration
3. Use [API Reference](API_REFERENCE.md) for integration examples

### For Operations
1. Monitor using endpoints in [API Reference](API_REFERENCE.md)
2. Configure workflows via [Airtable Setup](AIRTABLE_SETUP.md)
3. Review architecture in [System Architecture](../SYSTEM_ARCHITECTURE.md)

## Current System Status

- **Production Workflow**: `process_workflow_final.py`
- **AI Model**: Gemini 2.5 Flash (understanding + image generation)
- **API Deployment**: Vercel serverless functions
- **CMS**: Airtable with webhooks and automation
- **Storage**: Cloudinary/S3 with CDN
- **Queue**: Redis for job management

## Implementation Options

### Primary: Python API (Recommended)
- Serverless Vercel deployment
- Complete Airtable integration
- Production-ready workflow processor
- Full API endpoint coverage

### Alternative: ADK Multi-Agent System
- Node.js-based agent orchestration
- Located in `/adk_restoration` directory  
- Composio ADK for multi-step workflows
- Complex restoration pipeline support

## Support & Maintenance

- **Architecture Questions**: See [System Architecture](../SYSTEM_ARCHITECTURE.md)
- **API Integration**: Check [API Reference](API_REFERENCE.md)
- **CMS Setup Issues**: Review [Airtable Setup](AIRTABLE_SETUP.md)
- **Legacy References**: Marked with ⚠️ DEPRECATED warnings

---

**Documentation Version**: 2.0.0  
**Last Updated**: September 2024  
**System Version**: Production Ready