#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const articlesDir = path.join(__dirname, '../../../content/articles/published');
const articles = fs.readdirSync(articlesDir).filter(f => f.endsWith('.md'));

articles.forEach(file => {
  const filePath = path.join(articlesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix image paths to use just the filename (we'll serve from public/images)
  content = content.replace(/image:\s*\.\.\/\.\.\/raw-files\//g, 'image: /images/');
  
  // Also handle any variations
  content = content.replace(/image:\s*raw-files\//g, 'image: /images/');
  content = content.replace(/image:\s*([^/\n]+\.jpg)/g, 'image: /images/$1');
  
  fs.writeFileSync(filePath, content);
});

console.log(`Fixed image paths in ${articles.length} articles`);