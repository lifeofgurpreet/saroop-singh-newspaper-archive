#!/bin/bash
# Script to analyze potential duplicate files by comparing file sizes

cd "/Users/agent-g/Saroop Singh Project"

echo "Analyzing potential duplicate PHOTO files..."
echo "============================================="
echo

# Function to get file size
get_file_size() {
    if [ -f "$1" ]; then
        stat -f%z "$1" 2>/dev/null
    else
        echo "0"
    fi
}

# Function to compare files
compare_files() {
    local file1="$1"
    local file2="$2"
    local description="$3"
    
    echo "Comparing: $description"
    echo "  File 1: $file1"
    echo "  File 2: $file2"
    
    if [ ! -f "raw-files/$file1" ]; then
        echo "  File 1 does not exist"
        echo
        return
    fi
    
    if [ ! -f "raw-files/$file2" ]; then
        echo "  File 2 does not exist"
        echo
        return
    fi
    
    local size1=$(get_file_size "raw-files/$file1")
    local size2=$(get_file_size "raw-files/$file2")
    
    echo "  Size 1: $size1 bytes"
    echo "  Size 2: $size2 bytes"
    
    if [ "$size1" -eq "$size2" ]; then
        echo "  STATUS: SAME SIZE - Likely duplicates"
        # Use diff to confirm they're identical
        if diff "raw-files/$file1" "raw-files/$file2" >/dev/null 2>&1; then
            echo "  CONFIRMED: Files are identical (binary diff passed)"
        else
            echo "  DIFFERENT: Files have same size but different content"
        fi
    else
        echo "  STATUS: Different sizes - likely not duplicates"
    fi
    echo
}

echo "=== ANALYZING POTENTIAL DUPLICATES ==="
echo

# Compare files with similar timestamps
compare_files "PHOTO-2025-08-30-21-56-38.jpg" "unknown-date_unknown-newspaper_malaya-tokyo-olympics-saroop-singh-mention.jpg" "Base vs processed version of 21:56:38"

compare_files "PHOTO-2025-08-30-21-56-49.jpg" "PHOTO-2025-08-30-21-56-49 2.jpg" "49 vs 49 2"
compare_files "PHOTO-2025-08-30-21-56-49.jpg" "PHOTO-2025-08-30-21-56-49 3.jpg" "49 vs 49 3"
compare_files "PHOTO-2025-08-30-21-56-49 2.jpg" "PHOTO-2025-08-30-21-56-49 3.jpg" "49 2 vs 49 3"

compare_files "PHOTO-2025-08-30-21-56-50.jpg" "1937-07-19_straits-times_saroop-singh-half-mile-winner-state-record-photo.jpg" "50 base vs 50 2 processed"
compare_files "PHOTO-2025-08-30-21-56-50.jpg" "1937-07-19_straits-times_selangor-athletic-championships-full-page.jpg" "50 base vs 50 3 processed"

compare_files "PHOTO-2025-08-30-21-56-52 2.jpg" "1957-07-15_straits-times_sikh-runners-state-record-half-mile.jpg" "52 2 vs 52 processed"
compare_files "PHOTO-2025-08-30-21-56-52 3.jpg" "1957-07-15_straits-times_sikh-runners-state-record-half-mile.jpg" "52 3 vs 52 processed"
compare_files "PHOTO-2025-08-30-21-56-52 2.jpg" "PHOTO-2025-08-30-21-56-52 3.jpg" "52 2 vs 52 3"

compare_files "PHOTO-2025-08-30-21-56-53.jpg" "PHOTO-2025-08-30-21-56-53 2.jpg" "53 vs 53 2"

compare_files "PHOTO-2025-08-30-21-56-54.jpg" "PHOTO-2025-08-30-21-56-54 2.jpg" "54 vs 54 2"
compare_files "PHOTO-2025-08-30-21-56-54.jpg" "PHOTO-2025-08-30-21-56-54 3.jpg" "54 vs 54 3"
compare_files "PHOTO-2025-08-30-21-56-54 2.jpg" "PHOTO-2025-08-30-21-56-54 3.jpg" "54 2 vs 54 3"

compare_files "PHOTO-2025-08-30-21-56-55 3.jpg" "unknown-date_unknown-newspaper_inter-state-athletic-match-seremban.jpg" "55 3 vs 55 processed"
compare_files "PHOTO-2025-08-30-21-56-55 3.jpg" "unknown-date_unknown-newspaper_saroop-singh-half-mile-record-improvement.jpg" "55 3 vs 55 2 processed"

compare_files "PHOTO-2025-08-30-21-56-56 2.jpg" "unknown-date_unknown-newspaper_athletic-results-saroop-singh-mile.jpg" "56 2 vs 56 processed"
compare_files "PHOTO-2025-08-30-21-56-56 3.jpg" "unknown-date_unknown-newspaper_athletic-results-saroop-singh-mile.jpg" "56 3 vs 56 processed"
compare_files "PHOTO-2025-08-30-21-56-56 4.jpg" "unknown-date_unknown-newspaper_athletic-results-saroop-singh-mile.jpg" "56 4 vs 56 processed"
compare_files "PHOTO-2025-08-30-21-56-56 2.jpg" "PHOTO-2025-08-30-21-56-56 3.jpg" "56 2 vs 56 3"
compare_files "PHOTO-2025-08-30-21-56-56 2.jpg" "PHOTO-2025-08-30-21-56-56 4.jpg" "56 2 vs 56 4"
compare_files "PHOTO-2025-08-30-21-56-56 3.jpg" "PHOTO-2025-08-30-21-56-56 4.jpg" "56 3 vs 56 4"

echo "============================================="
echo "Duplicate analysis complete!"