# Current UI/UX Analysis

## Pages Structure

### 1. Homepage (`/`)
- **Dashboard Header**: Hero section with archive title and subtitle
- **Family Heritage Hero**: Large image with overlay, call-to-action buttons
- **Featured Articles**: Highlighted newspaper clippings
- **Quick Stats**: Article counts, date ranges
- **Navigation**: Clean header with page links

### 2. Articles Page (`/articles`)
- **Search Bar**: Full-text search functionality
- **Advanced Filters**: 
  - Date range picker
  - Newspaper source dropdown
  - People mentioned filter
  - Quick filter buttons
- **Article Grid**: Card-based layout with:
  - Article title
  - Date and source
  - Excerpt preview
  - Newspaper image thumbnail
- **Infinite Scroll**: Load more articles on scroll
- **Article Modal**: Full article overlay with:
  - Large newspaper image
  - Full article text
  - Metadata display
  - Close/navigation controls

### 3. Timeline Page (`/timeline`)
- **Year Navigation**: Horizontal year selector
- **Chronological View**: Articles arranged by date
- **Interactive Elements**: Click to view article details
- **Same Modal System**: Reuses article detail modal

### 4. About Page (`/about`)
- **Biography Section**: Saroop Singh's story
- **Achievement Highlights**: Key records and wins
- **Historical Context**: Malayan athletics background

### 5. Restorations Page (`/restorations`)
- **Photo Gallery**: Restored family photographs
- **Before/After Comparisons**: Image restoration showcase

## Design System

### Color Palette
- Primary: Professional navy/dark blue
- Secondary: Gold/amber accents
- Background: Clean whites and light grays
- Text: Dark charcoal for readability

### Typography
- Headlines: Bold, clear hierarchy
- Body text: Readable serif/sans-serif
- Metadata: Subtle, smaller text

### Layout Patterns
- **Card-based Design**: Articles as cards
- **Modal Overlays**: Article details
- **Responsive Grid**: Works on all devices
- **Mobile-first**: Touch-friendly interactions

### Components to Recreate

#### Navigation Header
- Site logo/title
- Main navigation links
- Mobile hamburger menu

#### Search & Filters
- Search input with icon
- Filter dropdowns
- Date range pickers
- Clear filters button

#### Article Cards
- Image thumbnail
- Title and metadata
- Excerpt preview
- Hover effects

#### Article Modal
- Large image display
- Content area
- Metadata sidebar
- Navigation controls

#### Timeline Components
- Year selector
- Article timeline
- Date markers

## JavaScript Functionality

### Core Features
1. **Dynamic Search**: Real-time article filtering
2. **Advanced Filtering**: Multiple filter combinations
3. **Infinite Scroll**: Progressive loading
4. **Modal System**: Article detail overlay
5. **Image Zoom**: Newspaper image viewing
6. **Responsive Interactions**: Touch and click handling

### State Management
- Articles data
- Filter states
- Loading states
- Modal visibility
- Search queries

## Current File Structure
```
├── _layouts/           # Jekyll templates
├── _sass/             # Stylesheet components
├── assets/
│   ├── css/           # Compiled styles
│   ├── js/            # JavaScript functionality
│   └── data/          # Data files
├── output/articles/   # Markdown article files
├── raw-files/         # Original newspaper images
└── generated/         # Processed images
```

## Key Strengths to Preserve
1. **Clean, Professional Design**: Academic/archival feel
2. **Excellent UX**: Intuitive navigation and interactions
3. **Responsive Design**: Works perfectly on all devices
4. **Search Functionality**: Comprehensive filtering options
5. **Modal System**: Elegant article viewing
6. **Performance**: Fast loading and smooth interactions

## Next.js Recreation Plan
- Convert Jekyll layouts to React components
- Recreate styles with Tailwind CSS
- Implement all JavaScript functionality in React
- Maintain exact same user experience
- Improve performance and maintainability