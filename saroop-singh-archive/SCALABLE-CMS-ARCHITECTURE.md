# Scalable Multi-Family Archive CMS Architecture

## Core Principles

1. **Person-Centric Design** - All content relates to people
2. **Content Type Agnostic** - Pluggable system for any content type
3. **Single Source of Truth** - No duplications, only references
4. **Relationship-Driven** - Graph-based connections between entities
5. **Version Control Native** - Track all changes and variations

## Proposed Directory Structure

```
family-archive/
├── people/                         # Core family member data
│   ├── singh-saroop-1915/         # Unique ID: lastname-firstname-birthyear
│   │   ├── profile.yaml           # Core biographical data
│   │   ├── relationships.yaml     # Family connections
│   │   ├── timeline.yaml          # Life events
│   │   ├── achievements.yaml      # Notable accomplishments
│   │   └── media/                 # Profile photos only
│   ├── kaur-harpreet-1920/
│   ├── singh-jaswant-1945/
│   └── _registry.yaml             # Master person registry
│
├── content/                        # All content types
│   ├── articles/                  # News clippings, writings
│   │   ├── 1937-07-18-straits-times-half-mile-record/
│   │   │   ├── metadata.yaml     # Standard metadata schema
│   │   │   ├── content.md        # Article text
│   │   │   ├── media/            # Associated images
│   │   │   │   └── manifest.yaml # Links to media library
│   │   │   └── transcription.md  # OCR/manual transcription
│   │   └── _index.yaml           # Article index
│   │
│   ├── recipes/                   # Family recipes
│   │   ├── punjabi-chole-masala/
│   │   │   ├── metadata.yaml     # Recipe-specific metadata
│   │   │   ├── recipe.yaml       # Structured recipe data
│   │   │   ├── story.md          # Family story about recipe
│   │   │   └── media/            # Photos/videos
│   │   └── _index.yaml
│   │
│   ├── stories/                   # Family stories, memories
│   │   ├── partition-journey-1947/
│   │   │   ├── metadata.yaml
│   │   │   ├── narrative.md
│   │   │   ├── participants.yaml # People involved
│   │   │   └── media/
│   │   └── _index.yaml
│   │
│   ├── documents/                 # Official documents
│   │   ├── passport-singh-saroop-1938/
│   │   │   ├── metadata.yaml
│   │   │   ├── document.pdf
│   │   │   ├── transcription.md
│   │   │   └── translations/
│   │   └── _index.yaml
│   │
│   └── _schemas/                  # Content type definitions
│       ├── article.schema.yaml
│       ├── recipe.schema.yaml
│       ├── story.schema.yaml
│       └── document.schema.yaml
│
├── media/                          # Centralized media library
│   ├── images/
│   │   ├── IMG_001/              # Unique media ID
│   │   │   ├── original.jpg      # Never modified
│   │   │   ├── metadata.yaml     # EXIF, source, date
│   │   │   ├── versions/         # All processed versions
│   │   │   │   ├── v1-restored-2024-01-15.jpg
│   │   │   │   ├── v2-colorized-2024-01-16.jpg
│   │   │   │   ├── v3-enhanced-2024-01-20.jpg
│   │   │   │   └── manifest.yaml # Version history
│   │   │   ├── derivatives/      # Auto-generated sizes
│   │   │   │   ├── thumb-200x200.jpg
│   │   │   │   ├── medium-800x800.jpg
│   │   │   │   ├── large-1920x1920.jpg
│   │   │   │   └── webp/        # Modern formats
│   │   │   └── annotations.yaml  # Face tags, locations
│   │   └── _index.db             # SQLite for fast queries
│   │
│   ├── videos/
│   ├── audio/
│   └── documents/
│
├── relationships/                  # Graph database of connections
│   ├── family-tree.yaml          # Family relationships
│   ├── events.yaml               # Shared events/occasions
│   ├── locations.yaml            # Places and their connections
│   └── cross-references.yaml     # Content relationships
│
├── collections/                    # Curated content groups
│   ├── saroop-singh-athletics/
│   │   ├── metadata.yaml
│   │   ├── description.md
│   │   └── items.yaml           # References to content
│   ├── partition-memories/
│   └── family-recipes-punjab/
│
├── metadata/                       # System-wide metadata
│   ├── tags.yaml                 # Controlled vocabulary
│   ├── locations.yaml            # Geographic hierarchy
│   ├── publications.yaml         # Source publications
│   └── contributors.yaml         # Who added what
│
├── database/                       # Structured data
│   ├── content.db                # SQLite for local dev
│   ├── search-index/             # Full-text search
│   └── cache/                    # Computed relationships
│
└── config/                        # System configuration
    ├── content-types.yaml        # Registered content types
    ├── media-processing.yaml     # Image pipeline config
    ├── permissions.yaml          # Access control
    └── api-schemas/              # API definitions
```

## Key Architecture Components

### 1. Person-Centric Model

```yaml
# people/singh-saroop-1915/profile.yaml
id: singh-saroop-1915
name:
  given: Saroop
  family: Singh
  display: Saroop Singh
  aliases:
    - S. Singh
    - Sardar Saroop Singh
birth:
  date: 1915-03-15
  place: 
    city: Amritsar
    state: Punjab
    country: British India
death:
  date: 1985-07-20
  place:
    city: Kuala Lumpur
    country: Malaysia
biography:
  summary: Pioneer athlete who set multiple records in Malaya
  full: |
    Detailed biography text...
occupation:
  - athlete
  - civil_servant
achievements:
  - date: 1937-07-18
    title: Half-mile record
    description: Set Malayan record of 2:00.2
tags:
  - athletics
  - running
  - malayan-sports
```

### 2. Content Type System

```yaml
# content/_schemas/article.schema.yaml
type: article
version: 1.0
fields:
  title:
    type: string
    required: true
  date:
    type: date
    required: true
  publication:
    type: reference
    to: metadata/publications
  people:
    type: array
    items:
      type: reference
      to: people/_registry
  location:
    type: reference
    to: metadata/locations
  media:
    type: array
    items:
      type: reference
      to: media/images/_index
  content:
    type: markdown
    required: true
  tags:
    type: array
    items:
      type: reference
      to: metadata/tags
```

### 3. Media Versioning System

```yaml
# media/images/IMG_001/versions/manifest.yaml
versions:
  - id: v1-restored-2024-01-15
    created: 2024-01-15T10:30:00Z
    created_by: user-123
    process: restoration
    tools:
      - name: MyHeritage
        version: 2.0
    changes:
      - scratches_removed
      - contrast_adjusted
    parent: original
    
  - id: v2-colorized-2024-01-16
    created: 2024-01-16T14:20:00Z
    created_by: user-123
    process: colorization
    tools:
      - name: DeOldify
        settings:
          model: artistic
    parent: v1-restored-2024-01-15
    
  - id: v3-enhanced-2024-01-20
    created: 2024-01-20T09:15:00Z
    created_by: user-456
    process: enhancement
    tools:
      - name: Topaz
        settings:
          sharpening: 3
          denoise: 2
    parent: v2-colorized-2024-01-16

current_display: v3-enhanced-2024-01-20
```

### 4. Relationship Graph

```yaml
# relationships/family-tree.yaml
relationships:
  - type: parent_child
    parent: singh-gurdev-1890
    child: singh-saroop-1915
    
  - type: spouse
    person1: singh-saroop-1915
    person2: kaur-harpreet-1920
    marriage_date: 1940-04-12
    
  - type: sibling
    persons:
      - singh-saroop-1915
      - singh-jaswant-1918
      - kaur-surjit-1920

# relationships/cross-references.yaml
content_relationships:
  - type: mentions
    from: content/articles/1937-07-18-straits-times
    to: people/singh-saroop-1915
    context: athletic_achievement
    
  - type: related_event
    items:
      - content/articles/1937-07-18-straits-times
      - content/articles/1937-07-19-straits-times
    event: Selangor Athletic Championships 1937
```

## Database Schema (PostgreSQL)

```sql
-- Core person table
CREATE TABLE people (
    id VARCHAR(50) PRIMARY KEY,
    given_name VARCHAR(100) NOT NULL,
    family_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(200) NOT NULL,
    birth_date DATE,
    death_date DATE,
    biography_summary TEXT,
    biography_full TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Content base table (inherited by all content types)
CREATE TABLE content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type VARCHAR(50) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    content_date DATE,
    content_text TEXT,
    quality_score DECIMAL(3,2), -- 0.00 to 1.00
    created_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_at TIMESTAMP DEFAULT NOW(),
    published BOOLEAN DEFAULT false,
    metadata JSONB
);

-- Content-Person relationships
CREATE TABLE content_people (
    content_id UUID REFERENCES content(id),
    person_id VARCHAR(50) REFERENCES people(id),
    relationship_type VARCHAR(50), -- mentioned, author, subject, photographer
    PRIMARY KEY (content_id, person_id)
);

-- Media library
CREATE TABLE media (
    id VARCHAR(20) PRIMARY KEY,
    media_type VARCHAR(20) NOT NULL, -- image, video, audio, document
    original_filename VARCHAR(500),
    mime_type VARCHAR(100),
    file_size BIGINT,
    width INT,
    height INT,
    duration INT, -- for video/audio in seconds
    metadata JSONB, -- EXIF, etc
    created_at TIMESTAMP DEFAULT NOW()
);

-- Media versions
CREATE TABLE media_versions (
    id VARCHAR(50) PRIMARY KEY,
    media_id VARCHAR(20) REFERENCES media(id),
    version_number INT NOT NULL,
    process_type VARCHAR(50), -- restoration, colorization, enhancement
    parent_version VARCHAR(50) REFERENCES media_versions(id),
    file_path VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(100),
    processing_metadata JSONB
);

-- Content-Media relationships
CREATE TABLE content_media (
    content_id UUID REFERENCES content(id),
    media_id VARCHAR(20) REFERENCES media(id),
    display_order INT DEFAULT 0,
    caption TEXT,
    PRIMARY KEY (content_id, media_id)
);

-- Family relationships
CREATE TABLE family_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    relationship_type VARCHAR(50) NOT NULL, -- parent, child, spouse, sibling
    person1_id VARCHAR(50) REFERENCES people(id),
    person2_id VARCHAR(50) REFERENCES people(id),
    start_date DATE,
    end_date DATE,
    metadata JSONB
);

-- Full-text search
CREATE INDEX content_search_idx ON content 
USING GIN (to_tsvector('english', title || ' ' || content_text));

-- Performance indexes
CREATE INDEX idx_content_date ON content(content_date);
CREATE INDEX idx_content_type ON content(content_type);
CREATE INDEX idx_people_names ON people(family_name, given_name);
CREATE INDEX idx_media_type ON media(media_type);
```

## API Design

```typescript
// RESTful API endpoints
GET /api/people                     // List all people
GET /api/people/:id                 // Get person details
GET /api/people/:id/content         // Get all content for person
GET /api/people/:id/media           // Get all media for person
GET /api/people/:id/relationships   // Get family relationships
GET /api/people/:id/timeline        // Get chronological events

GET /api/content                    // List all content
GET /api/content/:type              // List content by type
GET /api/content/:type/:id          // Get specific content
POST /api/content/:type             // Create new content
PUT /api/content/:type/:id          // Update content
DELETE /api/content/:type/:id       // Delete content

GET /api/media                      // List media
GET /api/media/:id                  // Get media details
GET /api/media/:id/versions         // Get all versions
POST /api/media                     // Upload new media
POST /api/media/:id/process         // Create new version

GET /api/search                     // Full-text search
GET /api/relationships              // Get relationship graph
GET /api/collections                // Get curated collections
GET /api/timeline                   // Get timeline view

// GraphQL schema
type Person {
  id: ID!
  givenName: String!
  familyName: String!
  displayName: String!
  birthDate: Date
  deathDate: Date
  biography: Biography
  content: [Content!]!
  media: [Media!]!
  relationships: [Relationship!]!
  timeline: [TimelineEvent!]!
}

type Content {
  id: ID!
  type: ContentType!
  title: String!
  date: Date
  text: String
  people: [Person!]!
  media: [Media!]!
  metadata: JSON
}

type Media {
  id: ID!
  type: MediaType!
  originalUrl: String!
  versions: [MediaVersion!]!
  metadata: JSON
}
```

## Migration Strategy

### Phase 1: Data Structure Migration
```bash
# 1. Create new directory structure
mkdir -p family-archive/{people,content,media,relationships,collections,metadata,database,config}

# 2. Migrate Saroop Singh as first person
./scripts/migrate-person.sh saroop-singh

# 3. Migrate articles to new content structure  
./scripts/migrate-content.sh articles

# 4. Consolidate media library
./scripts/consolidate-media.sh

# 5. Build relationship graph
./scripts/build-relationships.sh
```

### Phase 2: Database Setup
```sql
-- Create database
CREATE DATABASE family_archive;

-- Run migrations
psql family_archive < migrations/001_create_schema.sql
psql family_archive < migrations/002_import_data.sql
psql family_archive < migrations/003_build_indexes.sql
```

### Phase 3: API Development
```typescript
// Implement core APIs
npm run generate:api-types
npm run build:api
npm run test:api
```

## Benefits of This Architecture

1. **Infinite Scalability** - Add unlimited people, content types, media
2. **No Duplication** - Single source of truth for all media
3. **Version Control** - Track every change to every image
4. **Relationship Aware** - Discover connections between people and content
5. **Content Type Agnostic** - Easy to add recipes, documents, videos, etc
6. **Performance Optimized** - Indexed database, CDN-ready structure
7. **API-First** - Ready for web, mobile, or any frontend
8. **Migration Friendly** - Clear path from current structure

## Next Steps

1. Review and approve architecture
2. Create migration scripts
3. Set up PostgreSQL database
4. Build core API endpoints
5. Migrate existing content
6. Create admin interface
7. Implement search functionality
8. Build public-facing website

This architecture will scale from 1 to 10,000+ family members and millions of content items while maintaining performance and organization.