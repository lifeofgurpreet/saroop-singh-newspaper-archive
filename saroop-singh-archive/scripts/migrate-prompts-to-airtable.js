#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

// Airtable configuration
const AIRTABLE_BASE_ID = 'appQpjCUauAy7Ut1Y';
const AIRTABLE_TABLE_ID = 'tblEKjaq3I9yfOg0d';
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || 'your_api_key_here';

const prompts = [
  {
    file: 'packages/clippings/prompts/article_review_system_prompt.md',
    name: 'Article Review System Prompt',
    title: 'Publishing-Ready Article Reviewer Agent',
    category: 'Article Processing',
    subcategory: 'Quality Assurance',
    slug: 'article-review'
  },
  {
    file: 'packages/restorations/prompts/2_restore/vintage-photo-restoration-photorealistic-color-image-with-modern-detail.md',
    name: 'Vintage Photo Restoration',
    title: 'Photorealistic Color Image with Modern Detail',
    category: 'Photo Restoration',
    subcategory: 'Direct Enhancement',
    slug: 'vintage-restoration-color'
  },
  {
    file: 'packages/restorations/prompts/3_reshoot/cinematic-golden-hour-vintage-photo-restoration.md',
    name: 'Cinematic Golden Hour',
    title: 'Cinematic Golden Hour Vintage Photo Restoration',
    category: 'Photo Restoration',
    subcategory: 'Cinematic',
    slug: 'cinematic-golden-hour'
  },
  {
    file: 'packages/restorations/prompts/3_reshoot/hyper-realistic-modern-reshoot-of-vintage-scene.md',
    name: 'Hyper-Realistic Modern Reshoot',
    title: 'Hyper-Realistic Modern Reshoot of Vintage Scene',
    category: 'Photo Restoration',
    subcategory: 'Modern Photoshoot',
    slug: 'hyper-realistic-reshoot'
  },
  {
    file: 'packages/restorations/prompts/3_reshoot/photorealistic-3d-scene-reconstruction-from-vintage-photo-blueprint.md',
    name: '3D Scene Reconstruction',
    title: 'Photorealistic 3D Scene Reconstruction from Vintage Photo',
    category: '3D Reconstruction',
    subcategory: 'Reshoot Style',
    slug: '3d-scene-reconstruction'
  },
  {
    file: 'packages/restorations/prompts/3_reshoot/vintage-blueprint-to-digital-hyper-realism-a-modern-restoration.md',
    name: 'Digital Hyper-Realism',
    title: 'Vintage Blueprint to Digital Hyper-Realism',
    category: 'Digital Synthesis',
    subcategory: 'Modern Photoshoot',
    slug: 'digital-hyper-realism'
  },
  {
    file: 'packages/restorations/prompts/3_reshoot/vintage-blueprint-to-hyper-realistic-digital-restoration.md',
    name: 'Hyper-Realistic Digital',
    title: 'Vintage Blueprint to Hyper-Realistic Digital Restoration',
    category: 'Digital Synthesis',
    subcategory: 'Reshoot Style',
    slug: 'hyper-realistic-digital'
  },
  {
    file: 'packages/restorations/prompts/3_reshoot/vintage-photo-remake-hyper-realistic-modern-portrait-restoration.md',
    name: 'Portrait Remake',
    title: 'Hyper-Realistic Modern Portrait Restoration',
    category: 'Photo Restoration',
    subcategory: 'Portrait Remake',
    slug: 'portrait-remake'
  },
  {
    file: 'packages/restorations/prompts/3_reshoot/vintage-photo-reshoot-cinematic-golden-hour-restoration.md',
    name: 'Cinematic Reshoot',
    title: 'Vintage Photo Reshoot Cinematic Golden Hour',
    category: 'Photo Restoration',
    subcategory: 'Cinematic',
    slug: 'cinematic-reshoot'
  },
  {
    file: 'packages/restorations/prompts/3_reshoot/vintage-photo-to-modern-hyper-realistic-portrait-restoration.md',
    name: 'Modern Portrait',
    title: 'Vintage Photo to Modern Hyper-Realistic Portrait',
    category: 'Photo Restoration',
    subcategory: 'Portrait Remake',
    slug: 'modern-portrait'
  },
  {
    file: 'packages/restorations/prompts/3_reshoot/vintage-photo-to-photorealistic-3d-scene-reconstruction.md',
    name: '3D Photo Reconstruction',
    title: 'Vintage Photo to Photorealistic 3D Scene',
    category: '3D Reconstruction',
    subcategory: 'Reshoot Style',
    slug: '3d-photo-reconstruction'
  },
  {
    file: 'packages/restorations/prompts/3_reshoot/vintage-scene-modern-photoshoot-hyper-realistic-restoration.md',
    name: 'Modern Photoshoot',
    title: 'Vintage Scene Modern Photoshoot',
    category: 'Photo Restoration',
    subcategory: 'Modern Photoshoot',
    slug: 'modern-photoshoot'
  }
];

async function readPromptContent(filePath) {
  try {
    const fullPath = path.join('/Users/agent-g/Saroop Singh Project/saroop-singh-archive', filePath);
    const content = await fs.readFile(fullPath, 'utf8');
    return content;
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return '';
  }
}

async function migratePrompts() {
  console.log('Starting prompt migration to Airtable...\n');
  
  for (const prompt of prompts) {
    console.log(`Processing: ${prompt.name}`);
    
    // Read the full content
    const content = await readPromptContent(prompt.file);
    
    // Prepare the record
    const record = {
      Name: prompt.name,
      Title: prompt.title,
      Category: prompt.category,
      Subcategory: prompt.subcategory,
      Slug: prompt.slug,
      'File Path': prompt.file,
      'Prompt Content': content,
      Status: 'Done'
    };
    
    console.log(`  - Category: ${prompt.category}`);
    console.log(`  - Subcategory: ${prompt.subcategory}`);
    console.log(`  - Slug: ${prompt.slug}`);
    console.log(`  - Content length: ${content.length} chars`);
    console.log('');
  }
  
  console.log('\nMigration data prepared. Ready to upload to Airtable.');
  console.log('Total prompts to migrate:', prompts.length);
  
  // Export for manual review
  const outputPath = path.join('/Users/agent-g/Saroop Singh Project/saroop-singh-archive', 'prompts-migration.json');
  const migrationData = [];
  
  for (const prompt of prompts) {
    const content = await readPromptContent(prompt.file);
    migrationData.push({
      ...prompt,
      content: content
    });
  }
  
  await fs.writeFile(outputPath, JSON.stringify(migrationData, null, 2));
  console.log(`\nMigration data saved to: ${outputPath}`);
}

migratePrompts().catch(console.error);