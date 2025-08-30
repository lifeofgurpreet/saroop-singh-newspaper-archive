#!/bin/bash
# Script to rename PHOTO files to match their corresponding articles

# Change to the project directory
cd "/Users/agent-g/Saroop Singh Project"

echo "Starting systematic renaming of PHOTO files..."
echo "=============================================="

# Array of current filename -> new filename mappings
declare -A renames=(
    ["PHOTO-2025-08-30-21-56-30.jpg"]="1940-02-01_unknown-newspaper_selangor-harriers-expected-strongest-team.jpg"
    ["PHOTO-2025-08-30-21-56-31.jpg"]="1937-07-16_unknown-newspaper_some-good-times-recorded.jpg"
    ["PHOTO-2025-08-30-21-56-33.jpg"]="unknown-date_tribune_mile-race-winners-photo.jpg"
    ["PHOTO-2025-08-30-21-56-34 3.jpg"]="1940-02-07_straits-times_cross-country-race-on-saturday.jpg"
    ["PHOTO-2025-08-30-21-56-34 4.jpg"]="1940-01-27_pinang-gazette-straits-chronicle_six-miles-trial-in-selangor.jpg"
    ["PHOTO-2025-08-30-21-56-36.jpg"]="1937-08-03_straits-times_fmsr-sports-wong-swee-chew-individual-champion.jpg"
    ["PHOTO-2025-08-30-21-56-38 2.jpg"]="unknown-date_unknown-newspaper_malaya-tokyo-olympics-saroop-singh-mention.jpg"
    ["PHOTO-2025-08-30-21-56-40.jpg"]="unknown-date_unknown-newspaper_saroop-singh-half-mile-winner-photo.jpg"
    ["PHOTO-2025-08-30-21-56-41.jpg"]="1937-07-17_unknown-newspaper_selangor-athletic-championships-sikh-runner-record.jpg"
    ["PHOTO-2025-08-30-21-56-41 2.jpg"]="1937-07-18_straits-times_selangor-athletic-meeting-saroop-singh-record.jpg"
    ["PHOTO-2025-08-30-21-56-42.jpg"]="unknown-date_unknown-newspaper_selangor-harriers-for-ipoh-cross-country.jpg"
    ["PHOTO-2025-08-30-21-56-43.jpg"]="1937-02-01_unknown-newspaper_selangor-harriers-compete-ipoh-saroop-singh.jpg"
    ["PHOTO-2025-08-30-21-56-45.jpg"]="1953-06-04_singapore-standard_selangor-hockey.jpg"
    ["PHOTO-2025-08-30-21-56-45 2.jpg"]="1949-12-18_indian-daily-mail_selangor-sikh-sportsmen-singapore-visit.jpg"
    ["PHOTO-2025-08-30-21-56-48.jpg"]="1938-07-24_unknown-newspaper_malayan-aaa-council-olympic-games.jpg"
    ["PHOTO-2025-08-30-21-56-48 2.jpg"]="1940-08-07_straits-times_st-john-ambulance-brigade-sports-saroop-singh.jpg"
    ["PHOTO-2025-08-30-21-56-50 2.jpg"]="1937-07-19_straits-times_saroop-singh-half-mile-winner-state-record-photo.jpg"
    ["PHOTO-2025-08-30-21-56-50 3.jpg"]="1937-07-19_straits-times_selangor-athletic-championships-full-page.jpg"
    ["PHOTO-2025-08-30-21-56-52.jpg"]="1957-07-15_straits-times_sikh-runners-state-record-half-mile.jpg"
    ["PHOTO-2025-08-30-21-56-55.jpg"]="unknown-date_unknown-newspaper_inter-state-athletic-match-seremban.jpg"
    ["PHOTO-2025-08-30-21-56-55 2.jpg"]="unknown-date_unknown-newspaper_saroop-singh-half-mile-record-improvement.jpg"
    ["PHOTO-2025-08-30-21-56-56.jpg"]="unknown-date_unknown-newspaper_athletic-results-saroop-singh-mile.jpg"
)

# Counter for success/failures
success=0
failed=0

# Perform the renames
for old_name in "${!renames[@]}"; do
    new_name="${renames[$old_name]}"
    old_path="raw-files/$old_name"
    new_path="raw-files/$new_name"
    
    echo "Processing: $old_name -> $new_name"
    
    # Check if source file exists
    if [ ! -f "$old_path" ]; then
        echo "  ERROR: Source file does not exist: $old_path"
        ((failed++))
        continue
    fi
    
    # Check if target file already exists
    if [ -f "$new_path" ]; then
        echo "  WARNING: Target file already exists: $new_path"
        echo "  Skipping to avoid overwrite"
        ((failed++))
        continue
    fi
    
    # Perform the rename
    if mv "$old_path" "$new_path"; then
        echo "  SUCCESS: Renamed to $new_name"
        ((success++))
    else
        echo "  ERROR: Failed to rename $old_name"
        ((failed++))
    fi
    echo
done

echo "=============================================="
echo "Renaming complete!"
echo "Success: $success files"
echo "Failed: $failed files"
echo "=============================================="