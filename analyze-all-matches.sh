#!/bin/bash
# Script to analyze all possible matches for duplicates

cd "/Users/agent-g/Saroop Singh Project"

echo "Analyzing all possible matches for duplicate files..."
echo "====================================================="
echo

# Function to get file size
get_file_size() {
    if [ -f "$1" ]; then
        stat -f%z "$1" 2>/dev/null
    else
        echo "0"
    fi
}

# Function to analyze a duplicate file
analyze_duplicate() {
    local duplicate_file="$1"
    local duplicate_size=$(get_file_size "raw-files/$duplicate_file")
    
    echo "=== ANALYZING: $duplicate_file ==="
    echo "Size: $duplicate_size bytes"
    echo
    echo "Checking against ALL files in raw-files:"
    
    # Check against all files
    local matches_found=0
    for file in raw-files/*.jpg; do
        filename=$(basename "$file")
        
        # Skip the duplicate file itself
        if [ "$filename" = "$duplicate_file" ]; then
            continue
        fi
        
        local file_size=$(get_file_size "$file")
        
        if [ "$file_size" -eq "$duplicate_size" ]; then
            echo "  SIZE MATCH: $filename ($file_size bytes)"
            
            # Verify with binary diff
            if diff "$file" "raw-files/$duplicate_file" >/dev/null 2>&1; then
                echo "  *** EXACT BINARY MATCH: $filename ***"
                matches_found=$((matches_found + 1))
            else
                echo "  SIZE MATCH but different content: $filename"
            fi
        fi
    done
    
    if [ $matches_found -eq 0 ]; then
        echo "  NO EXACT MATCHES FOUND"
    else
        echo "  TOTAL EXACT MATCHES: $matches_found"
    fi
    
    echo
}

# Process each duplicate file
duplicate_files=(
    "PHOTO-2025-08-30-21-56-38-duplicate.jpg"
    "PHOTO-2025-08-30-21-56-44-2-duplicate.jpg"
    "PHOTO-2025-08-30-21-56-46-duplicate.jpg"
    "PHOTO-2025-08-30-21-56-49-duplicate.jpg"
    "PHOTO-2025-08-30-21-56-53-2-duplicate.jpg"
    "PHOTO-2025-08-30-21-56-54-2-duplicate.jpg"
    "PHOTO-2025-08-30-21-56-54-duplicate.jpg"
    "PHOTO-2025-08-30-21-56-56-4-duplicate.jpg"
)

for duplicate in "${duplicate_files[@]}"; do
    analyze_duplicate "$duplicate"
done

echo "====================================================="
echo "Complete analysis finished!"