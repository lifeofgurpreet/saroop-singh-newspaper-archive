#!/bin/bash
# Script to find PHOTO file matches for duplicates

cd "/Users/agent-g/Saroop Singh Project"

echo "Finding PHOTO file matches for duplicates..."
echo "=============================================="
echo

# Function to get file size
get_file_size() {
    if [ -f "$1" ]; then
        stat -f%z "$1" 2>/dev/null
    else
        echo "0"
    fi
}

# Function to find matching PHOTO file
find_photo_match() {
    local duplicate_file="$1"
    local duplicate_size=$(get_file_size "raw-files/$duplicate_file")
    
    echo "Finding PHOTO match for: $duplicate_file (size: $duplicate_size bytes)"
    
    # Extract the base timestamp from the duplicate filename
    # PHOTO-2025-08-30-21-56-38-duplicate.jpg -> PHOTO-2025-08-30-21-56-38
    local base_pattern=$(echo "$duplicate_file" | sed 's/-duplicate\.jpg$//')
    echo "  Looking for base pattern: $base_pattern"
    
    # Look for the corresponding PHOTO file
    local photo_file="${base_pattern}.jpg"
    if [ -f "raw-files/$photo_file" ]; then
        local photo_size=$(get_file_size "raw-files/$photo_file")
        echo "  Found corresponding PHOTO file: $photo_file (size: $photo_size bytes)"
        
        if [ "$photo_size" -eq "$duplicate_size" ]; then
            echo "  SIZE MATCH: Same size"
            
            # Verify with binary diff
            if diff "raw-files/$photo_file" "raw-files/$duplicate_file" >/dev/null 2>&1; then
                echo "  BINARY MATCH CONFIRMED: Files are identical"
                echo "  RESULT: $duplicate_file is duplicate of $photo_file"
            else
                echo "  BINARY DIFF FAILED: Same size but different content"
                echo "  RESULT: $duplicate_file is NOT identical to $photo_file"
            fi
        else
            echo "  SIZE MISMATCH: Different sizes"
            echo "  RESULT: $duplicate_file is NOT identical to $photo_file"
        fi
    else
        echo "  No corresponding PHOTO file found: $photo_file"
        echo "  RESULT: No base PHOTO file exists"
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

echo "=== PROCESSING ALL DUPLICATE FILES ==="
echo

for duplicate in "${duplicate_files[@]}"; do
    find_photo_match "$duplicate"
done

echo "=============================================="
echo "PHOTO match identification complete!"