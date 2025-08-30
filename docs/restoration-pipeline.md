# Image Restoration & Reshoot Pipeline (v2)

This document outlines an enhanced, multi-stage pipeline designed to produce high-fidelity, consistent, and reproducible image restorations and stylistic variations. It incorporates best practices for generative AI workflows and specific controls available in the Gemini API.

## Guiding Principles

1.  **Reproducibility First**: Achieve deterministic outputs where possible using a fixed `seed`.
2.  **Progressive Enhancement**: Build from a clean, neutral baseline before attempting creative styles.
3.  **Controlled Variation**: Introduce randomness deliberately, not accidentally.
4.  **Traceability**: Log all parameters for every run to understand what worked.

## The Three-Stage Pipeline

### Stage 1: Pre-processing (Classical Tools)
*   **Goal**: Prepare a clean, standardized input for the AI. This is not an AI step.
*   **Actions**: Use libraries like `Pillow` or `OpenCV` for:
    *   **Auto-orientation & Deskewing**: Correct rotation from camera sensors or scans.
    *   **Color Balancing**: Neutralize color casts to establish a neutral white point.
    -   **Light Denoising**: Remove simple noise patterns that don't require generative infilling.
*   **Output**: A clean "plate" image, saved to a temporary or intermediate directory.

### Stage 2: Neutral AI Restoration (High Fidelity)
*   **Goal**: Create a faithful, high-quality restoration of the original photo, fixing complex damage while preserving all core attributes.
*   **Input**: The pre-processed image from Stage 1.
*   **Method**:
    *   Use a single, conservative restoration prompt focused on repair, not style.
    *   **Crucially, set a fixed `seed` (e.g., `--seed 42`) in the Gemini API call for deterministic, reproducible output.**
    *   Set `temperature` to a very low value (e.g., `0.1`) to minimize randomness.
*   **Output**: A high-fidelity, restored master image. This becomes the new baseline for all creative work.

### Stage 3: Stylistic AI Reshoot (Creative Variation)
*   **Goal**: Generate creative variations (e.g., golden hour, 3D render) based on the restored master.
*   **Input**: The high-fidelity output from Stage 2.
*   **Method**:
    *   Apply creative prompts, each containing strict "lock" instructions to preserve identity, pose, and composition.
    *   Use a **different `seed`** for each stylistic prompt (or no seed) to allow for creative variance.
    *   Adjust `temperature` (e.g., `0.2` to `0.4`) to introduce controlled creativity.
    *   Use `--repeat N` to generate multiple candidates for each style.

## Enhanced Consistency & Control Strategy

-   **`--seed <int>`**: The most important flag for reproducibility. The same model, prompt, and seed will produce nearly identical results. Use this for the Neutral Restoration stage.
-   **`--temperature <float>`**: Controls randomness. (e.g., `0.1` for restoration, `0.4` for creative tasks).
-   **`--repeat <int>`**: Since `candidate_count` is 1, this is our workaround to generate multiple versions of the same prompt. Each repeat will be suffixed (`_v1`, `_v2`).
-   **Prompt Organization**: Split prompts into `prompts/2_restore/` and `prompts/3_reshoot/` to match the pipeline stages.

## Advanced Concept: Multi-Model Pipeline

For photos with significant facial degradation, a specialized model could be introduced in Stage 1 or 2.

-   **Example**: Use a dedicated face restoration model (like GFPGAN) to fix only the faces, then pass the composite image to Gemini for overall scene restoration. This isolates specialized tasks for better results.

## Proposed Tooling Enhancements

-   **`scripts/gemini_batch_restore.py`**:
    -   Add CLI flags: `--seed <int>`, `--temperature <float>`, `--repeat <int>`.
    -   Pass these parameters to the `generation_config` of the Gemini client.
    -   Implement the `--repeat` loop, saving numbered versions.
-   **`scripts/preprocess.py` (New)**:
    -   A new script to handle Stage 1 tasks (orientation, color balance).
    -   The batch script can call this optionally via a `--preprocess` flag.
-   **`meta.json` Expansion**:
    -   Log `seed`, `temperature`, and `repeat` values for every generated image.
    -   Add a `run_id` to group all images generated in a single batch execution.

## Revised Run Sequence

1.  **(Optional) Pre-process**: `.venv/bin/python scripts/preprocess.py --input-dir old-family-photos --output-dir generated/preprocessed`
2.  **Stage 2: Neutral Restore**: `.venv/bin/python scripts/gemini_batch_restore.py --photos-dir generated/preprocessed --prompts-dir prompts/2_restore --seed 42 --temperature 0.1 --out-root generated/restorations/stage2_neutral`
3.  **Stage 3: Stylistic Reshoot**: `.venv/bin/python scripts/gemini_batch_restore.py --photos-dir generated/restorations/stage2_neutral --prompts-dir prompts/3_reshoot --repeat 3 --temperature 0.4 --out-root generated/restorations/stage3_reshoot`

This structured approach ensures a solid, reproducible foundation before creative exploration, giving you much finer control over the final output.
