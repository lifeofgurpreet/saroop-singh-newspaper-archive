#!/usr/bin/env node

const toCreate = require('../to-create.json');

// Skip the first one we already created
const remaining = toCreate.slice(1);

console.log(`Preparing to create ${remaining.length} articles in Airtable\n`);

// Group into batches for easier processing
const batchSize = 5;
const batches = [];
for (let i = 0; i < remaining.length; i += batchSize) {
  batches.push(remaining.slice(i, i + batchSize));
}

console.log(`Split into ${batches.length} batches of up to ${batchSize} articles each\n`);

// Output each batch
batches.forEach((batch, index) => {
  console.log(`\nBatch ${index + 1} (${batch.length} articles):`);
  console.log('=' + '='.repeat(50));
  
  batch.forEach(article => {
    console.log(`\n${article.filename}`);
    console.log(`  Title: ${article.title || '(no title)'}`);
    console.log(`  Date: ${article.date_text || '(no date)'}`);
    console.log(`  Source: ${article.source || '(no source)'}`);
    console.log(`  People: ${article['people-mentioned']?.length || 0} mentioned`);
    console.log(`  Ready to create`);
  });
});

// Save batches for processing
const fs = require('fs');
batches.forEach((batch, index) => {
  fs.writeFileSync(`batch-${index + 1}.json`, JSON.stringify(batch, null, 2));
  console.log(`\nSaved batch-${index + 1}.json with ${batch.length} articles`);
});

console.log('\n\nAll batches prepared for creation via MCP tools');