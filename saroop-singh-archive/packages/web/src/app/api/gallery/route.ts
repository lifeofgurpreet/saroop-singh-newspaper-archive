import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

interface GalleryItem {
  id: string;
  title?: string;
  date?: string;
  submittedAt: string;
  isPublic: boolean;
  metadata?: {
    title?: string;
    date?: string;
    familyMember?: string;
    tags?: string[];
    isPublic?: boolean;
  };
  thumbnailUrl?: string;
  restorations?: unknown[];
}

interface DetailedGalleryItem extends GalleryItem {
  metadata: {
    title?: string;
    date?: string;
    familyMember?: string;
    tags: string[];
    isPublic?: boolean;
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const isPublic = searchParams.get('public') !== 'false';
    const familyMember = searchParams.get('family');
    const tag = searchParams.get('tag');
    const sortBy = searchParams.get('sort') || 'newest';

    const galleryDataDir = join(process.cwd(), 'public', 'gallery-data');
    const indexFile = join(galleryDataDir, 'index.json');

    if (!existsSync(indexFile)) {
      return NextResponse.json({
        success: true,
        items: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      });
    }

    // Read gallery index
    const indexData = await readFile(indexFile, 'utf-8');
    const galleryIndex = JSON.parse(indexData);

    // Extract items array from index (handle both formats)
    const items = Array.isArray(galleryIndex) ? galleryIndex : (galleryIndex.items || []);

    // Filter items
    let filteredItems = items.filter((item) => {
      if (isPublic && !item.isPublic) return false;
      return true;
    });

    // Apply additional filters by reading full item data
    if (familyMember || tag) {
      const detailedItems = await Promise.all(
        filteredItems.map(async (item) => {
          try {
            const itemFile = join(galleryDataDir, `${item.id}.json`);
            const itemData = await readFile(itemFile, 'utf-8');
            return JSON.parse(itemData);
          } catch {
            return null;
          }
        })
      );

      filteredItems = detailedItems.filter((item): item is DetailedGalleryItem => {
        if (!item) return false;
        
        if (familyMember && item.metadata.familyMember !== familyMember) {
          return false;
        }
        
        if (tag && !item.metadata.tags.includes(tag)) {
          return false;
        }
        
        return true;
      });
    }

    // Sort items
    filteredItems.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
        case 'title':
          return a.metadata?.title.localeCompare(b.metadata?.title) || a.title?.localeCompare(b.title) || 0;
        case 'newest':
        default:
          return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      }
    });

    // Paginate
    const total = filteredItems.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedItems = filteredItems.slice(startIndex, endIndex);

    // Return simplified items (without full restoration data for list view)
    const simplifiedItems = paginatedItems.map((item) => ({
      id: item.id,
      title: item.metadata?.title || item.title || 'Untitled',
      date: item.metadata?.date || item.date,
      familyMember: item.metadata?.familyMember,
      tags: item.metadata?.tags || [],
      isPublic: item.metadata?.isPublic ?? item.isPublic,
      submittedAt: item.submittedAt,
      thumbnailUrl: item.thumbnailUrl,
      restorationCount: item.restorations?.length || 0,
    }));

    return NextResponse.json({
      success: true,
      items: simplifiedItems,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    });

  } catch (error) {
    console.error('Gallery fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gallery items' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('id');

    if (!itemId) {
      return NextResponse.json(
        { error: 'Item ID required' },
        { status: 400 }
      );
    }

    const galleryDataDir = join(process.cwd(), 'public', 'gallery-data');
    const itemFile = join(galleryDataDir, `${itemId}.json`);
    const indexFile = join(galleryDataDir, 'index.json');

    // Remove item file
    if (existsSync(itemFile)) {
      await unlink(itemFile);
    }

    // Update index
    if (existsSync(indexFile)) {
      const indexData = await readFile(indexFile, 'utf-8');
      const galleryIndex = JSON.parse(indexData);
      const updatedIndex = (galleryIndex as GalleryItem[]).filter((item) => item.id !== itemId);
      await writeFile(indexFile, JSON.stringify(updatedIndex, null, 2));
    }

    return NextResponse.json({
      success: true,
      message: 'Gallery item deleted successfully',
    });

  } catch (error) {
    console.error('Gallery delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete gallery item' },
      { status: 500 }
    );
  }
}