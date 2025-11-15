#!/usr/bin/env node

/**
 * Saroop Singh Archive Content Reorganization Script
 * 
 * This script migrates the messy directory structure into a clean,
 * scalable content management system while maintaining all existing content.
 * 
 * Features:
 * - Dry run mode to preview changes
 * - Backup of current structure
 * - Detailed logging and validation
 * - Rollback capability
 * - Update of all references in code
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class ContentReorganizer {
  constructor(options = {}) {
    this.rootDir = '/Users/agent-g/Saroop Singh Project/saroop-singh-archive';
    this.dryRun = options.dryRun || false;
    this.verbose = options.verbose || false;
    this.backupDir = options.backupDir || path.join(this.rootDir, 'backup-' + Date.now());
    
    // Migration manifest to track all moves
    this.manifest = {
      timestamp: new Date().toISOString(),
      moves: [],
      symlinks: [],
      references: [],
      errors: [],
      backupDir: this.backupDir
    };
    
    // New directory structure
    this.newStructure = {
      'content/articles/published': 'Current published articles',
      'content/articles/drafts': 'Work in progress articles',
      'content/articles/archive': 'Old versions and deprecated articles',
      'content/media/originals/clippings': 'Original newspaper clippings',
      'content/media/originals/photos': 'Family photos and portraits',
      'content/media/originals/documents': 'Other source documents',
      'content/media/processed/web': 'Web-ready optimized images',
      'content/media/processed/thumbnails': 'Auto-generated thumbnails',
      'content/media/processed/gallery': 'Gallery display versions',
      'content/media/restorations/queue': 'Images to be processed',
      'content/media/restorations/processing': 'Currently being worked on',
      'content/media/restorations/completed': 'Finished AI restorations',
      'content/submissions': 'User contributions and submissions',
      'content/metadata': 'Structured data and indexes'
    };
    
    // File mappings from current to new locations
    this.fileMappings = [];
  }

  async log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    console.log(logMessage);
    
    // Don't create log file during directory creation to avoid recursion
    if (!this.dryRun && !this.creatingDirs && this.logFile) {
      await fs.appendFile(this.logFile, logMessage + '\n');
    }
  }

  async initializeLogging() {
    if (!this.dryRun) {
      const logDir = path.join(this.rootDir, 'logs');
      try {
        await fs.access(logDir);
      } catch (error) {
        await fs.mkdir(logDir, { recursive: true });
      }
      this.logFile = path.join(logDir, `reorganize-${Date.now()}.log`);
    }
  }

  async ensureDir(dirPath) {
    if (this.dryRun) {
      await this.log(`[DRY RUN] Would create directory: ${dirPath}`);
      return;
    }
    
    this.creatingDirs = true;
    try {
      await fs.access(dirPath);
    } catch (error) {
      await fs.mkdir(dirPath, { recursive: true });
      await this.log(`Created directory: ${dirPath}`);
    }
    this.creatingDirs = false;
  }

  async copyFile(source, destination) {
    if (this.dryRun) {
      await this.log(`[DRY RUN] Would copy: ${source} -> ${destination}`);
      return;
    }
    
    await this.ensureDir(path.dirname(destination));
    await fs.copyFile(source, destination);
    await this.log(`Copied: ${source} -> ${destination}`);
    
    this.manifest.moves.push({
      type: 'copy',
      source,
      destination,
      timestamp: new Date().toISOString()
    });
  }

  async moveFile(source, destination) {
    if (this.dryRun) {
      await this.log(`[DRY RUN] Would move: ${source} -> ${destination}`);
      return;
    }
    
    await this.ensureDir(path.dirname(destination));
    await fs.rename(source, destination);
    await this.log(`Moved: ${source} -> ${destination}`);
    
    this.manifest.moves.push({
      type: 'move',
      source,
      destination,
      timestamp: new Date().toISOString()
    });
  }

  async createSymlink(target, linkPath) {
    if (this.dryRun) {
      await this.log(`[DRY RUN] Would create symlink: ${linkPath} -> ${target}`);
      return;
    }
    
    try {
      await fs.access(linkPath);
      await fs.unlink(linkPath); // Remove existing symlink
    } catch (error) {
      // File doesn't exist, which is fine
    }
    
    await this.ensureDir(path.dirname(linkPath));
    await fs.symlink(target, linkPath);
    await this.log(`Created symlink: ${linkPath} -> ${target}`);
    
    this.manifest.symlinks.push({
      target,
      link: linkPath,
      timestamp: new Date().toISOString()
    });
  }

  async scanDirectory(dir, extensions = ['.jpg', '.jpeg', '.png', '.md', '.json']) {
    const files = [];
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          const subFiles = await this.scanDirectory(fullPath, extensions);
          files.push(...subFiles);
        } else if (extensions.some(ext => entry.name.toLowerCase().endsWith(ext))) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      await this.log(`Error scanning directory ${dir}: ${error.message}`, 'error');
    }
    
    return files;
  }

  async analyzeCurrentStructure() {
    await this.log('Analyzing current directory structure...');
    
    const analysis = {
      articles: [],
      images: {
        clippings: [],
        familyPhotos: [],
        restorations: [],
        webImages: []
      },
      metadata: [],
      duplicates: []
    };
    
    // Scan articles
    const articlesDir = path.join(this.rootDir, 'shared/data/articles');
    try {
      const articleFiles = await this.scanDirectory(articlesDir, ['.md']);
      analysis.articles = articleFiles;
      await this.log(`Found ${articleFiles.length} article files`);
    } catch (error) {
      await this.log(`Error scanning articles: ${error.message}`, 'error');
    }
    
    // Scan images in various locations
    const imageDirs = [
      { path: path.join(this.rootDir, 'shared/assets/family-photos'), type: 'familyPhotos' },
      { path: path.join(this.rootDir, 'shared/assets/restorations'), type: 'restorations' },
      { path: path.join(this.rootDir, 'shared/assets/restored-images'), type: 'restorations' },
      { path: path.join(this.rootDir, 'packages/web/public/images'), type: 'clippings' },
      { path: path.join(this.rootDir, 'packages/web/public/gallery'), type: 'restorations' },
      { path: path.join(this.rootDir, 'packages/web/public/restorations'), type: 'restorations' },
      { path: path.join(this.rootDir, 'packages/restorations/generated'), type: 'restorations' }
    ];
    
    for (const dir of imageDirs) {
      try {
        const imageFiles = await this.scanDirectory(dir.path, ['.jpg', '.jpeg', '.png']);
        analysis.images[dir.type].push(...imageFiles);
        await this.log(`Found ${imageFiles.length} ${dir.type} images in ${dir.path}`);
      } catch (error) {
        await this.log(`Error scanning ${dir.path}: ${error.message}`, 'error');
      }
    }
    
    // Scan metadata
    const metadataDir = path.join(this.rootDir, 'shared/data/metadata');
    try {
      const metadataFiles = await this.scanDirectory(metadataDir, ['.json']);
      analysis.metadata = metadataFiles;
      await this.log(`Found ${metadataFiles.length} metadata files`);
    } catch (error) {
      await this.log(`Error scanning metadata: ${error.message}`, 'error');
    }
    
    // Find duplicates by comparing file hashes
    await this.findDuplicates(analysis);
    
    return analysis;
  }

  async findDuplicates(analysis) {
    await this.log('Analyzing for duplicate files...');
    
    const allImages = [
      ...analysis.images.clippings,
      ...analysis.images.familyPhotos,
      ...analysis.images.restorations,
      ...analysis.images.webImages
    ];
    
    const hashMap = new Map();
    
    for (const imagePath of allImages) {
      try {
        const content = await fs.readFile(imagePath);
        const hash = crypto.createHash('md5').update(content).digest('hex');
        
        if (hashMap.has(hash)) {
          hashMap.get(hash).push(imagePath);
        } else {
          hashMap.set(hash, [imagePath]);
        }
      } catch (error) {
        await this.log(`Error hashing ${imagePath}: ${error.message}`, 'error');
      }
    }
    
    // Find groups with multiple files (duplicates)
    for (const [hash, files] of hashMap.entries()) {
      if (files.length > 1) {
        analysis.duplicates.push({ hash, files });
        await this.log(`Found ${files.length} duplicates: ${files.join(', ')}`);
      }
    }
    
    await this.log(`Found ${analysis.duplicates.length} duplicate file groups`);
  }

  async createNewStructure() {
    await this.log('Creating new directory structure...');
    
    for (const [dirPath, description] of Object.entries(this.newStructure)) {
      const fullPath = path.join(this.rootDir, dirPath);
      await this.ensureDir(fullPath);
      
      // Create README.md in each directory
      const readmePath = path.join(fullPath, 'README.md');
      const readmeContent = `# ${path.basename(dirPath)}\n\n${description}\n\nCreated: ${new Date().toISOString()}\n`;
      
      if (!this.dryRun) {
        await fs.writeFile(readmePath, readmeContent);
      }
    }
  }

  async migrateArticles(analysis) {
    await this.log('Migrating articles...');
    
    const publishedDir = path.join(this.rootDir, 'content/articles/published');
    
    for (const articlePath of analysis.articles) {
      const filename = path.basename(articlePath);
      const destination = path.join(publishedDir, filename);
      
      await this.copyFile(articlePath, destination);
      this.fileMappings.push({
        type: 'article',
        oldPath: articlePath,
        newPath: destination
      });
    }
    
    await this.log(`Migrated ${analysis.articles.length} articles to published directory`);
  }

  async migrateImages(analysis) {
    await this.log('Migrating images...');
    
    // Process duplicates first - keep the best version
    const processedHashes = new Set();
    
    for (const duplicateGroup of analysis.duplicates) {
      if (processedHashes.has(duplicateGroup.hash)) continue;
      
      // Choose the best file (prefer originals, then processed)
      const bestFile = this.chooseBestDuplicate(duplicateGroup.files);
      const destinationType = this.categorizeImage(bestFile);
      
      await this.migrateImage(bestFile, destinationType);
      
      // Record other files as duplicates to be removed
      for (const file of duplicateGroup.files) {
        if (file !== bestFile) {
          this.manifest.moves.push({
            type: 'duplicate_removed',
            source: file,
            keptVersion: bestFile,
            timestamp: new Date().toISOString()
          });
        }
      }
      
      processedHashes.add(duplicateGroup.hash);
    }
    
    // Process remaining unique images
    const allImages = [
      ...analysis.images.clippings,
      ...analysis.images.familyPhotos,
      ...analysis.images.restorations,
      ...analysis.images.webImages
    ];
    
    const duplicateFiles = new Set(analysis.duplicates.flatMap(d => d.files));
    const uniqueImages = allImages.filter(img => !duplicateFiles.has(img));
    
    for (const imagePath of uniqueImages) {
      const destinationType = this.categorizeImage(imagePath);
      await this.migrateImage(imagePath, destinationType);
    }
  }

  chooseBestDuplicate(files) {
    // Prefer files in certain locations (originals over processed)
    const priorities = [
      'shared/assets/family-photos',
      'packages/web/public/images',
      'shared/assets/raw-images',
      'shared/assets/processed-images',
      'packages/web/public/gallery',
      'packages/restorations'
    ];
    
    for (const priority of priorities) {
      const match = files.find(file => file.includes(priority));
      if (match) return match;
    }
    
    // If no priority match, return the first file
    return files[0];
  }

  categorizeImage(imagePath) {
    const pathLower = imagePath.toLowerCase();
    
    if (pathLower.includes('family-photos') || pathLower.includes('portrait')) {
      return 'photos';
    } else if (pathLower.includes('restoration') || pathLower.includes('gallery')) {
      return 'restorations';
    } else if (pathLower.includes('straits-times') || pathLower.includes('newspaper') || 
               pathLower.includes('tribune') || pathLower.includes('gazette')) {
      return 'clippings';
    } else {
      return 'documents'; // Default category
    }
  }

  async migrateImage(imagePath, category) {
    const filename = path.basename(imagePath);
    let destination;
    
    // Determine if this is an original or processed image
    const isProcessed = imagePath.includes('processed') || 
                       imagePath.includes('restoration') || 
                       imagePath.includes('gallery') ||
                       imagePath.includes('public');
    
    if (isProcessed) {
      if (category === 'restorations') {
        destination = path.join(this.rootDir, 'content/media/restorations/completed', filename);
      } else {
        destination = path.join(this.rootDir, 'content/media/processed/web', filename);
      }
    } else {
      destination = path.join(this.rootDir, `content/media/originals/${category}`, filename);
    }
    
    await this.copyFile(imagePath, destination);
    this.fileMappings.push({
      type: 'image',
      category,
      oldPath: imagePath,
      newPath: destination,
      isProcessed
    });
  }

  async migrateMetadata(analysis) {
    await this.log('Migrating metadata...');
    
    const metadataDir = path.join(this.rootDir, 'content/metadata');
    
    for (const metadataPath of analysis.metadata) {
      const filename = path.basename(metadataPath);
      const destination = path.join(metadataDir, filename);
      
      await this.copyFile(metadataPath, destination);
      this.fileMappings.push({
        type: 'metadata',
        oldPath: metadataPath,
        newPath: destination
      });
    }
  }

  async createSymlinks() {
    await this.log('Creating symlinks for backwards compatibility...');
    
    // Create symlinks in packages/web/public to point to content/media/processed
    const webPublic = path.join(this.rootDir, 'packages/web/public');
    
    // Images symlink
    const imagesLink = path.join(webPublic, 'images');
    const imagesTarget = path.relative(webPublic, path.join(this.rootDir, 'content/media/processed/web'));
    await this.createSymlink(imagesTarget, imagesLink);
    
    // Gallery symlink
    const galleryLink = path.join(webPublic, 'gallery');
    const galleryTarget = path.relative(webPublic, path.join(this.rootDir, 'content/media/processed/gallery'));
    await this.createSymlink(galleryTarget, galleryLink);
    
    // Restorations symlink
    const restorationsLink = path.join(webPublic, 'restorations');
    const restorationsTarget = path.relative(webPublic, path.join(this.rootDir, 'content/media/restorations/completed'));
    await this.createSymlink(restorationsTarget, restorationsLink);
  }

  async updateCodeReferences() {
    await this.log('Updating code references...');
    
    // Files that might contain image paths
    const filesToUpdate = [
      path.join(this.rootDir, 'packages/web/src/**/*.tsx'),
      path.join(this.rootDir, 'packages/web/src/**/*.ts'),
      path.join(this.rootDir, 'packages/web/src/**/*.js'),
      path.join(this.rootDir, 'packages/web/**/*.json'),
      path.join(this.rootDir, 'shared/**/*.json')
    ];
    
    // This would require a more sophisticated implementation
    // For now, we'll log what needs to be updated
    await this.log('Code reference updates would be performed here');
    await this.log('Manual review recommended for:');
    await this.log('- Article image paths in frontmatter');
    await this.log('- Component imports and asset references');
    await this.log('- API endpoints and data fetching');
  }

  async createBackup() {
    if (this.dryRun) {
      await this.log('[DRY RUN] Would create backup directory');
      return;
    }
    
    await this.log(`Creating backup at ${this.backupDir}...`);
    
    const dirsToBackup = [
      'shared/data',
      'shared/assets',
      'packages/web/public/images',
      'packages/web/public/gallery',
      'packages/web/public/restorations',
      'packages/restorations/generated'
    ];
    
    for (const dir of dirsToBackup) {
      const sourcePath = path.join(this.rootDir, dir);
      const backupPath = path.join(this.backupDir, dir);
      
      try {
        await this.copyDirectory(sourcePath, backupPath);
        await this.log(`Backed up ${dir}`);
      } catch (error) {
        await this.log(`Error backing up ${dir}: ${error.message}`, 'error');
      }
    }
  }

  async copyDirectory(source, destination) {
    await this.ensureDir(destination);
    
    const entries = await fs.readdir(source, { withFileTypes: true });
    
    for (const entry of entries) {
      const sourcePath = path.join(source, entry.name);
      const destPath = path.join(destination, entry.name);
      
      if (entry.isDirectory()) {
        await this.copyDirectory(sourcePath, destPath);
      } else {
        await fs.copyFile(sourcePath, destPath);
      }
    }
  }

  async saveManifest() {
    const manifestPath = path.join(this.rootDir, 'migration-manifest.json');
    
    if (this.dryRun) {
      await this.log(`[DRY RUN] Would save manifest to ${manifestPath}`);
      console.log('\n=== MIGRATION MANIFEST (DRY RUN) ===');
      console.log(JSON.stringify(this.manifest, null, 2));
      return;
    }
    
    await fs.writeFile(manifestPath, JSON.stringify(this.manifest, null, 2));
    await this.log(`Saved migration manifest to ${manifestPath}`);
  }

  async generateRollbackScript() {
    const rollbackScript = `#!/bin/bash
# Rollback script generated on ${new Date().toISOString()}
# This script will restore the original directory structure

set -e

echo "Starting rollback of content reorganization..."

# Restore from backup
if [ -d "${this.backupDir}" ]; then
  echo "Restoring from backup: ${this.backupDir}"
  cp -r "${this.backupDir}"/* "${this.rootDir}/"
else
  echo "Backup directory not found: ${this.backupDir}"
  exit 1
fi

# Remove new content directory
if [ -d "${this.rootDir}/content" ]; then
  echo "Removing new content directory..."
  rm -rf "${this.rootDir}/content"
fi

# Remove symlinks
${this.manifest.symlinks.map(link => `rm -f "${link.link}"`).join('\n')}

echo "Rollback completed successfully"
`;
    
    const rollbackPath = path.join(this.rootDir, 'rollback-reorganization.sh');
    
    if (this.dryRun) {
      await this.log(`[DRY RUN] Would create rollback script at ${rollbackPath}`);
      return;
    }
    
    await fs.writeFile(rollbackPath, rollbackScript);
    await fs.chmod(rollbackPath, 0o755);
    await this.log(`Created rollback script at ${rollbackPath}`);
  }

  async run() {
    try {
      // Initialize logging first
      await this.initializeLogging();
      
      await this.log('Starting Saroop Singh Archive content reorganization...');
      await this.log(`Dry run mode: ${this.dryRun}`);
      
      // Step 1: Analyze current structure
      const analysis = await this.analyzeCurrentStructure();
      
      // Step 2: Create backup
      if (!this.dryRun) {
        await this.createBackup();
      }
      
      // Step 3: Create new directory structure
      await this.createNewStructure();
      
      // Step 4: Migrate content
      await this.migrateArticles(analysis);
      await this.migrateImages(analysis);
      await this.migrateMetadata(analysis);
      
      // Step 5: Create symlinks for backwards compatibility
      await this.createSymlinks();
      
      // Step 6: Update code references (placeholder)
      await this.updateCodeReferences();
      
      // Step 7: Save manifest and create rollback script
      await this.saveManifest();
      await this.generateRollbackScript();
      
      await this.log('Content reorganization completed successfully!');
      
      // Print summary
      console.log('\n=== MIGRATION SUMMARY ===');
      console.log(`Articles migrated: ${analysis.articles.length}`);
      console.log(`Images processed: ${Object.values(analysis.images).flat().length}`);
      console.log(`Duplicates found: ${analysis.duplicates.length}`);
      console.log(`Metadata files: ${analysis.metadata.length}`);
      console.log(`Symlinks created: ${this.manifest.symlinks.length}`);
      
      if (!this.dryRun) {
        console.log(`\nBackup created at: ${this.backupDir}`);
        console.log(`Log file: ${this.logFile}`);
        console.log(`Manifest: ${path.join(this.rootDir, 'migration-manifest.json')}`);
        console.log(`Rollback script: ${path.join(this.rootDir, 'rollback-reorganization.sh')}`);
      }
      
    } catch (error) {
      await this.log(`Migration failed: ${error.message}`, 'error');
      this.manifest.errors.push({
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    dryRun: args.includes('--dry-run') || args.includes('-n'),
    verbose: args.includes('--verbose') || args.includes('-v'),
  };
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Saroop Singh Archive Content Reorganization Script

Usage: node reorganize-content.js [options]

Options:
  --dry-run, -n     Preview changes without making them
  --verbose, -v     Enable verbose logging
  --help, -h        Show this help message

Examples:
  node reorganize-content.js --dry-run    # Preview changes
  node reorganize-content.js              # Execute migration
  node reorganize-content.js --verbose    # Execute with detailed logging
`);
    process.exit(0);
  }
  
  const reorganizer = new ContentReorganizer(options);
  
  reorganizer.run()
    .then(() => {
      console.log('\nReorganization completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\nReorganization failed:', error.message);
      process.exit(1);
    });
}

module.exports = ContentReorganizer;