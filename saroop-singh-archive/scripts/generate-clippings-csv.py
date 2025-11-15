#!/usr/bin/env python3
"""
Generate a detailed CSV inventory of newspaper clippings with file metadata
"""

import os
import csv
from pathlib import Path
from datetime import datetime

def parse_filename(filename):
    """Parse structured filename into components"""
    name = filename.replace('.jpg', '')
    parts = name.split('_')
    
    # Handle unknown dates
    if parts[0] == 'unknown-date':
        date = 'Unknown'
        remaining = parts[1:]
    else:
        date = parts[0]
        remaining = parts[1:]
    
    # Extract publication and title
    if len(remaining) >= 2:
        publication = remaining[0].replace('-', ' ').title()
        if publication == 'Unknown Newspaper':
            publication = 'Unknown'
        elif publication == 'Straits Times':
            publication = 'The Straits Times'
        elif publication == 'Singapore Free Press':
            publication = 'Singapore Free Press'
        elif publication == 'Pinang Gazette Straits Chronicle':
            publication = 'Pinang Gazette & Straits Chronicle'
        
        title = ' '.join(remaining[1:]).replace('-', ' ').title()
    else:
        publication = 'Unknown'
        title = ' '.join(remaining).replace('-', ' ').title()
    
    return date, publication, title

def get_file_size_kb(filepath):
    """Get file size in KB"""
    try:
        size_bytes = os.path.getsize(filepath)
        return round(size_bytes / 1024, 1)
    except:
        return 0

def main():
    base_dir = Path('/Users/agent-g/Saroop Singh Project/saroop-singh-archive')
    clippings_dir = base_dir / 'content/media/originals/clippings/saroop-singh'
    output_file = base_dir / 'clippings-inventory-detailed.csv'
    
    # Collect all JPG files
    clippings = sorted(clippings_dir.glob('*.jpg'))
    
    # Prepare CSV data
    csv_data = []
    total_size_mb = 0
    
    for clipping in clippings:
        filename = clipping.name
        date, publication, title = parse_filename(filename)
        size_kb = get_file_size_kb(clipping)
        total_size_mb += size_kb / 1024
        
        # Get file modification time
        mod_time = datetime.fromtimestamp(os.path.getmtime(clipping))
        
        csv_data.append({
            'filename': filename,
            'date': date,
            'publication': publication,
            'title': title,
            'person': 'Saroop Singh',
            'file_path': str(clipping.relative_to(base_dir)),
            'file_size_kb': size_kb,
            'added_date': mod_time.strftime('%Y-%m-%d'),
            'category': 'Athletics' if 'athletic' in title.lower() or 'race' in title.lower() or 'sports' in title.lower() else 'General',
            'has_transcription': 'Yes' if (base_dir / f'content/articles/published/{filename.replace(".jpg", ".md")}').exists() else 'No'
        })
    
    # Write CSV file
    with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = ['filename', 'date', 'publication', 'title', 'person', 
                     'category', 'file_path', 'file_size_kb', 'added_date', 
                     'has_transcription']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        
        writer.writeheader()
        writer.writerows(csv_data)
    
    # Write summary statistics
    summary_file = base_dir / 'clippings-summary.txt'
    with open(summary_file, 'w') as f:
        f.write("NEWSPAPER CLIPPINGS ARCHIVE SUMMARY\n")
        f.write("=" * 40 + "\n\n")
        f.write(f"Total Clippings: {len(csv_data)}\n")
        f.write(f"Total Size: {total_size_mb:.2f} MB\n")
        f.write(f"Average Size: {total_size_mb/len(csv_data)*1024:.1f} KB\n\n")
        
        # Count by publication
        publications = {}
        for item in csv_data:
            pub = item['publication']
            publications[pub] = publications.get(pub, 0) + 1
        
        f.write("By Publication:\n")
        for pub, count in sorted(publications.items(), key=lambda x: x[1], reverse=True):
            f.write(f"  - {pub}: {count}\n")
        
        # Count by decade
        decades = {}
        for item in csv_data:
            if item['date'] != 'Unknown':
                decade = item['date'][:3] + '0s'
                decades[decade] = decades.get(decade, 0) + 1
            else:
                decades['Unknown'] = decades.get('Unknown', 0) + 1
        
        f.write("\nBy Decade:\n")
        for decade, count in sorted(decades.items()):
            f.write(f"  - {decade}: {count}\n")
        
        # Transcription status
        transcribed = sum(1 for item in csv_data if item['has_transcription'] == 'Yes')
        f.write(f"\nTranscription Status:\n")
        f.write(f"  - Transcribed: {transcribed}\n")
        f.write(f"  - Pending: {len(csv_data) - transcribed}\n")
    
    print(f"✅ CSV inventory created: {output_file}")
    print(f"✅ Summary created: {summary_file}")
    print(f"\nStatistics:")
    print(f"  - Total clippings: {len(csv_data)}")
    print(f"  - Total size: {total_size_mb:.2f} MB")
    print(f"  - Publications: {len(publications)}")
    print(f"  - Transcribed: {transcribed}/{len(csv_data)}")

if __name__ == '__main__':
    main()