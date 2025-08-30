#!/usr/bin/env python3
import argparse
import os
import sys
from pathlib import Path

from PIL import Image
from google.genai import types
import mimetypes

# Ensure project root is in sys.path so `tools` package can be imported
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from tools.gemini import get_genai_client, save_inline_image_parts, load_settings


def main():
    parser = argparse.ArgumentParser(description="Gemini image editing (image + text)")
    parser.add_argument("image", type=Path, help="Path to source image")
    parser.add_argument("prompt", help="Edit instruction prompt")
    parser.add_argument(
        "--model",
        default="gemini-2.5-flash-image-preview",
        help="Model name to use",
    )
    parser.add_argument(
        "--outdir",
        type=Path,
        default=Path("generated"),
        help="Directory to save generated images",
    )
    parser.add_argument(
        "--stem",
        default="gemini_edit",
        help="Filename stem for saved images",
    )
    args = parser.parse_args()

    # Ensure .env is loaded and key validated (no-op if not present)
    load_settings()

    if not args.image.exists():
        raise SystemExit(f"Image not found: {args.image}")

    client = get_genai_client()

    # Read image bytes and mime
    img_path = args.image
    mime, _ = mimetypes.guess_type(str(img_path))
    if not mime:
        mime = "image/jpeg"
    with open(img_path, "rb") as f:
        img_bytes = f.read()

    image_part = types.Part(
        inline_data=types.Blob(mime_type=mime, data=img_bytes)
    )

    response = client.models.generate_content(
        model=args.model,
        contents=[args.prompt, image_part],
        config=types.GenerateContentConfig(
            thinking_config=types.ThinkingConfig(thinking_budget=0),
        ),
    )

    parts = response.candidates[0].content.parts

    # Print any text parts
    for part in parts:
        if getattr(part, "text", None):
            print(part.text)

    # Save any inline images
    saved = save_inline_image_parts(parts, args.outdir, stem=args.stem)

    if saved:
        print("Saved:")
        for p in saved:
            print(f" - {p}")
    else:
        print("No images returned.")


if __name__ == "__main__":
    main()
