#!/usr/bin/env python3
import argparse
from pathlib import Path

from tools.gemini import get_genai_client, save_inline_image_parts


def main():
    parser = argparse.ArgumentParser(description="Gemini text-to-image generator")
    parser.add_argument("prompt", help="Text prompt for image generation")
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
        default="gemini_image",
        help="Filename stem for saved images",
    )
    args = parser.parse_args()

    client = get_genai_client()
    response = client.models.generate_content(
        model=args.model,
        contents=[args.prompt],
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
