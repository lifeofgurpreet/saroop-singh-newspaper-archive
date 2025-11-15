import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');
    const tag = searchParams.get('tag');

    // Verify the request is coming from a trusted source
    const secret = searchParams.get('secret');
    if (secret !== process.env.REVALIDATE_SECRET) {
      return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
    }

    if (path) {
      revalidatePath(path);
    }

    if (tag) {
      revalidateTag(tag);
    }

    // If no specific path or tag, revalidate articles
    if (!path && !tag) {
      revalidateTag('articles');
      revalidatePath('/articles');
      revalidatePath('/');
    }

    return NextResponse.json({ 
      revalidated: true, 
      now: Date.now(),
      path,
      tag 
    });
  } catch (err) {
    console.error('Revalidation error:', err);
    return NextResponse.json({ 
      message: 'Error revalidating' 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Revalidation endpoint is active',
    endpoints: [
      'POST /api/revalidate?secret=YOUR_SECRET',
      'POST /api/revalidate?secret=YOUR_SECRET&path=/articles',
      'POST /api/revalidate?secret=YOUR_SECRET&tag=articles'
    ]
  });
}