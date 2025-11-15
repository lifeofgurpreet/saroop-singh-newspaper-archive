#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

async function getAllMarkdownFiles() {
  const articlesDir = path.join(__dirname, '..', 'restored-from-241636f', 'output', 'articles');
  const files = await fs.readdir(articlesDir);
  const mdFiles = files.filter(f => f.endsWith('.md'));
  
  const articles = [];
  
  for (const file of mdFiles) {
    const content = await fs.readFile(path.join(articlesDir, file), 'utf-8');
    const filename = file.replace('.md', '');
    
    // Parse frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!frontmatterMatch) continue;
    
    const frontmatter = frontmatterMatch[1];
    const bodyContent = frontmatterMatch[2].trim();
    
    // Parse frontmatter fields
    const article = {
      filename: filename,
      full_content: bodyContent,
      content_snippet: bodyContent.substring(0, 200).replace(/\n/g, ' ') + '...'
    };
    
    // Extract fields from frontmatter
    const titleMatch = frontmatter.match(/title:\s*["']?(.+?)["']?\s*$/m);
    if (titleMatch) article.title = titleMatch[1].replace(/^["']|["']$/g, '');
    
    const dateMatch = frontmatter.match(/date_text:\s*(.+)$/m) || frontmatter.match(/date:\s*(.+)$/m);
    if (dateMatch) article.date_text = dateMatch[1].trim();
    
    const sourceMatch = frontmatter.match(/source:\s*(.+)$/m);
    if (sourceMatch) article.source = sourceMatch[1].trim();
    
    const locationMatch = frontmatter.match(/location:\s*(.+)$/m);
    if (locationMatch) article.location = locationMatch[1].trim();
    
    const publicationMatch = frontmatter.match(/publication:\s*(.+)$/m);
    if (publicationMatch) article.publication = publicationMatch[1].trim();
    
    const pageMatch = frontmatter.match(/page:\s*(\d+)$/m);
    if (pageMatch) article.page = parseInt(pageMatch[1]);
    
    const categoryMatch = frontmatter.match(/category:\s*(.+)$/m);
    if (categoryMatch) article.category = categoryMatch[1].trim();
    
    const imageMatch = frontmatter.match(/image:\s*(.+)$/m);
    if (imageMatch) {
      article.image_path = imageMatch[1]
        .replace('../../raw-files/', '')
        .replace('../raw-files/', '')
        .replace('raw-files/', '');
    }
    
    // Parse people array
    const peopleMatch = frontmatter.match(/people:\s*\n((?:\s+-\s+.+\n?)+)/);
    if (peopleMatch) {
      article['people-mentioned'] = peopleMatch[1]
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.replace(/^\s*-\s*/, '').trim());
    }
    
    // Parse events array
    const eventsMatch = frontmatter.match(/events:\s*\n((?:\s+-\s+.+\n?)+)/);
    if (eventsMatch) {
      article.events = eventsMatch[1]
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.replace(/^\s*-\s*/, '').trim())
        .join(', ');
    }
    
    // Parse tags
    const tagsMatch = frontmatter.match(/tags:\s*\[(.+?)\]/);
    if (tagsMatch) {
      article.tags = tagsMatch[1].replace(/['"]/g, '').trim();
    } else {
      article.tags = 'clipping';
    }
    
    // Calculate metrics
    article.word_count = bodyContent.split(/\s+/).filter(w => w.length > 0).length;
    article.line_count = bodyContent.split('\n').filter(l => l.trim().length > 0).length;
    article.has_results = bodyContent.toLowerCase().includes('results') || 
                         bodyContent.toLowerCase().includes('time') ||
                         bodyContent.toLowerCase().includes('winner');
    
    article.permalink = `/articles/${filename}/`;
    article.slug = `/articles/${filename}/`;
    
    articles.push(article);
  }
  
  return articles;
}

async function main() {
  console.log('Reading all markdown files...\n');
  const articles = await getAllMarkdownFiles();
  
  console.log(`Found ${articles.length} articles\n`);
  
  // Save to JSON for manual processing
  await fs.writeFile(
    path.join(__dirname, '..', 'articles-for-airtable.json'),
    JSON.stringify(articles, null, 2)
  );
  
  console.log('Articles data saved to articles-for-airtable.json');
  console.log('\nSample article:');
  console.log(JSON.stringify(articles[0], null, 2));
  
  // Show what needs to be done
  console.log('\n\nNext steps:');
  console.log('1. For each article in Airtable, update with full_content, image_path, permalink, etc.');
  console.log('2. Create new records for articles not in Airtable');
  console.log('\nArticles ready for processing:');
  articles.forEach((a, i) => {
    console.log(`${i+1}. ${a.filename}`);
    console.log(`   Title: ${a.title || '(no title)'}`);
    console.log(`   Words: ${a.word_count}, Has results: ${a.has_results}`);
  });
}

main().catch(console.error);