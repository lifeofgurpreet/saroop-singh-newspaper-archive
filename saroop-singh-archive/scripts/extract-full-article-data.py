#!/usr/bin/env python3
"""
Extract complete data from article markdown files including frontmatter and content
"""

import os
import csv
import yaml
import re
from pathlib import Path
from datetime import datetime

def parse_markdown_file(filepath):
    """Parse markdown file with YAML frontmatter"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract frontmatter
    frontmatter_match = re.match(r'^---\n(.*?)\n---\n(.*)', content, re.DOTALL)
    if not frontmatter_match:
        return None, content
    
    frontmatter_text = frontmatter_match.group(1)
    article_content = frontmatter_match.group(2)
    
    try:
        frontmatter = yaml.safe_load(frontmatter_text)
    except:
        frontmatter = {}
    
    return frontmatter, article_content

def extract_article_data(filepath):
    """Extract all data from an article file"""
    frontmatter, content = parse_markdown_file(filepath)
    if not frontmatter:
        return None
    
    # Extract content metrics
    content_lines = content.strip().split('\n')
    word_count = len(content.split())
    line_count = len(content_lines)
    
    # Extract quoted text (text in quotes)
    quotes = re.findall(r'"([^"]+)"', content)
    
    # Extract results/times mentioned
    times = re.findall(r'\d+\s*(?:mins?|minutes?)\s+\d+(?:\.\d+)?\s*(?:secs?|seconds?)', content)
    times.extend(re.findall(r'\d+:\d+(?:\.\d+)?', content))
    
    # Extract measurements/distances
    distances = re.findall(r'\d+(?:\.\d+)?\s*(?:ft|feet|ins?|inches|yards?|miles?)', content)
    
    # Extract names mentioned (capitalized words)
    names = re.findall(r'\b[A-Z][a-z]+\s+[A-Z][a-z]+\b', content)
    
    # Build comprehensive data record
    data = {
        # File info
        'filename': os.path.basename(filepath),
        'filepath': str(filepath),
        
        # Frontmatter data
        'title': frontmatter.get('title', ''),
        'date': frontmatter.get('date', ''),
        'date_text': frontmatter.get('date_text', ''),
        'publication': frontmatter.get('publication', ''),
        'source': frontmatter.get('source', ''),
        'page': frontmatter.get('page', ''),
        'location': frontmatter.get('location', ''),
        'category': frontmatter.get('category', ''),
        
        # People and events
        'people': '|'.join(frontmatter.get('people', [])) if isinstance(frontmatter.get('people'), list) else frontmatter.get('people', ''),
        'events': '|'.join(frontmatter.get('events', [])) if isinstance(frontmatter.get('events'), list) else frontmatter.get('events', ''),
        'tags': '|'.join(frontmatter.get('tags', [])) if isinstance(frontmatter.get('tags'), list) else frontmatter.get('tags', ''),
        
        # Image reference
        'image': frontmatter.get('image', ''),
        
        # Content metrics
        'word_count': word_count,
        'line_count': line_count,
        'has_results': 'Yes' if times or distances else 'No',
        'num_quotes': len(quotes),
        'num_people_mentioned': len(set(names)),
        
        # Extracted data
        'times_mentioned': '|'.join(times[:5]) if times else '',  # First 5 times
        'distances_mentioned': '|'.join(distances[:5]) if distances else '',  # First 5 distances
        'other_names_mentioned': '|'.join(list(set(names))[:10]) if names else '',  # First 10 unique names
        
        # Content preview
        'first_paragraph': content_lines[0] if content_lines else '',
        'content_snippet': ' '.join(content.split()[:50]) + '...' if word_count > 50 else content,
    }
    
    # Add any extra frontmatter fields not captured above
    for key, value in frontmatter.items():
        if key not in ['title', 'date', 'date_text', 'publication', 'source', 
                       'page', 'location', 'category', 'people', 'events', 'tags', 'image']:
            data[f'meta_{key}'] = str(value)
    
    return data

def main():
    base_dir = Path('/Users/agent-g/Saroop Singh Project/saroop-singh-archive')
    articles_dir = base_dir / 'content/articles/published'
    output_file = base_dir / 'articles-complete-data.csv'
    
    # Collect all markdown files
    articles = sorted(articles_dir.glob('*.md'))
    
    # Extract data from each article
    all_data = []
    failed_files = []
    
    for article_path in articles:
        print(f"Processing: {article_path.name}")
        try:
            data = extract_article_data(article_path)
            if data:
                all_data.append(data)
            else:
                failed_files.append(str(article_path))
        except Exception as e:
            print(f"  Error: {e}")
            failed_files.append(str(article_path))
    
    # Determine all unique fields across all articles
    all_fields = set()
    for data in all_data:
        all_fields.update(data.keys())
    
    # Sort fields for consistent ordering
    fieldnames = sorted(list(all_fields))
    
    # Move important fields to the front
    priority_fields = ['filename', 'title', 'date', 'publication', 'people', 'events', 
                      'location', 'category', 'tags', 'word_count', 'source', 'page']
    fieldnames = [f for f in priority_fields if f in fieldnames] + \
                 [f for f in fieldnames if f not in priority_fields]
    
    # Write comprehensive CSV
    with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(all_data)
    
    # Write detailed summary
    summary_file = base_dir / 'articles-data-summary.txt'
    with open(summary_file, 'w') as f:
        f.write("ARTICLE DATA EXTRACTION SUMMARY\n")
        f.write("=" * 50 + "\n\n")
        f.write(f"Total Articles Processed: {len(all_data)}\n")
        f.write(f"Failed to Process: {len(failed_files)}\n")
        f.write(f"Total Fields Extracted: {len(fieldnames)}\n\n")
        
        # Statistics
        f.write("CONTENT STATISTICS:\n")
        total_words = sum(d.get('word_count', 0) for d in all_data)
        f.write(f"  Total Words: {total_words:,}\n")
        f.write(f"  Average Words per Article: {total_words//len(all_data) if all_data else 0}\n")
        
        articles_with_results = sum(1 for d in all_data if d.get('has_results') == 'Yes')
        f.write(f"  Articles with Race Results: {articles_with_results}\n\n")
        
        # Publications breakdown
        publications = {}
        for d in all_data:
            pub = d.get('publication', 'Unknown')
            publications[pub] = publications.get(pub, 0) + 1
        
        f.write("PUBLICATIONS:\n")
        for pub, count in sorted(publications.items(), key=lambda x: x[1], reverse=True):
            f.write(f"  {pub}: {count}\n")
        
        # People mentioned
        all_people = set()
        for d in all_data:
            people = d.get('people', '').split('|')
            all_people.update(p.strip() for p in people if p.strip())
        
        f.write(f"\nPEOPLE MENTIONED: {len(all_people)}\n")
        for person in sorted(all_people)[:20]:  # First 20
            f.write(f"  - {person}\n")
        
        # Events
        all_events = set()
        for d in all_data:
            events = d.get('events', '').split('|')
            all_events.update(e.strip() for e in events if e.strip())
        
        f.write(f"\nEVENTS COVERED: {len(all_events)}\n")
        for event in sorted(all_events)[:20]:  # First 20
            f.write(f"  - {event}\n")
        
        # Tags
        all_tags = {}
        for d in all_data:
            tags = d.get('tags', '').split('|')
            for tag in tags:
                if tag.strip():
                    all_tags[tag.strip()] = all_tags.get(tag.strip(), 0) + 1
        
        f.write(f"\nTOP TAGS:\n")
        for tag, count in sorted(all_tags.items(), key=lambda x: x[1], reverse=True)[:15]:
            f.write(f"  {tag}: {count}\n")
        
        # Date range
        dates = []
        for d in all_data:
            date_val = d.get('date', '')
            if date_val:
                # Convert to string if it's a date object
                if hasattr(date_val, 'isoformat'):
                    dates.append(date_val.isoformat())
                else:
                    dates.append(str(date_val))
        
        if dates:
            f.write(f"\nDATE RANGE:\n")
            f.write(f"  Earliest: {min(dates)}\n")
            f.write(f"  Latest: {max(dates)}\n")
        
        # Locations
        all_locations = set()
        for d in all_data:
            loc = d.get('location', '').strip()
            if loc:
                all_locations.add(loc)
        
        f.write(f"\nLOCATIONS: {len(all_locations)}\n")
        for loc in sorted(all_locations):
            f.write(f"  - {loc}\n")
        
        if failed_files:
            f.write(f"\nFAILED FILES:\n")
            for filepath in failed_files:
                f.write(f"  - {filepath}\n")
    
    print(f"\n✅ Complete data CSV created: {output_file}")
    print(f"✅ Summary created: {summary_file}")
    print(f"\nExtraction Statistics:")
    print(f"  - Articles processed: {len(all_data)}")
    print(f"  - Total fields extracted: {len(fieldnames)}")
    print(f"  - Total words: {total_words:,}")
    print(f"  - People mentioned: {len(all_people)}")
    print(f"  - Events covered: {len(all_events)}")
    print(f"  - Publications: {len(publications)}")

if __name__ == '__main__':
    main()