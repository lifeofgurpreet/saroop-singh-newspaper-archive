import { NextRequest, NextResponse } from 'next/server';
import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import archiver from 'archiver';
import { PassThrough } from 'stream';

export async function POST(request: NextRequest) {
  try {
    const { restorationIds } = await request.json();

    if (!restorationIds || !Array.isArray(restorationIds) || restorationIds.length === 0) {
      return NextResponse.json(
        { error: 'No restoration IDs provided' },
        { status: 400 }
      );
    }

    // Extract session ID from first restoration ID
    const sessionId = restorationIds[0].split('-')[0];
    const sessionDir = join(process.cwd(), 'public', 'restorations', sessionId);

    if (!existsSync(sessionDir)) {
      return NextResponse.json(
        { error: 'Restoration session not found' },
        { status: 404 }
      );
    }

    // Create a zip archive
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });

    // Collect all data in memory
    const buffers: Buffer[] = [];
    const passThrough = new PassThrough();
    
    passThrough.on('data', (chunk) => buffers.push(chunk));
    
    return new Promise<NextResponse>((resolve, reject) => {
      passThrough.on('end', () => {
        const zipBuffer = Buffer.concat(buffers);
        const response = new NextResponse(zipBuffer, {
          headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="restored-photos-${sessionId}.zip"`,
            'Content-Length': zipBuffer.length.toString(),
          },
        });
        resolve(response);
      });

      archive.on('error', (err) => reject(err));
      archive.pipe(passThrough);

      // Add files to archive
      Promise.all([
        readdir(sessionDir).then(files => 
          Promise.all(
            files.filter(file => file.endsWith('.png')).map(async (file) => {
              const filePath = join(sessionDir, file);
              const fileBuffer = await readFile(filePath);
              
              // Use descriptive filename
              let archiveFilename = file;
              if (file === 'original.png') {
                archiveFilename = 'original.png';
              } else {
                // Convert kebab-case back to proper name
                const styleName = file.replace('.png', '').split('-').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ');
                archiveFilename = `${styleName}.png`;
              }
              
              archive.append(fileBuffer, { name: archiveFilename });
            })
          )
        )
      ]).then(() => {
        archive.finalize();
      }).catch(reject);
    });

  } catch (error) {
    console.error('Download all error:', error);
    return NextResponse.json(
      { error: 'Failed to create download archive' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Download All Restorations API',
    methods: ['POST'],
    description: 'Download all restoration results as a ZIP file',
  });
}