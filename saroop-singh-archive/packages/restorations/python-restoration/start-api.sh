#!/bin/bash

# Start the Gemini restoration API server

echo "Starting Gemini Restoration API Server..."

# Navigate to the restorations package
cd "$(dirname "$0")"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install/update dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Start the API server
echo "Starting server on port 5001..."
python api/server.py