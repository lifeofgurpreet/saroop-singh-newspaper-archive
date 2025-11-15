import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

interface GallerySubmission {
  id: string;
  originalImage: string;
  restorations: {
    id: string;
    name: string;
    imageUrl: string;
    selected: boolean;
  }[];
  metadata: {
    title: string;
    description: string;
    date: string;
    familyMember?: string;
    tags: string[];
    isPublic: boolean;
  };
  submittedAt: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      sessionId, 
      selectedRestorations, 
      metadata 
    } = body;

    if (!sessionId || !selectedRestorations || !metadata) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate session exists
    const sessionDir = join(process.cwd(), 'public', 'restorations', sessionId);
    if (!existsSync(sessionDir)) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Create gallery directory if it doesn't exist
    const galleryDir = join(process.cwd(), 'public', 'gallery');
    if (!existsSync(galleryDir)) {
      await mkdir(galleryDir, { recursive: true });
    }

    // Create gallery data directory
    const galleryDataDir = join(process.cwd(), 'public', 'gallery-data');
    if (!existsSync(galleryDataDir)) {
      await mkdir(galleryDataDir, { recursive: true });
    }

    // Generate unique gallery ID
    const galleryId = `gallery-${Date.now().toString()}-${Math.random().toString(36).substr(2, 9)}`;
    const galleryItemDir = join(galleryDir, galleryId);
    await mkdir(galleryItemDir, { recursive: true });

    // Copy selected restoration files to gallery
    const galleryRestorations = [];
    for (const restoration of selectedRestorations) {
      if (restoration.selected) {
        try {
          // Read the original file
          const originalPath = join(process.cwd(), 'public', restoration.imageUrl.substring(1));
          const imageBuffer = await readFile(originalPath);
          
          // Create new filename for gallery
          const galleryFilename = `${restoration.name.toLowerCase().replace(/\s+/g, '-')}.png`;
          const galleryImagePath = join(galleryItemDir, galleryFilename);
          
          // Save to gallery
          await writeFile(galleryImagePath, imageBuffer);
          
          galleryRestorations.push({
            id: restoration.id,
            name: restoration.name,
            imageUrl: `/gallery/${galleryId}/${galleryFilename}`,
            selected: true,
          });
        } catch (copyError) {
          console.error(`Failed to copy ${restoration.name}:`, copyError);
        }
      }
    }

    // Copy original image to gallery
    const originalImagePath = join(sessionDir, 'original.png');
    const galleryOriginalPath = join(galleryItemDir, 'original.png');
    const originalBuffer = await readFile(originalImagePath);
    await writeFile(galleryOriginalPath, originalBuffer);

    // Create gallery submission record
    const submission: GallerySubmission = {
      id: galleryId,
      originalImage: `/gallery/${galleryId}/original.png`,
      restorations: galleryRestorations,
      metadata: {
        title: metadata.title || 'Untitled Restoration',
        description: metadata.description || '',
        date: metadata.date || new Date().toISOString().split('T')[0],
        familyMember: metadata.familyMember || '',
        tags: Array.isArray(metadata.tags) ? metadata.tags : [],
        isPublic: metadata.isPublic === true,
      },
      submittedAt: new Date().toISOString(),
    };

    // Save submission metadata
    const submissionFile = join(galleryDataDir, `${galleryId}.json`);
    await writeFile(submissionFile, JSON.stringify(submission, null, 2));

    // Update gallery index
    const indexFile = join(galleryDataDir, 'index.json');
    let galleryIndex = [];
    
    if (existsSync(indexFile)) {
      try {
        const indexData = await readFile(indexFile, 'utf-8');
        galleryIndex = JSON.parse(indexData);
      } catch (parseError) {
        console.error('Failed to parse gallery index:', parseError);
        galleryIndex = [];
      }
    }

    // Add new submission to index
    galleryIndex.push({
      id: galleryId,
      title: submission.metadata.title,
      date: submission.metadata.date,
      isPublic: submission.metadata.isPublic,
      submittedAt: submission.submittedAt,
      thumbnailUrl: galleryRestorations[0]?.imageUrl || submission.originalImage,
    });

    // Sort by submission date (newest first)
    galleryIndex.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

    // Save updated index
    await writeFile(indexFile, JSON.stringify(galleryIndex, null, 2));

    return NextResponse.json({
      success: true,
      galleryId,
      submittedRestorations: galleryRestorations.length,
      message: 'Successfully submitted to gallery',
    });

  } catch (error) {
    console.error('Gallery submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit to gallery' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Gallery Submission API',
    methods: ['POST'],
    description: 'Submit selected restorations to the public gallery',
  });
}