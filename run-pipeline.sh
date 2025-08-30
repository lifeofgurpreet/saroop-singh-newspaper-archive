#!/bin/bash
#
# Master script to run the full 3-stage image restoration pipeline.
#
set -e # Exit immediately if a command exits with a non-zero status.

# --- Configuration ---
# You can edit these default values

# Directories
INPUT_DIR="old-family-photos"
PREPROCESSED_DIR="generated/preprocessed"
STAGE2_DIR="generated/restorations/stage2_neutral"
STAGE3_DIR="generated/restorations/stage3_reshoot"

# Stage 2: Neutral Restoration Parameters
# Use a fixed seed for high consistency
RESTORE_PROMPTS="prompts/2_restore"
RESTORE_SEED=42
RESTORE_TEMP=0.1

# Stage 3: Stylistic Reshoot Parameters
# Use a higher temperature and repeats for creative variations
RESHOOT_PROMPTS="prompts/3_reshoot"
RESHOOT_TEMP=0.4
RESHOOT_REPEAT=3

# --- Script Body ---

# Activate virtual environment
if [ -d ".venv" ]; then
    echo "Activating Python virtual environment..."
    source .venv/bin/activate
else
    echo "Warning: .venv directory not found. Assuming python3 is in your PATH."
fi

PYTHON_CMD="python3"

# Stage 1: Pre-process
echo "
--- Stage 1: Pre-processing ---"
echo "Applying auto-orientation and auto-contrast..."
$PYTHON_CMD scripts/preprocess.py \
    --input-dir "$INPUT_DIR" \
    --output-dir "$PREPROCESSED_DIR" \
    --autocontrast

# Stage 2: Neutral Restoration
echo "
--- Stage 2: Neutral AI Restoration ---"
echo "Running high-fidelity restoration with fixed seed..."
$PYTHON_CMD scripts/gemini_batch_restore.py \
    --photos-dir "$PREPROCESSED_DIR" \
    --prompts-dir "$RESTORE_PROMPTS" \
    --out-root "$STAGE2_DIR" \
    --seed "$RESTORE_SEED" \
    --temperature "$RESTORE_TEMP"

# Stage 3: Stylistic Reshoot
echo "
--- Stage 3: Stylistic AI Reshoot ---"
echo "Generating creative variations..."
$PYTHON_CMD scripts/gemini_batch_restore.py \
    --photos-dir "$STAGE2_DIR" \
    --prompts-dir "$RESHOOT_PROMPTS" \
    --out-root "$STAGE3_DIR" \
    --temperature "$RESHOOT_TEMP" \
    --repeat "$RESHOOT_REPEAT"

echo "
--- Pipeline Complete ---"
echo "Outputs are available in:"
echo "- Neutral restorations: $STAGE2_DIR"
echo "- Stylistic reshoots: $STAGE3_DIR"
