#!/usr/bin/env python3
"""
Pre-process images for the AI pipeline (e.g., auto-orient).
"""
import argparse
from pathlib import Path
import sys
from PIL import Image, ImageOps

# Ensure project root is importable
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

def find_photos(photos_dir: Path, exts=(".jpg", ".jpeg", ".png", ".tif", ".tiff", ".webp")) -> list[Path]:
    if not photos_dir.exists():
        raise SystemExit(f"Photos directory not found: {photos_dir}")
    files: list[Path] = []
    for p in sorted(photos_dir.iterdir()):
        if p.is_file() and p.suffix.lower() in exts:
            files.append(p)
    if not files:
        print(f"No images found in: {photos_dir}")
    return files

def process_image(photo_path: Path, out_dir: Path):
    """
    Opens an image, applies EXIF orientation, and saves it to the output directory.
    """
    try:
        img = Image.open(photo_path)
        
        # Apply EXIF orientation
        img_oriented = ImageOps.exif_transpose(img)
        
        # Prepare output path
        out_path = out_dir / photo_path.name
        
        # Save the processed image
        # For formats that support it, we try to maintain quality.
        save_kwargs = {}
        if out_path.suffix.lower() in (".jpg", ".jpeg"):
            save_kwargs['quality'] = 95
            save_kwargs['subsampling'] = 0 # Keep chroma detail

        img_oriented.save(out_path, **save_kwargs)
        print(f"Processed and saved: {out_path}")

    except Exception as e:
        print(f"[!] Error processing {photo_path.name}: {e}")


def main():
    parser = argparse.ArgumentParser(description="Pre-process images for the AI pipeline (e.g., auto-orient).")
    parser.add_argument("--input-dir", type=Path, required=True, help="Directory with input photos.")
    parser.add_argument("--output-dir", type=Path, required=True, help="Directory to save processed photos.")
    args = parser.parse_args()

    args.output_dir.mkdir(parents=True, exist_ok=True)
    
    photos = find_photos(args.input_dir)
    
    if not photos:
        return

    print(f"Found {len(photos)} photos to process.")
    
    for photo in photos:
        process_image(photo, args.output_dir)

if __name__ == "__main__":
    main()
