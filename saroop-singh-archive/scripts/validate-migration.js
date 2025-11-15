#!/usr/bin/env node

/**
 * Migration Validation Script for Saroop Singh Archive
 * 
 * This script validates the migration was successful by:
 * - Checking all files were moved correctly
 * - Validating symlinks work properly
 * - Testing that web application still functions
 * - Generating a validation report
 */

const fs = require('fs').promises;
const path = require('path');

class MigrationValidator {
  constructor() {
    this.rootDir = '/Users/agent-g/Saroop Singh Project/saroop-singh-archive';
    this.manifestPath = path.join(this.rootDir, 'migration-manifest.json');
    this.results = {
      timestamp: new Date().toISOString(),
      passed: 0,
      failed: 0,
      warnings: 0,
      tests: []
    };
  }

  async log(message, level = 'info') {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message
    };
    
    console.log(`[${level.toUpperCase()}] ${message}`);
    
    if (level === 'error') {
      this.results.failed++;
    } else if (level === 'warning') {
      this.results.warnings++;
    } else {
      this.results.passed++;
    }
    
    this.results.tests.push(logEntry);
  }

  async loadManifest() {
    try {
      const manifestContent = await fs.readFile(this.manifestPath, 'utf8');
      return JSON.parse(manifestContent);
    } catch (error) {
      await this.log(`Failed to load manifest: ${error.message}`, 'error');
      return null;
    }
  }

  async validateFileExists(filePath, description) {
    try {
      await fs.access(filePath);
      await this.log(`✓ ${description}: ${filePath}`);
      return true;
    } catch (error) {
      await this.log(`✗ Missing ${description}: ${filePath}`, 'error');
      return false;
    }
  }

  async validateSymlink(linkPath, expectedTarget) {
    try {
      const stats = await fs.lstat(linkPath);
      if (!stats.isSymbolicLink()) {
        await this.log(`✗ Not a symlink: ${linkPath}`, 'error');
        return false;
      }
      
      const actualTarget = await fs.readlink(linkPath);
      if (actualTarget === expectedTarget) {
        await this.log(`✓ Symlink correct: ${linkPath} -> ${actualTarget}`);
        return true;
      } else {
        await this.log(`✗ Symlink incorrect: ${linkPath} -> ${actualTarget} (expected: ${expectedTarget})`, 'error');
        return false;
      }
    } catch (error) {
      await this.log(`✗ Symlink error: ${linkPath} - ${error.message}`, 'error');
      return false;
    }
  }

  async validateDirectoryStructure() {
    await this.log('=== Validating Directory Structure ===');
    
    const expectedDirs = [
      'content/articles/published',
      'content/articles/drafts',
      'content/articles/archive',
      'content/media/originals/clippings',
      'content/media/originals/photos',
      'content/media/originals/documents',
      'content/media/processed/web',
      'content/media/processed/thumbnails',
      'content/media/processed/gallery',
      'content/media/restorations/queue',
      'content/media/restorations/processing',
      'content/media/restorations/completed',
      'content/submissions',
      'content/metadata'
    ];
    
    let allExist = true;
    for (const dir of expectedDirs) {
      const fullPath = path.join(this.rootDir, dir);
      const exists = await this.validateFileExists(fullPath, `directory ${dir}`);
      if (!exists) allExist = false;
    }
    
    return allExist;
  }

  async validateMigration() {
    await this.log('=== Validating File Migration ===');
    
    const manifest = await this.loadManifest();
    if (!manifest) return false;
    
    let allValid = true;
    
    for (const move of manifest.moves) {
      if (move.type === 'duplicate_removed') continue;
      
      const exists = await this.validateFileExists(move.destination, `migrated file`);
      if (!exists) allValid = false;
    }
    
    return allValid;
  }

  async validateSymlinks() {
    await this.log('=== Validating Symlinks ===');
    
    const manifest = await this.loadManifest();
    if (!manifest) return false;
    
    let allValid = true;
    
    for (const symlink of manifest.symlinks) {
      const valid = await this.validateSymlink(symlink.link, symlink.target);
      if (!valid) allValid = false;
    }
    
    return allValid;
  }

  async validateArticleIntegrity() {
    await this.log('=== Validating Article Integrity ===');
    
    const articlesDir = path.join(this.rootDir, 'content/articles/published');
    
    try {
      const files = await fs.readdir(articlesDir);
      const mdFiles = files.filter(f => f.endsWith('.md'));
      
      let validArticles = 0;
      
      for (const file of mdFiles) {
        const filePath = path.join(articlesDir, file);
        const content = await fs.readFile(filePath, 'utf8');
        
        // Check for frontmatter
        if (content.startsWith('---')) {
          validArticles++;
        } else {
          await this.log(`✗ Article missing frontmatter: ${file}`, 'warning');
        }
      }
      
      await this.log(`✓ Validated ${validArticles} articles with proper frontmatter`);
      await this.log(`✓ Total articles found: ${mdFiles.length}`);
      
      return validArticles === mdFiles.length;
      
    } catch (error) {
      await this.log(`Error validating articles: ${error.message}`, 'error');
      return false;
    }
  }

  async validateImageCounts() {
    await this.log('=== Validating Image Migration ===');
    
    const manifest = await this.loadManifest();
    if (!manifest) return false;
    
    const imageMoves = manifest.moves.filter(m => m.type !== 'duplicate_removed');
    const imageTypes = {};
    
    for (const move of imageMoves) {
      const ext = path.extname(move.destination).toLowerCase();
      if (['.jpg', '.jpeg', '.png'].includes(ext)) {
        const dir = path.dirname(move.destination).split('/').pop();
        imageTypes[dir] = (imageTypes[dir] || 0) + 1;
      }
    }
    
    for (const [type, count] of Object.entries(imageTypes)) {
      await this.log(`✓ Images in ${type}: ${count}`);
    }
    
    return true;
  }

  async validateBackup() {
    await this.log('=== Validating Backup ===');
    
    const manifest = await this.loadManifest();
    if (!manifest) return false;
    
    const backupExists = await this.validateFileExists(manifest.backupDir, 'backup directory');
    
    if (backupExists) {
      // Check if backup contains expected directories
      const expectedBackupDirs = [
        'shared/data',
        'shared/assets',
        'packages/web/public/images'
      ];
      
      let allBackupsExist = true;
      for (const dir of expectedBackupDirs) {
        const backupPath = path.join(manifest.backupDir, dir);
        const exists = await this.validateFileExists(backupPath, `backup of ${dir}`);
        if (!exists) allBackupsExist = false;
      }
      
      return allBackupsExist;
    }
    
    return false;
  }

  async validateWebApplication() {
    await this.log('=== Validating Web Application ===');
    
    // Check if key web files still exist
    const webFiles = [
      'packages/web/src/app/page.tsx',
      'packages/web/src/app/articles/page.tsx',
      'packages/web/src/app/gallery/page.tsx'
    ];
    
    let allExist = true;
    for (const file of webFiles) {
      const fullPath = path.join(this.rootDir, file);
      const exists = await this.validateFileExists(fullPath, `web application file`);
      if (!exists) allExist = false;
    }
    
    // Check symlinks in web public directory
    const symlinks = [
      { link: 'packages/web/public/images', description: 'images symlink' },
      { link: 'packages/web/public/gallery', description: 'gallery symlink' },
      { link: 'packages/web/public/restorations', description: 'restorations symlink' }
    ];
    
    for (const symlink of symlinks) {
      const fullPath = path.join(this.rootDir, symlink.link);
      try {
        const stats = await fs.lstat(fullPath);
        if (stats.isSymbolicLink()) {
          await this.log(`✓ ${symlink.description} exists`);
        } else {
          await this.log(`✗ ${symlink.description} is not a symlink`, 'warning');
        }
      } catch (error) {
        await this.log(`✗ ${symlink.description} missing: ${error.message}`, 'error');
        allExist = false;
      }
    }
    
    return allExist;
  }

  async generateReport() {
    const reportPath = path.join(this.rootDir, 'migration-validation-report.json');
    await fs.writeFile(reportPath, JSON.stringify(this.results, null, 2));
    
    console.log('\n=== VALIDATION SUMMARY ===');
    console.log(`Tests passed: ${this.results.passed}`);
    console.log(`Tests failed: ${this.results.failed}`);
    console.log(`Warnings: ${this.results.warnings}`);
    console.log(`Report saved to: ${reportPath}`);
    
    return this.results.failed === 0;
  }

  async run() {
    await this.log('Starting migration validation...');
    
    const tests = [
      this.validateDirectoryStructure(),
      this.validateMigration(),
      this.validateSymlinks(),
      this.validateArticleIntegrity(),
      this.validateImageCounts(),
      this.validateBackup(),
      this.validateWebApplication()
    ];
    
    await Promise.all(tests);
    
    const success = await this.generateReport();
    
    if (success) {
      console.log('\n✅ All validation tests passed!');
      return true;
    } else {
      console.log('\n❌ Some validation tests failed. Check the report for details.');
      return false;
    }
  }
}

// CLI Interface
if (require.main === module) {
  const validator = new MigrationValidator();
  
  validator.run()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Validation failed:', error.message);
      process.exit(1);
    });
}

module.exports = MigrationValidator;