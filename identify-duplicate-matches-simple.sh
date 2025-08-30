#!/bin/bash
# Script to identify which canonical file each duplicate matches

cd "/Users/agent-g/Saroop Singh Project"

echo "Identifying matches for each duplicate file..."
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

# Function to find matching canonical file
find_match() {
    local duplicate_file="$1"
    local duplicate_size=$(get_file_size "raw-files/$duplicate_file")
    
    echo "Finding match for: $duplicate_file (size: $duplicate_size bytes)"
    
    # Look for exact size matches first
    local found_match=""
    for canonical_file in raw-files/*.jpg; do
        canonical_basename=$(basename "$canonical_file")
        
        # Skip if this is a duplicate file or PHOTO file
        if [[ "$canonical_basename" == *"duplicate"* ]] || [[ "$canonical_basename" == PHOTO-* ]]; then
            continue
        fi
        
        local canonical_size=$(get_file_size "$canonical_file")
        
        if [ "$canonical_size" -eq "$duplicate_size" ]; then
            echo "  SIZE MATCH: $canonical_basename ($canonical_size bytes)"
            
            # Verify with binary diff
            if diff "$canonical_file" "raw-files/$duplicate_file" >/dev/null 2>&1; then
                echo "  BINARY MATCH CONFIRMED: $canonical_basename"
                found_match="$canonical_basename"
                break
            else
                echo "  BINARY DIFF FAILED: Same size but different content"
            fi
        fi
    done
    
    if [ -z "$found_match" ]; then
        echo "  NO MATCH FOUND for $duplicate_file"
        echo "  RESULT: $duplicate_file -> NO_MATCH"
    else
        echo "  RESULT: $duplicate_file -> $found_match"
        # Extract base name without extension
        base_name="${found_match%.jpg}"
        new_name="${base_name}-duplicate.jpg"
        echo "  RENAME TO: $new_name"
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
    find_match "$duplicate"
done

echo "=============================================="
echo "Match identification complete!"