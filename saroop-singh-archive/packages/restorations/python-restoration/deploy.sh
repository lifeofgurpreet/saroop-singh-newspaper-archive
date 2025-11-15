#!/bin/bash

# =============================================================================
# Saroop Singh Archive - Image Restoration API Deployment Script
# =============================================================================

set -e  # Exit on error

echo "🚀 Starting deployment of Image Restoration API..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if required environment variables are set
echo "🔍 Checking environment configuration..."

REQUIRED_VARS=(
    "GEMINI_API_KEY"
    "AIRTABLE_BASE_ID" 
    "AIRTABLE_API_KEY"
    "REDIS_URL"
)

MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [[ -z "${!var}" ]]; then
        MISSING_VARS+=($var)
    fi
done

if [[ ${#MISSING_VARS[@]} -gt 0 ]]; then
    echo "❌ Missing required environment variables:"
    printf '   - %s\n' "${MISSING_VARS[@]}"
    echo ""
    echo "Please set these variables in your .env file or Vercel dashboard."
    exit 1
fi

echo "✅ Environment configuration looks good!"

# Validate Python dependencies
echo "📦 Validating Python dependencies..."

if [[ -f "requirements.txt" ]]; then
    echo "✅ requirements.txt found"
else
    echo "❌ requirements.txt not found"
    exit 1
fi

# Check if this is the first deployment
if [[ ! -f ".vercel/project.json" ]]; then
    echo "🆕 First time deployment detected"
    echo "🔧 Configuring Vercel project..."
    
    # Interactive setup for first deployment
    vercel --confirm
else
    echo "🔄 Deploying to existing Vercel project..."
fi

# Deploy to production
echo "🚀 Deploying to production..."
vercel --prod

# Get deployment URL
DEPLOYMENT_URL=$(vercel --prod --confirm 2>/dev/null | grep -o 'https://[^[:space:]]*')

if [[ -n "$DEPLOYMENT_URL" ]]; then
    echo ""
    echo "✅ Deployment successful!"
    echo "🌍 Production URL: $DEPLOYMENT_URL"
    echo ""
    echo "📋 Next steps:"
    echo "1. Configure Airtable webhooks to point to: $DEPLOYMENT_URL/api/webhook"
    echo "2. Test the API endpoints:"
    echo "   - Health check: $DEPLOYMENT_URL/api/process"
    echo "   - Status endpoint: $DEPLOYMENT_URL/api/status"
    echo "3. Monitor logs in Vercel dashboard"
    echo ""
    echo "🔗 Useful links:"
    echo "   - Vercel Dashboard: https://vercel.com/dashboard"
    echo "   - API Documentation: $DEPLOYMENT_URL (see README.md)"
else
    echo "❌ Deployment failed or URL not found"
    echo "Check Vercel dashboard for details: https://vercel.com/dashboard"
    exit 1
fi

echo "🎉 Deployment complete!"