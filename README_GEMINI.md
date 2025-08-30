# Gemini Image Generation Tools

This folder adds a clean Python integration for the Google GenAI SDK (Gemini API) focused on image generation and editing, aligned with the latest docs:

- Libraries: https://ai.google.dev/gemini-api/docs/libraries
- Image Generation: https://ai.google.dev/gemini-api/docs/image-generation
- Quickstart: https://ai.google.dev/gemini-api/docs/quickstart

## Setup

1) Python 3.9+
2) Install dependencies:

```bash
pip install -r requirements.txt
```

3) Set your API key. The SDK reads `GEMINI_API_KEY` automatically.

- Copy `.env.example` to `.env` and set your key, or export in your shell.

```bash
# Option A: env file
cp .env.example .env
# edit .env and set GEMINI_API_KEY

# Option B: shell env var
export GEMINI_API_KEY=your_key_here
```

## Commands

All commands assume you run them from the project root.

### 1) Text-to-Image

```bash
python scripts/gemini_generate.py "Create a picture of a nano banana dish in a fancy restaurant with a Gemini theme" \
  --model gemini-2.5-flash-image-preview \
  --outdir generated \
  --stem banana
```

Outputs are saved under `generated/` (gitignored).

### 2) Image + Text Editing

```bash
python scripts/gemini_edit.py path/to/input.png "Change the style to watercolor and add a soft morning glow" \
  --model gemini-2.5-flash-image-preview \
  --outdir generated \
  --stem edit
```

### 3) Batch Restore: Multiple Prompts x Photos

Reads all photos from `old-family-photos/` and all prompt files from `ai-system-prompts/Image Restoration System Prompts/`. Creates an output folder per photo containing the original and generated variants. Filenames encode the prompt slug.

Dry run (no API calls, no file writes):

```bash
python scripts/gemini_batch_restore.py \
  --photos-dir "/Users/agent-g/Saroop Singh Project/old-family-photos" \
  --prompts-dir "/Users/agent-g/Saroop Singh Project/ai-system-prompts/Image Restoration System Prompts" \
  --out-root generated/restorations \
  --dry-run
```

Execute the batch:

```bash
python scripts/gemini_batch_restore.py \
  --photos-dir "/Users/agent-g/Saroop Singh Project/old-family-photos" \
  --prompts-dir "/Users/agent-g/Saroop Singh Project/ai-system-prompts/Image Restoration System Prompts" \
  --out-root generated/restorations \
  --model gemini-2.5-flash-image-preview
```

Output layout example:

```
generated/restorations/
  IMG_0850/
    original.jpg
    prompt1__1.png
    prompt2__1.png
    prompt3__1.png
    prompt4__1.png
    meta.json
```

## Code Layout

- `tools/gemini/`
  - `client.py`: returns a `google.genai` client that reads `GEMINI_API_KEY`.
  - `config.py`: validates env, optional `.env` loading.
  - `io.py`: saves inline image parts from responses.
- `scripts/`
  - `gemini_generate.py`: text-to-image CLI.
  - `gemini_edit.py`: image + text editing CLI.

## Notes

- The default model here is `gemini-2.5-flash-image-preview` per the official docs for image generation.
- All generated images include a SynthID watermark per Google policy.
- If you hit errors around the API key, ensure `GEMINI_API_KEY` is set in your environment.
