#!/bin/bash
# Script to update article image references to match the new filenames

cd "/Users/agent-g/Saroop Singh Project"

echo "Starting systematic update of article image references..."
echo "========================================================="

# Counter for success/failures
success=0
failed=0

# Function to update an article file
update_article() {
    local article_file="$1"
    local old_photo="$2"
    local new_photo="$3"
    
    echo "Updating: $article_file"
    echo "  Old ref: $old_photo"
    echo "  New ref: $new_photo"
    
    # Check if article file exists
    if [ ! -f "$article_file" ]; then
        echo "  ERROR: Article file does not exist: $article_file"
        ((failed++))
        return
    fi
    
    # Create a backup
    cp "$article_file" "$article_file.backup"
    
    # Update both frontmatter image reference and content image reference
    sed -i '' "s|$old_photo|$new_photo|g" "$article_file"
    
    # Check if the replacement was successful
    if grep -q "$new_photo" "$article_file"; then
        echo "  SUCCESS: Updated references to $new_photo"
        rm "$article_file.backup"  # Remove backup since update was successful
        ((success++))
    else
        echo "  ERROR: Failed to update references"
        mv "$article_file.backup" "$article_file"  # Restore from backup
        ((failed++))
    fi
    echo
}

# Update all the articles
update_article "output/articles/1940-02-01_unknown-newspaper_selangor-harriers-expected-strongest-team.md" "PHOTO-2025-08-30-21-56-30.jpg" "1940-02-01_unknown-newspaper_selangor-harriers-expected-strongest-team.jpg"
update_article "output/articles/1937-07-16_unknown-newspaper_some-good-times-recorded.md" "PHOTO-2025-08-30-21-56-31.jpg" "1937-07-16_unknown-newspaper_some-good-times-recorded.jpg"
update_article "output/articles/unknown-date_tribune_mile-race-winners-photo.md" "PHOTO-2025-08-30-21-56-33.jpg" "unknown-date_tribune_mile-race-winners-photo.jpg"
update_article "output/articles/1940-02-07_straits-times_cross-country-race-on-saturday.md" "PHOTO-2025-08-30-21-56-34 3.jpg" "1940-02-07_straits-times_cross-country-race-on-saturday.jpg"
update_article "output/articles/1940-01-27_pinang-gazette-straits-chronicle_six-miles-trial-in-selangor.md" "PHOTO-2025-08-30-21-56-34 4.jpg" "1940-01-27_pinang-gazette-straits-chronicle_six-miles-trial-in-selangor.jpg"
update_article "output/articles/1937-08-03_straits-times_fmsr-sports-wong-swee-chew-individual-champion.md" "PHOTO-2025-08-30-21-56-36.jpg" "1937-08-03_straits-times_fmsr-sports-wong-swee-chew-individual-champion.jpg"
update_article "output/articles/unknown-date_unknown-newspaper_malaya-tokyo-olympics-saroop-singh-mention.md" "PHOTO-2025-08-30-21-56-38 2.jpg" "unknown-date_unknown-newspaper_malaya-tokyo-olympics-saroop-singh-mention.jpg"
update_article "output/articles/unknown-date_unknown-newspaper_saroop-singh-half-mile-winner-photo.md" "PHOTO-2025-08-30-21-56-40.jpg" "unknown-date_unknown-newspaper_saroop-singh-half-mile-winner-photo.jpg"
update_article "output/articles/1937-07-17_unknown-newspaper_selangor-athletic-championships-sikh-runner-record.md" "PHOTO-2025-08-30-21-56-41.jpg" "1937-07-17_unknown-newspaper_selangor-athletic-championships-sikh-runner-record.jpg"
update_article "output/articles/1937-07-18_straits-times_selangor-athletic-meeting-saroop-singh-record.md" "PHOTO-2025-08-30-21-56-41 2.jpg" "1937-07-18_straits-times_selangor-athletic-meeting-saroop-singh-record.jpg"
update_article "output/articles/unknown-date_unknown-newspaper_selangor-harriers-for-ipoh-cross-country.md" "PHOTO-2025-08-30-21-56-42.jpg" "unknown-date_unknown-newspaper_selangor-harriers-for-ipoh-cross-country.jpg"
update_article "output/articles/1937-02-01_unknown-newspaper_selangor-harriers-compete-ipoh-saroop-singh.md" "PHOTO-2025-08-30-21-56-43.jpg" "1937-02-01_unknown-newspaper_selangor-harriers-compete-ipoh-saroop-singh.jpg"
update_article "output/articles/1953-06-04_singapore-standard_selangor-hockey.md" "PHOTO-2025-08-30-21-56-45.jpg" "1953-06-04_singapore-standard_selangor-hockey.jpg"
update_article "output/articles/1949-12-18_indian-daily-mail_selangor-sikh-sportsmen-singapore-visit.md" "PHOTO-2025-08-30-21-56-45 2.jpg" "1949-12-18_indian-daily-mail_selangor-sikh-sportsmen-singapore-visit.jpg"
update_article "output/articles/1938-07-24_unknown-newspaper_malayan-aaa-council-olympic-games.md" "PHOTO-2025-08-30-21-56-48.jpg" "1938-07-24_unknown-newspaper_malayan-aaa-council-olympic-games.jpg"
update_article "output/articles/1940-08-07_straits-times_st-john-ambulance-brigade-sports-saroop-singh.md" "PHOTO-2025-08-30-21-56-48 2.jpg" "1940-08-07_straits-times_st-john-ambulance-brigade-sports-saroop-singh.jpg"
update_article "output/articles/1937-07-19_straits-times_saroop-singh-half-mile-winner-state-record-photo.md" "PHOTO-2025-08-30-21-56-50 2.jpg" "1937-07-19_straits-times_saroop-singh-half-mile-winner-state-record-photo.jpg"
update_article "output/articles/1937-07-19_straits-times_selangor-athletic-championships-full-page.md" "PHOTO-2025-08-30-21-56-50 3.jpg" "1937-07-19_straits-times_selangor-athletic-championships-full-page.jpg"
update_article "output/articles/1957-07-15_straits-times_sikh-runners-state-record-half-mile.md" "PHOTO-2025-08-30-21-56-52.jpg" "1957-07-15_straits-times_sikh-runners-state-record-half-mile.jpg"
update_article "output/articles/unknown-date_unknown-newspaper_inter-state-athletic-match-seremban.md" "PHOTO-2025-08-30-21-56-55.jpg" "unknown-date_unknown-newspaper_inter-state-athletic-match-seremban.jpg"
update_article "output/articles/unknown-date_unknown-newspaper_saroop-singh-half-mile-record-improvement.md" "PHOTO-2025-08-30-21-56-55 2.jpg" "unknown-date_unknown-newspaper_saroop-singh-half-mile-record-improvement.jpg"
update_article "output/articles/unknown-date_unknown-newspaper_athletic-results-saroop-singh-mile.md" "PHOTO-2025-08-30-21-56-56.jpg" "unknown-date_unknown-newspaper_athletic-results-saroop-singh-mile.jpg"

echo "========================================================="
echo "Article update complete!"
echo "Success: $success articles"
echo "Failed: $failed articles"
echo "========================================================="