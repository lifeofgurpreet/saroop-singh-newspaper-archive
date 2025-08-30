#!/bin/bash
# Script to map duplicate files to articles based on timestamps

cd "/Users/agent-g/Saroop Singh Project"

echo "Mapping duplicate files to articles based on timestamp analysis..."
echo "=================================================================="
echo

# Based on the photo-to-article-mapping.md, these are the known mappings:
# We need to find which article each duplicate corresponds to based on timestamp patterns

map_duplicate_to_article() {
    local duplicate_file="$1"
    local duplicate_size=$(get_file_size "raw-files/$duplicate_file")
    
    echo "=== MAPPING: $duplicate_file ==="
    echo "Size: $duplicate_size bytes"
    
    case "$duplicate_file" in
        "PHOTO-2025-08-30-21-56-38-duplicate.jpg")
            # From mapping: PHOTO-2025-08-30-21-56-38 2.jpg -> unknown-date_unknown-newspaper_malaya-tokyo-olympics-saroop-singh-mention
            echo "Based on timestamp 21:56:38, this likely corresponds to:"
            echo "  Article: unknown-date_unknown-newspaper_malaya-tokyo-olympics-saroop-singh-mention"
            echo "  Canonical file: unknown-date_unknown-newspaper_malaya-tokyo-olympics-saroop-singh-mention.jpg"
            echo "  New name: unknown-date_unknown-newspaper_malaya-tokyo-olympics-saroop-singh-mention-duplicate.jpg"
            ;;
        "PHOTO-2025-08-30-21-56-44-2-duplicate.jpg")
            # This has a "-2" which might indicate it's a variant
            echo "Based on timestamp 21:56:44-2, this might be a variant. No clear mapping found."
            echo "  Suggested name: PHOTO-2025-08-30-21-56-44-2-duplicate.jpg (keep as is for now)"
            ;;
        "PHOTO-2025-08-30-21-56-46-duplicate.jpg")
            # From mapping: No direct 46 mapping found
            echo "Based on timestamp 21:56:46, this might be an unmapped file."
            echo "  Suggested name: PHOTO-2025-08-30-21-56-46-duplicate.jpg (keep as is for now)"
            ;;
        "PHOTO-2025-08-30-21-56-49-duplicate.jpg")
            # This might correspond to one of the 49 variants
            echo "Based on timestamp 21:56:49, this might correspond to unmapped PHOTO files."
            echo "  Suggested name: PHOTO-2025-08-30-21-56-49-duplicate.jpg (keep as is for now)"
            ;;
        "PHOTO-2025-08-30-21-56-53-2-duplicate.jpg")
            # This has -2 suffix
            echo "Based on timestamp 21:56:53-2, this might be a variant. No clear mapping found."
            echo "  Suggested name: PHOTO-2025-08-30-21-56-53-2-duplicate.jpg (keep as is for now)"
            ;;
        "PHOTO-2025-08-30-21-56-54-2-duplicate.jpg")
            # This has -2 suffix  
            echo "Based on timestamp 21:56:54-2, this might be a variant. No clear mapping found."
            echo "  Suggested name: PHOTO-2025-08-30-21-56-54-2-duplicate.jpg (keep as is for now)"
            ;;
        "PHOTO-2025-08-30-21-56-54-duplicate.jpg")
            # Base 54 timestamp
            echo "Based on timestamp 21:56:54, this might be an unmapped file."
            echo "  Suggested name: PHOTO-2025-08-30-21-56-54-duplicate.jpg (keep as is for now)"
            ;;
        "PHOTO-2025-08-30-21-56-56-4-duplicate.jpg")
            # From mapping: PHOTO-2025-08-30-21-56-56.jpg -> unknown-date_unknown-newspaper_athletic-results-saroop-singh-mile
            # The -4 suffix indicates this is the 4th variant
            echo "Based on timestamp 21:56:56-4, this likely corresponds to:"
            echo "  Article: unknown-date_unknown-newspaper_athletic-results-saroop-singh-mile"
            echo "  Canonical file: unknown-date_unknown-newspaper_athletic-results-saroop-singh-mile.jpg"
            echo "  New name: unknown-date_unknown-newspaper_athletic-results-saroop-singh-mile-duplicate.jpg"
            ;;
        *)
            echo "  No mapping found for this file."
            ;;
    esac
    echo
}

# Function to get file size
get_file_size() {
    if [ -f "$1" ]; then
        stat -f%z "$1" 2>/dev/null
    else
        echo "0"
    fi
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
    map_duplicate_to_article "$duplicate"
done

echo "=================================================================="
echo "Mapping analysis complete!"
echo
echo "SUMMARY OF RECOMMENDED RENAMES:"
echo "1. PHOTO-2025-08-30-21-56-38-duplicate.jpg -> unknown-date_unknown-newspaper_malaya-tokyo-olympics-saroop-singh-mention-duplicate.jpg"
echo "2. PHOTO-2025-08-30-21-56-56-4-duplicate.jpg -> unknown-date_unknown-newspaper_athletic-results-saroop-singh-mile-duplicate.jpg"
echo "3. Others: Keep current names as no clear canonical mapping exists"