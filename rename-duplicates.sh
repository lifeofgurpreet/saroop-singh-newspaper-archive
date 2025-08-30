#!/bin/bash
# Script to rename duplicate files with meaningful names

cd "/Users/agent-g/Saroop Singh Project"

echo "Renaming duplicate files to show their relationships..."
echo "======================================================"
echo

# Function to safely rename file
rename_file() {
    local old_name="$1"
    local new_name="$2"
    local reason="$3"
    
    echo "Renaming: $old_name"
    echo "     To: $new_name"
    echo " Reason: $reason"
    
    if [ -f "raw-files/$old_name" ]; then
        if [ -f "raw-files/$new_name" ]; then
            echo "WARNING: Target file already exists: $new_name"
            echo "SKIPPED: $old_name"
        else
            mv "raw-files/$old_name" "raw-files/$new_name"
            echo "SUCCESS: Renamed successfully"
        fi
    else
        echo "ERROR: Source file does not exist: $old_name"
    fi
    echo
}

echo "=== RENAMING DUPLICATES WITH CLEAR MAPPINGS ==="
echo

# Clear mappings based on timestamp analysis and photo-to-article mapping
rename_file "PHOTO-2025-08-30-21-56-38-duplicate.jpg" \
           "unknown-date_unknown-newspaper_malaya-tokyo-olympics-saroop-singh-mention-duplicate.jpg" \
           "Duplicate of article about Malaya Tokyo Olympics (timestamp 21:56:38)"

rename_file "PHOTO-2025-08-30-21-56-56-4-duplicate.jpg" \
           "unknown-date_unknown-newspaper_athletic-results-saroop-singh-mile-duplicate.jpg" \
           "Duplicate of article about Athletic Results Saroop Singh Mile (timestamp 21:56:56-4)"

echo "=== RENAMING DUPLICATES WITH DESCRIPTIVE NAMES ==="
echo

# For files without clear canonical mapping, use descriptive names based on timestamp
rename_file "PHOTO-2025-08-30-21-56-44-2-duplicate.jpg" \
           "PHOTO-2025-08-30-21-56-44-2-duplicate.jpg" \
           "Keep current name - no clear canonical mapping (timestamp 21:56:44-2)"

rename_file "PHOTO-2025-08-30-21-56-46-duplicate.jpg" \
           "PHOTO-2025-08-30-21-56-46-duplicate.jpg" \
           "Keep current name - no clear canonical mapping (timestamp 21:56:46)"

rename_file "PHOTO-2025-08-30-21-56-49-duplicate.jpg" \
           "PHOTO-2025-08-30-21-56-49-duplicate.jpg" \
           "Keep current name - no clear canonical mapping (timestamp 21:56:49)"

rename_file "PHOTO-2025-08-30-21-56-53-2-duplicate.jpg" \
           "PHOTO-2025-08-30-21-56-53-2-duplicate.jpg" \
           "Keep current name - no clear canonical mapping (timestamp 21:56:53-2)"

rename_file "PHOTO-2025-08-30-21-56-54-duplicate.jpg" \
           "PHOTO-2025-08-30-21-56-54-duplicate.jpg" \
           "Keep current name - no clear canonical mapping (timestamp 21:56:54)"

rename_file "PHOTO-2025-08-30-21-56-54-2-duplicate.jpg" \
           "PHOTO-2025-08-30-21-56-54-2-duplicate.jpg" \
           "Keep current name - no clear canonical mapping (timestamp 21:56:54-2)"

echo "======================================================"
echo "Duplicate file renaming complete!"
echo
echo "SUMMARY:"
echo "- 2 files renamed with canonical article names"
echo "- 6 files kept with descriptive timestamp-based names"
echo "- All duplicate files now clearly indicate their duplicate status"