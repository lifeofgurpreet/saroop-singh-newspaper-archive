import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_URL = process.env.GEMINI_API_URL || 'http://localhost:5001';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Check if Gemini API is available
    let healthCheck;
    try {
      healthCheck = await fetch(`${GEMINI_API_URL}/health`, {
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
    } catch (error) {
      console.error('Gemini API health check failed:', error);
      return NextResponse.json({ 
        error: 'Gemini restoration API is not running. Please start it with: cd packages/restorations && ./start-api.sh',
        details: 'The Gemini API server must be running on port 5001 for photo restoration to work.'
      }, { status: 503 });
    }
    
    if (!healthCheck.ok) {
      return NextResponse.json({ 
        error: 'Gemini restoration API is unhealthy',
        details: 'The API server is running but not responding correctly. Please check the logs.'
      }, { status: 503 });
    }

    // Use Gemini API for restoration - ONLY option, no fallback
    console.log('Using Gemini API for restoration');
    
    const geminiFormData = new FormData();
    geminiFormData.append('image', file);
    
    const response = await fetch(`${GEMINI_API_URL}/restore`, {
      method: 'POST',
      body: geminiFormData,
      signal: AbortSignal.timeout(120000) // 2 minute timeout for processing
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini restoration failed:', errorData);
      return NextResponse.json({ 
        error: 'Gemini restoration failed',
        details: errorData.error || 'Unknown error occurred during AI restoration'
      }, { status: response.status });
    }
    
    const data = await response.json();
    
    if (!data.restorations || data.restorations.length === 0) {
      return NextResponse.json({ 
        error: 'No restorations generated',
        details: 'Gemini API did not return any restored images. Please try again.'
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      restorations: data.restorations,
      method: 'gemini',
      count: data.restorations.length
    });
    
  } catch (error) {
    console.error('Error processing image:', error);
    
    // Provide helpful error messages
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json({ 
        error: 'Cannot connect to Gemini API',
        details: 'Please ensure the Gemini restoration server is running: cd packages/restorations && ./start-api.sh'
      }, { status: 503 });
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to process image',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';