#!/usr/bin/env node

/**
 * Script to populate the gallery with Gemini-restored photos
 */

const fs = require('fs');
const path = require('path');

const RESTORATIONS_DIR = path.join(__dirname, '../../restorations/generated/restorations');
const GALLERY_DATA_DIR = path.join(__dirname, '../public/gallery-data');
const GALLERY_PUBLIC_DIR = path.join(__dirname, '../public/gallery');

// Ensure directories exist
if (!fs.existsSync(GALLERY_DATA_DIR)) {
  fs.mkdirSync(GALLERY_DATA_DIR, { recursive: true });
}
if (!fs.existsSync(GALLERY_PUBLIC_DIR)) {
  fs.mkdirSync(GALLERY_PUBLIC_DIR, { recursive: true });
}

// Read all restoration directories
const restorationDirs = fs.readdirSync(RESTORATIONS_DIR).filter(dir => {
  const fullPath = path.join(RESTORATIONS_DIR, dir);
  return fs.statSync(fullPath).isDirectory();
});

const galleryItems = [];

restorationDirs.forEach((dirName, index) => {
  const restorationPath = path.join(RESTORATIONS_DIR, dirName);
  const metaPath = path.join(restorationPath, 'meta.json');
  
  if (!fs.existsSync(metaPath)) {
    console.log(`Skipping ${dirName}: no meta.json found`);
    return;
  }
  
  try {
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    const itemId = `gemini-${dirName}`;
    
    // Copy original image
    const originalPath = path.join(restorationPath, 'original.jpg');
    const originalDestPath = path.join(GALLERY_PUBLIC_DIR, `${itemId}-original.jpg`);
    if (fs.existsSync(originalPath)) {
      fs.copyFileSync(originalPath, originalDestPath);
    }
    
    // Find all restoration files
    const restorationFiles = fs.readdirSync(restorationPath)
      .filter(file => file.endsWith('.png') && file.includes('__prompt'));
    
    // Create restorations array with proper URLs
    const restorations = restorationFiles.map((file, idx) => {
      const destFileName = `${itemId}-restoration-${idx + 1}.png`;
      const sourcePath = path.join(restorationPath, file);
      const destPath = path.join(GALLERY_PUBLIC_DIR, destFileName);
      
      // Copy restoration file
      fs.copyFileSync(sourcePath, destPath);
      
      // Extract prompt number from filename
      const promptMatch = file.match(/prompt(\d+)/);
      const promptNum = promptMatch ? parseInt(promptMatch[1]) : idx + 1;
      
      return {
        id: `${itemId}-restoration-${idx + 1}`,
        type: getRestorationType(promptNum),
        url: `/gallery/${destFileName}`,
        createdAt: meta.timestamp || new Date().toISOString()
      };
    });
    
    // Create gallery item
    const galleryItem = {
      id: itemId,
      title: formatTitle(dirName),
      date: extractDate(meta) || '1940s',
      submittedAt: meta.timestamp || new Date().toISOString(),
      isPublic: true,
      metadata: {
        title: formatTitle(dirName),
        date: extractDate(meta) || '1940s',
        familyMember: extractFamilyMember(dirName),
        tags: extractTags(dirName, meta),
        isPublic: true,
        description: meta.description || `Restored photograph from the Saroop Singh archive collection.`
      },
      thumbnailUrl: restorations[0]?.url || `/gallery/${itemId}-original.jpg`,
      restorations: restorations,
      originalImageUrl: `/gallery/${itemId}-original.jpg`
    };
    
    // Write individual item file
    const itemFilePath = path.join(GALLERY_DATA_DIR, `${itemId}.json`);
    fs.writeFileSync(itemFilePath, JSON.stringify(galleryItem, null, 2));
    
    // Add to items array
    galleryItems.push({
      id: itemId,
      title: galleryItem.title,
      date: galleryItem.date,
      thumbnailUrl: galleryItem.thumbnailUrl,
      isPublic: true,
      submittedAt: galleryItem.submittedAt
    });
    
    console.log(`✓ Added ${dirName} to gallery`);
  } catch (error) {
    console.error(`Error processing ${dirName}:`, error);
  }
});

// Write gallery index
const indexPath = path.join(GALLERY_DATA_DIR, 'index.json');
fs.writeFileSync(indexPath, JSON.stringify({
  items: galleryItems,
  totalCount: galleryItems.length,
  lastUpdated: new Date().toISOString()
}, null, 2));

console.log(`\n✨ Gallery populated with ${galleryItems.length} restored photos from Gemini`);

// Helper functions
function formatTitle(dirName) {
  return dirName
    .replace(/-/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
    .replace(/\b\d{4}s?\b/g, match => `(${match})`);
}

function extractDate(meta) {
  if (meta.date) return meta.date;
  // Try to extract from description or use default
  const yearMatch = meta.description?.match(/\b(19\d{2}s?|20\d{2}s?)\b/);
  return yearMatch ? yearMatch[1] : null;
}

function extractFamilyMember(dirName) {
  if (dirName.includes('saroop-singh')) return 'Saroop Singh';
  if (dirName.includes('family')) return 'Family';
  if (dirName.includes('portrait')) return 'Portrait';
  return 'Archive';
}

function extractTags(dirName, meta) {
  const tags = [];
  
  if (dirName.includes('saroop-singh')) tags.push('Saroop Singh');
  if (dirName.includes('running')) tags.push('Athletics', 'Sports');
  if (dirName.includes('portrait')) tags.push('Portrait');
  if (dirName.includes('family')) tags.push('Family');
  if (dirName.includes('group')) tags.push('Group Photo');
  if (dirName.includes('1970s')) tags.push('1970s');
  if (dirName.includes('1950s')) tags.push('1950s');
  if (dirName.includes('1980s')) tags.push('1980s');
  if (dirName.includes('vintage')) tags.push('Vintage');
  if (dirName.includes('monochrome')) tags.push('Black & White');
  
  tags.push('Restored', 'Gemini AI');
  
  return [...new Set(tags)]; // Remove duplicates
}

function getRestorationType(promptNum) {
  const types = {
    1: 'enhanced',
    2: 'colorized',
    3: 'repaired',
    4: 'denoised',
    5: 'sharpened',
    6: 'artistic'
  };
  return types[promptNum] || 'enhanced';
}