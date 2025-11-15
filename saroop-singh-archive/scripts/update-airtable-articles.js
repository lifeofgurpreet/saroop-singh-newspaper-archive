#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

// Load articles data
const articlesData = require('../articles-data.json');

// Map to match filenames between Airtable and our data
const filenameMapping = {
  '1940-02-02_straits-times_selangor-harriers-to-compete-at-ipoh': '1940-02-02_straits-times_selangor-harriers-to-compete-at-ipoh',
  'unknown-date_unknown-newspaper_saroop-singh-half-mile-record-improvement': 'unknown-date_unknown-newspaper_saroop-singh-half-mile-record-improvement',
  '1954-11-07_straits-times_johore-police-routed-at-kl-duplicate': '1954-11-07_straits-times_johore-police-routed-at-kl',
  '1937-08-03_singapore-free-press_fmsr-annual-sports': '1937-08-03_singapore-free-press_fmsr-annual-sports'
};

async function updateAirtableArticles() {
  console.log('Preparing Airtable article updates...\n');
  
  const updates = [];
  
  for (const article of articlesData) {
    // Prepare update record
    const update = {
      filename: article.filename,
      fields: {
        title: article.title || '',
        date_text: article.date_text || article.date || '',
        location: article.location || '',
        source: article.source || '',
        full_content: article.full_content || '',
        content_snippet: article.content_snippet || '',
        image_path: article.image || '',
        permalink: article.permalink || `/articles/${article.filename}/`,
        slug: `/articles/${article.filename}/`,
        tags: Array.isArray(article.tags) ? article.tags.join(', ') : (article.tags || 'clipping'),
        'people-mentioned': Array.isArray(article.people) ? article.people : []
      }
    };
    
    // Add optional fields if they exist
    if (article.publication) update.fields.publication = article.publication;
    if (article.page) update.fields.page = article.page;
    if (article.category) update.fields.category = article.category;
    if (article.events) update.fields.events = Array.isArray(article.events) ? article.events.join(', ') : article.events;
    
    // Calculate word count and line count from full content
    if (article.full_content) {
      const words = article.full_content.split(/\s+/).filter(w => w.length > 0);
      update.fields.word_count = words.length;
      
      const lines = article.full_content.split('\n').filter(l => l.trim().length > 0);
      update.fields.line_count = lines.length;
    }
    
    updates.push(update);
  }
  
  // Save updates to file for review
  const outputPath = path.join(__dirname, '..', 'airtable-article-updates.json');
  await fs.writeFile(outputPath, JSON.stringify(updates, null, 2));
  
  console.log(`Prepared ${updates.length} article updates`);
  console.log(`Updates saved to: ${outputPath}`);
  
  // Print summary
  console.log('\nSummary:');
  console.log(`- Total articles: ${articlesData.length}`);
  console.log(`- Articles with titles: ${articlesData.filter(a => a.title).length}`);
  console.log(`- Articles with dates: ${articlesData.filter(a => a.date_text || a.date).length}`);
  console.log(`- Articles with full content: ${articlesData.filter(a => a.full_content).length}`);
  console.log(`- Articles with people: ${articlesData.filter(a => a.people && a.people.length > 0).length}`);
  
  // Show first 3 articles as examples
  console.log('\nExample articles to be updated:');
  updates.slice(0, 3).forEach(update => {
    console.log(`\n- ${update.filename}`);
    console.log(`  Title: ${update.fields.title}`);
    console.log(`  Date: ${update.fields.date_text}`);
    console.log(`  People: ${update.fields['people-mentioned'].join(', ')}`);
    console.log(`  Word count: ${update.fields.word_count}`);
  });
}

updateAirtableArticles().catch(console.error);