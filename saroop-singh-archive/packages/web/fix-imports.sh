#!/bin/bash

# Fix all component imports to use lowercase
cd /Users/agent-g/Saroop\ Singh\ Project/saroop-singh-archive/packages/web

# UI Components
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' "s|from '@/components/ui/Button'|from '@/components/ui/button'|g"
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' "s|from '@/components/ui/Card'|from '@/components/ui/card'|g"
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' "s|from '@/components/ui/Badge'|from '@/components/ui/badge'|g"
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' "s|from '@/components/ui/Dialog'|from '@/components/ui/dialog'|g"
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' "s|from '@/components/ui/Input'|from '@/components/ui/input'|g"
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' "s|from '@/components/ui/Label'|from '@/components/ui/label'|g"
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' "s|from '@/components/ui/Select'|from '@/components/ui/select'|g"
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' "s|from '@/components/ui/Tabs'|from '@/components/ui/tabs'|g"
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' "s|from '@/components/ui/Progress'|from '@/components/ui/progress'|g"
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' "s|from '@/components/ui/Skeleton'|from '@/components/ui/skeleton'|g"
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' "s|from '@/components/ui/FileUpload'|from '@/components/ui/fileupload'|g"
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' "s|from '@/components/ui/ArticleCard'|from '@/components/ui/articlecard'|g"
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' "s|from '@/components/ui/ArticleFilters'|from '@/components/ui/articlefilters'|g"

# Restoration Components
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' "s|from '@/components/restoration/RestorationGrid'|from '@/components/restoration/restorationgrid'|g"
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' "s|from '@/components/restoration/RestorationCard'|from '@/components/restoration/restorationcard'|g"
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' "s|from '@/components/restoration/ComparisonView'|from '@/components/restoration/comparisonview'|g"

# Layout Components
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' "s|from '@/components/layout/ResponsiveContainer'|from '@/components/layout/responsivecontainer'|g"
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' "s|from '@/components/layout/GridLayout'|from '@/components/layout/gridlayout'|g"
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' "s|from '@/components/layout/FlexLayout'|from '@/components/layout/flexlayout'|g"
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' "s|from '@/components/layout/StackLayout'|from '@/components/layout/stacklayout'|g"
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' "s|from '@/components/layout/SidebarLayout'|from '@/components/layout/sidebarlayout'|g"
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' "s|from '@/components/layout/Footer'|from '@/components/layout/footer'|g"
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' "s|from '@/components/layout/Header'|from '@/components/layout/header'|g"

# Mobile Components  
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' "s|from '@/components/mobile/MobileArticleCard'|from '@/components/mobile/mobilearticlecard'|g"
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' "s|from '@/components/mobile/MobileNav'|from '@/components/mobile/mobilenav'|g"
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' "s|from '@/components/mobile/MobileFilters'|from '@/components/mobile/mobilefilters'|g"
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' "s|from '@/components/mobile/MobileSearch'|from '@/components/mobile/mobilesearch'|g"
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' "s|from '@/components/mobile/PullToRefresh'|from '@/components/mobile/pulltorefresh'|g"
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' "s|from '@/components/mobile/SwipeableViews'|from '@/components/mobile/swipeableviews'|g"

# Composite Components
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' "s|from '@/components/composite/ArticleGrid'|from '@/components/composite/articlegrid'|g"
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' "s|from '@/components/composite/FilterableGrid'|from '@/components/composite/filterablegrid'|g"

echo "All imports have been updated to lowercase"