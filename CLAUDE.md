# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
This is an Obsidian-based historical newspaper archive project focused on digitizing and organizing athletic meet clippings from Malayan newspapers (1937-1954). The project converts scanned newspaper images into structured Markdown articles with metadata.

## Repository Structure
```
.
├── raw-files/          # Original scanned newspaper clipping images (JPEG)
├── output/
│   └── articles/       # Processed Markdown articles with YAML frontmatter
├── ai-system-prompts/  # AI processing instructions
│   └── article_transcription_system_prompt.md
└── .obsidian/          # Obsidian vault configuration
```

## Article Processing Workflow

### Converting Images to Articles
Each image in `raw-files/` should be converted to a Markdown file in `output/articles/` following these conventions:

1. **Filename Format**: `YYYY-MM-DD_newspaper-slug_short-headline-slug.md`
   - Use lowercase, hyphens only, no spaces
   - Example: `1937-07-24_morning-tribune_half-mile-record.md`

2. **YAML Frontmatter Schema**:
   ```yaml
   ---
   title: Article Headline
   date_text: DD Mon YYYY  # or date: YYYY-MM-DD if exact
   source: Newspaper Name, Page N
   location: City
   people:
     - Person Name 1
     - Person Name 2
   image: ../../raw-files/filename.jpg
   tags: [clipping]
   ---
   ```

3. **Article Body Structure**:
   - First line: Obsidian image embed: `![[../../raw-files/filename.jpg]]`
   - Faithful manual transcription of clipping text
   - Mark uncertainties with `(illegible)`, `(sic)`, or `(word?)`
   - Use parentheses instead of brackets to avoid Obsidian link styling

## Key Processing Rules

### Transcription Guidelines
- Transcribe exactly as printed, preserving original punctuation
- Normalize hyphenations at line breaks
- Maintain original capitalization
- Never hallucinate or guess missing content
- Convert editorial brackets `[...]` to parentheses `(...)`

### Image Handling
- Always reference originals from `raw-files/`
- Use relative paths: `../../raw-files/filename.jpg`
- Embed images using Obsidian syntax: `![[path]]`

### Quality Checks
- Ensure valid YAML frontmatter
- Verify image paths resolve correctly
- Replace all brackets with parentheses in transcribed text
- No additional sections beyond frontmatter and transcript

## Common Tasks

### Process New Clippings
1. Check unprocessed images: `ls raw-files/*.jpg | grep -v -f <(ls output/articles/*.md | sed 's/.*\///' | sed 's/\.md/.jpg/')`
2. For each image, create corresponding Markdown file following conventions above
3. Extract metadata from visible text in clipping
4. Perform manual transcription (no OCR auto-correction)

### Validate Article Files
- Check YAML validity
- Verify image paths exist
- Ensure Obsidian embed syntax is correct
- Confirm no brackets remain in transcribed text

## Important Notes
- This is an Obsidian vault - maintain compatibility with Obsidian's markdown extensions
- Prioritize accuracy over completeness - mark unclear text rather than guessing
- The project focuses on historical athletic meets involving Saroop Singh and contemporaries
- Articles span 1937-1954 from various Malayan newspapers