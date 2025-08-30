#!/bin/bash

# Add layout and permalink to all article markdown files

for file in output/articles/*.md; do
    if [ -f "$file" ]; then
        # Get the base filename without extension
        basename=$(basename "$file" .md)
        
        # Check if the file already has layout in front matter
        if ! grep -q "^layout:" "$file"; then
            echo "Processing $file..."
            
            # Create a temporary file with the updated front matter
            {
                head -1 "$file"  # First line (---)
                echo "layout: article"
                echo "permalink: /articles/$basename/"
                tail -n +2 "$file"  # Rest of the file
            } > "$file.tmp"
            
            mv "$file.tmp" "$file"
        fi
    fi
done

echo "Done! Added layout and permalink to all article files."