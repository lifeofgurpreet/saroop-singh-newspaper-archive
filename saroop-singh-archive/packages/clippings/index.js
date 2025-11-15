/**
 * Clippings Package - Main Entry Point
 * 
 * This package provides tools for processing newspaper clippings
 * into structured data for the Saroop Singh Archive.
 */

const { processClippings } = require('./scripts/process-clippings');
const { validateArticles } = require('./scripts/validate-articles');
const fs = require('fs');
const path = require('path');

// Export main functions
module.exports = {
  processClippings,
  validateArticles,
  
  // Utility function to get all articles
  getArticles: () => {
    const articlesPath = path.join(__dirname, '../../shared/data/articles');
    const files = fs.readdirSync(articlesPath)
      .filter(f => f.endsWith('.md'));
    return files.map(f => path.basename(f, '.md'));
  },
  
  // Get metadata
  getMetadata: () => {
    const metadataPath = path.join(__dirname, '../../shared/data/metadata/articles.json');
    if (fs.existsSync(metadataPath)) {
      return JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    }
    return [];
  }
};