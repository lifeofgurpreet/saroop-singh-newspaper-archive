#!/usr/bin/env python3
import argparse
from pathlib import Path

from PIL import Image

from tools.gemini import get_genai_client, save_inline_image_parts


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

    if not args.image.exists():
        raise SystemExit(f"Image not found: {args.image}")

    client = get_genai_client()

    # Use Pillow to open; google-genai Python accepts PIL Image in contents
    img = Image.open(args.image)

    response = client.models.generate_content(
        model=args.model,
        contents=[args.prompt, img],
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
