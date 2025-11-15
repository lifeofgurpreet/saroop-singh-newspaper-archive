#!/usr/bin/env node

const data = require('../airtable-ready-data.json');

// Records we know exist in Airtable with their IDs
const existingRecords = {
  '1937-08-03_singapore-free-press_fmsr-annual-sports': 'rec7B9dA7czIwliBO', // Already updated
  '1937-08-03_straits-times_fmsr-sports-wong-swee-chew-individual-champion': 'rec9Bk0jskKHWUbB0',
  '1937-07-16_unknown-newspaper_some-good-times-recorded': 'recLotopQJTac84ex', // Already has full_content
  '1937-07-24_morning-tribune_half-mile-record': 'recTu4BoKrPWGnAmA',
  '1937-07-17_singapore-free-press_selangor-aa-meeting-opens': 'recbwBuipmYg9gCne', // Already updated
  '1937-07-19_straits-times_selangor-athletic-championships-full-page': 'recfCL3bChgkuhHTE',
  '1937-07-17_unknown-newspaper_selangor-athletic-championships-sikh-runner-record': 'recfk4jovtuBS9UYU',
  '1937-07-24_morning-tribune_half-mile-record-broken-at-selangor-aaa-meet': 'reckV2nag41tsZcqI',
  '1937-07-16_unknown-newspaper_some-good-times-recorded-duplicate': 'recfmtfdb3LrqsrX1', // Duplicate
  '1940-02-02_straits-times_selangor-harriers-to-compete-at-ipoh': 'rec24CDKIy82UYNUU', // Already updated
  '1936-07-18_straits-times_athletic-results-saroop-singh': 'rec0vQe5mLARJNtbF', // Already created
  '1937-02-01_unknown-newspaper_selangor-harriers-compete-ipoh-saroop-singh': 'recn6LvnFyya2zrDh' // Already created
};

// Skip these as they're already properly updated
const skipUpdate = [
  '1937-08-03_singapore-free-press_fmsr-annual-sports',
  '1937-07-17_singapore-free-press_selangor-aa-meeting-opens',
  '1940-02-02_straits-times_selangor-harriers-to-compete-at-ipoh',
  '1936-07-18_straits-times_athletic-results-saroop-singh',
  '1937-02-01_unknown-newspaper_selangor-harriers-compete-ipoh-saroop-singh',
  '1937-07-16_unknown-newspaper_some-good-times-recorded' // Already has full_content
];

console.log('Articles to sync with Airtable:\n');

// Articles that need updating
const toUpdate = data.filter(a => {
  return existingRecords[a.filename] && !skipUpdate.includes(a.filename);
});

console.log(`UPDATES NEEDED (${toUpdate.length}):`);
toUpdate.forEach(article => {
  const recordId = existingRecords[article.filename];
  console.log(`\n- ${article.filename}`);
  console.log(`  Record ID: ${recordId}`);
  console.log(`  Title: ${article.title || '(no title)'}`);
  console.log(`  Source: ${article.source || '(no source)'}`);
  console.log(`  Ready to update with full content`);
});

// Articles that need creating
const toCreate = data.filter(a => !existingRecords[a.filename]);

console.log(`\n\nNEW RECORDS TO CREATE (${toCreate.length}):`);
toCreate.slice(0, 10).forEach(article => {
  console.log(`\n- ${article.filename}`);
  console.log(`  Title: ${article.title || '(no title)'}`);
  console.log(`  Date: ${article.date_text || '(no date)'}`);
  console.log(`  Source: ${article.source || '(no source)'}`);
});

if (toCreate.length > 10) {
  console.log(`\n... and ${toCreate.length - 10} more`);
}

// Generate update commands
console.log('\n\n=== UPDATE COMMANDS ===\n');
toUpdate.forEach(article => {
  const recordId = existingRecords[article.filename];
  console.log(`Update record ${recordId} for ${article.filename}`);
  console.log('Fields to update: full_content, image_path, permalink, source, events, etc.\n');
});

// Generate create commands
console.log('\n=== CREATE COMMANDS ===\n');
console.log(`Create ${toCreate.length} new records with all fields from markdown\n`);

// Save for processing
const fs = require('fs');
fs.writeFileSync('to-update.json', JSON.stringify(toUpdate.map(a => ({
  id: existingRecords[a.filename],
  fields: a
})), null, 2));

fs.writeFileSync('to-create.json', JSON.stringify(toCreate, null, 2));

console.log('\nData saved to:');
console.log('- to-update.json (records to update)');
console.log('- to-create.json (records to create)');