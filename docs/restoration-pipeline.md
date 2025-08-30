# Image Restoration & Reshoot Pipeline

This document outlines a two‑stage pipeline to produce faithful high‑quality restorations first, then controlled, consistent style variations. It also captures current tooling and proposed enhancements.

## Goals

- Preserve identity, pose, wardrobe, composition.
- Improve fidelity (micro‑texture, tone, DR) without geometry changes.
- Generate stylistic “reshoot” variants from a stabilized baseline.
- Keep outputs traceable, reproducible, and easy to curate.

## Stages

- **Stage A — Neutral Restoration (no style change)**
  - Single conservative prompt that fixes damage, denoise, balanced tone/color, subtle clarity.
  - Strict locks: no geometry/pose/wardrobe changes; no additions/removals.
  - Low randomness for determinism.
  - Output: “A‑outputs” used as inputs to Stage B.

- **Stage B — Targeted Reshoot Variations**
  - Input is the Stage A image (stabilized baseline).
  - Apply creative prompts (e.g., golden‑hour reshoot, 3D scene reconstruction) while preserving the same locks.
  - Low randomness; vary only intended style axes.

## File structure

- Prompts reside under `ai-system-prompts/` with clear, titled Markdown (already applied):
  - `ai-system-prompts/Image Restoration System Prompts/*.md`
  - Suggested split:
    - `prompts/restore/` — neutral restoration prompts (Stage A)
    - `prompts/reshoot/` — stylistic prompts (Stage B)
- Inputs: `old-family-photos/` (renamed to descriptive slugs).
- Outputs: `generated/restorations/<photo-stem>/`
  - Files: `original.*`, `<photo-stem>__<prompt-slug>_N.png`, `meta.json`.

## Current tooling

- Batch runner: `scripts/gemini_batch_restore.py`
  - Inputs: image + prompt text (we prepend a small image‑only directive).
  - Options:
    - `--only-photo <stem>` to target a single image.
    - `--only-prompt <name-or-slug>` to target a single prompt.
    - `--prompts-dir <dir>` to point to a specific prompt set.
  - Behavior:
    - One API call per prompt. No fallback prompts. Empty prompts abort or get skipped with a warning.
    - Filenames include both photo stem and prompt slug for traceability.
    - `meta.json` records prompt text, files, model.

- Housekeeping: `scripts/housekeeping.py`
  - `suggest-photo-names` → proposes descriptive filenames (JSONL).
  - `apply-photo-renames` → applies renames (dry‑run or apply).
  - `format-prompts` → formats raw prompt files into titled Markdown, creating slugs.

## Recommended run sequence

1. Stage A (neutral)
   - Use a conservative restoration prompt set (folder `prompts/restore/`).
   - Command example:
     - `.venv/bin/python scripts/gemini_batch_restore.py --prompts-dir prompts/restore --out-root generated/restorations`
2. Stage B (reshoot)
   - Feed Stage A outputs as inputs (or re-run on originals if Stage A is skipped).
   - Use creative prompt set (folder `prompts/reshoot/`).
   - Command example:
     - `.venv/bin/python scripts/gemini_batch_restore.py --prompts-dir prompts/reshoot --out-root generated/restorations`

## Consistency strategy

- Low randomness parameters (proposed flags):
  - `--temperature 0.15`, `--top_p 0.9`, `--top_k 32` (to be added if supported by SDK call).
- Repeat runs per prompt for controlled diversity (proposed):
  - `--repeat N` to produce `_v1`, `_v2`, … per prompt.
- Centralized “Locks” block at the start of every Stage B prompt to enforce identity/geometry/wardrobe preservation.

## Optional preprocessing (before Stage A)

- Gentle classical cleanup for more stable inputs:
  - Auto‑orient, deskew (if needed), light denoise, small unsharp mask, neutral color balance.
- Optional upscaling if the originals are small (e.g., Real‑ESRGAN or bicubic+sharpen) to improve micro‑texture headroom.
- Proposed: `scripts/preprocess.py` and a `--preprocess basic` switch.

## Reproducibility & traceability

- Keep `meta.json` per output directory with:
  - Prompt slug + full text
  - Model name and parameters (temperature/top_p/top_k when added)
  - Timestamp and optional `run_id`
- Maintain a `generated/runs/` log (CSV/JSONL) capturing per‑call metadata for auditing.

## Curation workflow

- Review outputs per photo folder; pick best files.
- Optionally copy picks to `generated/selected/` for gallery use.
- Naming pattern makes downstream mapping trivial.

## Next improvements (proposed changes)

- [ ] Add `--temperature`, `--top_p`, `--top_k` flags to `scripts/gemini_batch_restore.py`.
- [ ] Add `--repeat N` to loop calls per prompt and suffix versions.
- [ ] Split prompts into `prompts/restore/` and `prompts/reshoot/`, and update examples accordingly.
- [ ] Add optional preprocessing step (`scripts/preprocess.py`) and `--preprocess` flag.
- [ ] Expand `meta.json` with parameters + `run_id`; write `generated/runs/` summary.

## Why this works

- Stabilizing first (Stage A) reduces hallucination and drift in identity/geometry during stylistic transformations.
- Low randomness + strict locks + consistent prompt scaffolding improves repeatability.
- Repeat counts and parameter control give you a knob to trade variability vs. consistency.
