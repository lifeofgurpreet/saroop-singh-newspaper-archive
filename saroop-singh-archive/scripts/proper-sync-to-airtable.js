#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

// Map publication names to Airtable's limited options
function mapPublication(source) {
  if (!source) return 'Unknown Newspaper';
  
  if (source.toLowerCase().includes('straits times')) {
    return 'The Straits Times';
  } else if (source.toLowerCase().includes('unknown') || 
             source.toLowerCase().includes('not visible') ||
             source.toLowerCase().includes('newspaper not visible')) {
    return 'Unknown Newspaper';
  }
  // For all other publications, we'll return Unknown Newspaper
  // but keep the full name in the source field
  return 'Unknown Newspaper';
}

// Map location to Airtable's options
function mapLocation(location) {
  const validLocations = ['Singapore', 'Kuala Lumpur', 'Selangor', 'Seremban', 'Ipoh', 'Malaysia'];
  
  if (!location) return '(location not visible)';
  
  // Check if it's one of the valid locations
  for (const valid of validLocations) {
    if (location.toLowerCase().includes(valid.toLowerCase())) {
      return valid;
    }
  }
  
  if (location.toLowerCase().includes('not visible')) {
    return '(location not visible)';
  }
  
  // Default to the location as-is if it matches exactly
  if (validLocations.includes(location)) {
    return location;
  }
  
  return 'Location not visible';
}

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
    
    // Date handling - convert to YYYY-MM-DD format for Airtable
    const dateMatch = frontmatter.match(/date_text:\s*(.+)$/m) || frontmatter.match(/date:\s*(.+)$/m);
    if (dateMatch) {
      const dateStr = dateMatch[1].trim();
      // Try to parse different date formats
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        article.date_text = dateStr;
      } else if (dateStr.match(/^\d{1,2}\s+\w+\s+\d{4}$/)) {
        // e.g., "17 June 1938" or "3 Aug 1937"
        const parts = dateStr.split(/\s+/);
        const months = {
          'January': '01', 'February': '02', 'March': '03', 'April': '04',
          'May': '05', 'June': '06', 'July': '07', 'August': '08', 'Aug': '08',
          'September': '09', 'October': '10', 'November': '11', 'December': '12',
          'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'Jun': '06',
          'Jul': '07', 'Sep': '09', 'Sept': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
        };
        const day = parts[0].padStart(2, '0');
        const month = months[parts[1]] || '01';
        const year = parts[2];
        article.date_text = `${year}-${month}-${day}`;
      } else {
        // Try to extract year at least
        const yearMatch = dateStr.match(/\d{4}/);
        if (yearMatch) {
          article.date_text = `${yearMatch[0]}-01-01`;
        }
      }
    }
    
    // Source field - keep full publication info here
    const sourceMatch = frontmatter.match(/source:\s*(.+)$/m);
    if (sourceMatch) {
      article.source = sourceMatch[1].trim();
      // Map to publication field's limited options
      article.publication = mapPublication(article.source);
    }
    
    const locationMatch = frontmatter.match(/location:\s*(.+)$/m);
    if (locationMatch) {
      article.location = mapLocation(locationMatch[1].trim());
    }
    
    const pageMatch = frontmatter.match(/page:\s*(\d+)$/m);
    if (pageMatch) article.page = parseInt(pageMatch[1]);
    
    const categoryMatch = frontmatter.match(/category:\s*(.+)$/m);
    if (categoryMatch) {
      const cat = categoryMatch[1].trim();
      // Map to valid categories
      if (cat === 'athletics' || cat === 'sports') {
        article.category = 'athletics';
      } else if (cat === 'community') {
        article.category = 'community';
      } else {
        article.category = 'athletics'; // default
      }
    } else {
      article.category = 'athletics'; // default
    }
    
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
        .map(line => line.replace(/^\s*-\s*/, '').trim())
        .filter(p => p.length > 0);
    } else {
      article['people-mentioned'] = [];
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
    
    // Tags - just use 'clipping' as default since it's single select
    article.tags = 'clipping';
    
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
  console.log('Reading all markdown files and preparing for Airtable sync...\n');
  const articles = await getAllMarkdownFiles();
  
  console.log(`Found ${articles.length} articles\n`);
  
  // Save to JSON for processing
  await fs.writeFile(
    path.join(__dirname, '..', 'airtable-ready-data.json'),
    JSON.stringify(articles, null, 2)
  );
  
  console.log('Data prepared and saved to airtable-ready-data.json');
  console.log('\nKey mappings applied:');
  console.log('- Publication field: Maps to "The Straits Times", "Unknown Newspaper", or blank');
  console.log('- Source field: Preserves full publication name and page info');
  console.log('- Location field: Maps to valid Airtable options');
  console.log('- Date field: Converted to YYYY-MM-DD format');
  console.log('- Category: Defaults to "athletics"');
  console.log('- Tags: Set to "clipping"');
  
  console.log('\n\nSample articles ready for Airtable:');
  articles.slice(0, 3).forEach((a, i) => {
    console.log(`\n${i+1}. ${a.filename}`);
    console.log(`   Title: ${a.title || '(no title)'}`);
    console.log(`   Date: ${a.date_text || '(no date)'}`);
    console.log(`   Source: ${a.source || '(no source)'}`);
    console.log(`   Publication (mapped): ${a.publication || '(none)'}`);
    console.log(`   Location (mapped): ${a.location || '(none)'}`);
    console.log(`   People: ${a['people-mentioned']?.length || 0} mentioned`);
    console.log(`   Words: ${a.word_count}`);
  });
  
  // List articles by update/create status
  const existingInAirtable = [
    '1937-08-03_singapore-free-press_fmsr-annual-sports',
    '1937-08-03_straits-times_fmsr-sports-wong-swee-chew-individual-champion',
    '1937-07-16_unknown-newspaper_some-good-times-recorded',
    '1937-07-24_morning-tribune_half-mile-record',
    '1937-07-17_singapore-free-press_selangor-aa-meeting-opens',
    '1937-07-19_straits-times_selangor-athletic-championships-full-page',
    '1937-07-17_unknown-newspaper_selangor-athletic-championships-sikh-runner-record',
    '1937-07-24_morning-tribune_half-mile-record-broken-at-selangor-aaa-meet',
    '1940-02-02_straits-times_selangor-harriers-to-compete-at-ipoh',
    '1936-07-18_straits-times_athletic-results-saroop-singh',
    '1937-02-01_unknown-newspaper_selangor-harriers-compete-ipoh-saroop-singh'
  ];
  
  const toUpdate = articles.filter(a => existingInAirtable.includes(a.filename));
  const toCreate = articles.filter(a => !existingInAirtable.includes(a.filename));
  
  console.log(`\n\nStatus:`);
  console.log(`- Records to UPDATE: ${toUpdate.length}`);
  console.log(`- Records to CREATE: ${toCreate.length}`);
  console.log(`- TOTAL: ${articles.length}`);
}

main().catch(console.error);