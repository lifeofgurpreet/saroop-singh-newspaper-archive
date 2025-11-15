#!/usr/bin/env node

const articlesData = require('../articles-data.json');

// Articles already created
const createdArticles = [
  '1940-02-02_straits-times_selangor-harriers-to-compete-at-ipoh',
  '1936-07-18_straits-times_athletic-results-saroop-singh',
  '1937-02-01_unknown-newspaper_selangor-harriers-compete-ipoh-saroop-singh',
  '1937-07-16_unknown-newspaper_some-good-times-recorded'
];

// Get articles that need to be created
const articlesToCreate = articlesData.filter(a => !createdArticles.includes(a.filename));

console.log(`Found ${articlesToCreate.length} articles to create in Airtable\n`);

// Process each article
articlesToCreate.forEach((article, index) => {
  const record = {
    filename: article.filename,
    title: article.title || '',
    date_text: article.date_text || article.date || '',
    location: article.location || '',
    source: article.source || '',
    full_content: article.full_content || '',
    content_snippet: article.content_snippet || '',
    image_path: article.image ? article.image.replace('../../raw-files/', '').replace('../raw-files/', '') : '',
    permalink: article.permalink || `/articles/${article.filename}/`,
    slug: article.permalink || `/articles/${article.filename}/`,
    tags: 'clipping',
    'people-mentioned': article.people || [],
    publication: article.publication || '',
    page: article.page ? parseInt(article.page) : undefined,
    category: article.category || 'athletics',
    events: article.events ? (Array.isArray(article.events) ? article.events.join(', ') : article.events) : '',
    word_count: article.full_content ? article.full_content.split(/\s+/).filter(w => w.length > 0).length : 0,
    line_count: article.full_content ? article.full_content.split('\n').filter(l => l.trim().length > 0).length : 0,
    has_results: article.full_content ? article.full_content.toLowerCase().includes('results') || article.full_content.toLowerCase().includes('time') : false
  };
  
  // Clean up undefined fields
  Object.keys(record).forEach(key => {
    if (record[key] === undefined || record[key] === null) {
      delete record[key];
    }
  });
  
  console.log(`\n${index + 1}. ${article.filename}`);
  console.log(`   Title: ${record.title || '(no title)'}`);
  console.log(`   Date: ${record.date_text}`);
  console.log(`   People: ${record['people-mentioned'].length} mentioned`);
  console.log(`   Ready to create in Airtable`);
});

console.log(`\n\nTotal articles to create: ${articlesToCreate.length}`);
console.log('Use these records with mcp__airtable__create_record');

// Save to file for easy access
const fs = require('fs');
fs.writeFileSync('articles-to-create.json', JSON.stringify(articlesToCreate.map(article => {
  const record = {
    filename: article.filename,
    title: article.title || '',
    date_text: article.date_text || article.date || '',
    location: article.location || '',
    source: article.source || '',
    full_content: article.full_content || '',
    content_snippet: article.content_snippet || '',
    image_path: article.image ? article.image.replace('../../raw-files/', '').replace('../raw-files/', '') : '',
    permalink: article.permalink || `/articles/${article.filename}/`,
    slug: article.permalink || `/articles/${article.filename}/`,
    tags: 'clipping',
    'people-mentioned': article.people || [],
    publication: article.publication || '',
    page: article.page ? parseInt(article.page) : undefined,
    category: article.category || 'athletics',
    events: article.events ? (Array.isArray(article.events) ? article.events.join(', ') : article.events) : '',
    word_count: article.full_content ? article.full_content.split(/\s+/).filter(w => w.length > 0).length : 0,
    line_count: article.full_content ? article.full_content.split('\n').filter(l => l.trim().length > 0).length : 0,
    has_results: article.full_content ? article.full_content.toLowerCase().includes('results') || article.full_content.toLowerCase().includes('time') : false
  };
  
  // Clean up undefined fields
  Object.keys(record).forEach(key => {
    if (record[key] === undefined || record[key] === null) {
      delete record[key];
    }
  });
  
  return record;
}), null, 2));

console.log('\nSaved to articles-to-create.json');