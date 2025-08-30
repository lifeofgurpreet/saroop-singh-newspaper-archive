#!/usr/bin/env python3
"""
Batch image restoration/comparison using Gemini Image Generation.

For each photo in --photos-dir and each prompt file in --prompts-dir,
run image+text generation and save results into a per-photo output folder:

  <out_root>/<photo_stem>/
    original.<ext>
    <prompt_slug>__1.png
    <prompt_slug>__2.png (if multiple parts)
    meta.json (mapping prompts to outputs)

Prompt files are treated as plain text; the filename (without extensions/spaces)
becomes a slug that is used in output filenames.
"""
import argparse
import json
import shutil
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from PIL import Image

# Ensure project root is importable for `tools` package
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from tools.gemini import get_genai_client, save_inline_image_parts, load_settings

# Force image-only responses from the model
IMAGE_ONLY_PREFIX = "Return only an image; no text."


@dataclass
class Prompt:
    name: str  # file name without extension
    slug: str  # safe slug for filenames
    text: str  # full prompt text
    path: Path  # source prompt path


def slugify(name: str) -> str:
    s = name.strip().lower()
    # Replace non-alnum with dashes
    out = []
    for ch in s:
        if ch.isalnum():
            out.append(ch)
        elif ch in (" ", "-", "_", "."):
            out.append("-")
        else:
            out.append("-")
    slug = "".join(out)
    # collapse repeats
    while "--" in slug:
        slug = slug.replace("--", "-")
    return slug.strip("-") or "prompt"


def read_prompts(prompts_dir: Path, extensions=("", ".txt", ".md")) -> list[Prompt]:
    if not prompts_dir.exists():
        raise SystemExit(f"Prompts directory not found: {prompts_dir}")
    prompts: list[Prompt] = []
    empties: list[Path] = []
    for p in sorted(prompts_dir.iterdir()):
        if p.is_dir():
            continue
        if p.suffix.lower() not in extensions:
            # allow extensionless files, .txt, .md
            if p.suffix:
                continue
        try:
            text = p.read_text(encoding="utf-8")
        except Exception:
            # Skip unreadable files
            continue
        if not text.strip():
            empties.append(p)
            continue
        name = p.stem
        prompts.append(Prompt(name=name, slug=slugify(name), text=text, path=p))
    if not prompts:
        if empties:
            empty_list = "\n".join([f" - {e.name}" for e in empties])
            raise SystemExit(
                "No usable prompt files found (some were empty). Please add text to these files or remove them:\n" + empty_list
            )
        raise SystemExit(f"No prompt files found in: {prompts_dir}")
    if empties:
        empty_list = ", ".join([e.name for e in empties])
        print(f"[!] Skipping empty prompt files: {empty_list}")
    return prompts


def find_photos(photos_dir: Path, exts=(".jpg", ".jpeg", ".png", ".tif", ".tiff", ".webp")) -> list[Path]:
    if not photos_dir.exists():
        raise SystemExit(f"Photos directory not found: {photos_dir}")
    files: list[Path] = []
    for p in sorted(photos_dir.iterdir()):
        if p.is_file() and p.suffix.lower() in exts:
            files.append(p)
    if not files:
        raise SystemExit(f"No images found in: {photos_dir}")
    return files


def copy_original(photo: Path, out_dir: Path) -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)
    dest = out_dir / f"original{photo.suffix.lower()}"
    if not dest.exists():
        shutil.copy2(photo, dest)
    return dest


def save_meta(meta_path: Path, data: dict) -> None:
    meta_path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")


def generate_for_photo(client, photo: Path, prompts: list[Prompt], out_root: Path, model: str, dry_run: bool = False) -> None:
    photo_stem = photo.stem
    out_dir = out_root / photo_stem

    if dry_run:
        print(f"[DRY-RUN] Would create output dir: {out_dir}")
        print(f"[DRY-RUN] Would copy original -> {out_dir}/original{photo.suffix.lower()}")
        # Don't perform any IO
        img = None
    else:
        out_dir.mkdir(parents=True, exist_ok=True)
        # Ensure original is present
        copy_original(photo, out_dir)
        # Load once
        img = Image.open(photo)

    meta_path = out_dir / "meta.json"
    if dry_run:
        meta = {"photo": str(photo), "model": model, "results": {}}
    else:
        if meta_path.exists():
            try:
                meta = json.loads(meta_path.read_text(encoding="utf-8"))
            except Exception:
                meta = {}
        else:
            meta = {}
        meta.setdefault("photo", str(photo))
        meta.setdefault("model", model)
        meta.setdefault("results", {})

    for pr in prompts:
        print(f"[+] {photo.name} :: prompt '{pr.name}'")
        meta["results"].setdefault(pr.slug, {"prompt": pr.text, "files": []})
        if dry_run:
            print(f"[DRY-RUN] Would call model '{model}' with prompt '{pr.name}' and image '{photo.name}'")
            continue

        # Prepend directive to enforce image-only output; use provided prompt text only
        prompt_text = f"{IMAGE_ONLY_PREFIX}\n\n{pr.text.strip()}"

        response = client.models.generate_content(
            model=model,
            contents=[img, prompt_text],
        )
        parts = response.candidates[0].content.parts

        # Save only inline images; suppress text printing per requirement
        out_stem = f"{photo_stem}__{pr.slug}"
        saved = save_inline_image_parts(parts, out_dir, stem=out_stem)
        meta["results"][pr.slug]["files"].extend([str(p) for p in saved])
        save_meta(meta_path, meta)


def main():
    parser = argparse.ArgumentParser(description="Batch image restoration with multiple prompts")
    parser.add_argument("--photos-dir", type=Path, default=Path("/Users/agent-g/Saroop Singh Project/old-family-photos"), help="Directory with input photos")
    parser.add_argument("--prompts-dir", type=Path, default=Path("/Users/agent-g/Saroop Singh Project/ai-system-prompts/Image Restoration System Prompts"), help="Directory with prompt files")
    parser.add_argument("--out-root", type=Path, default=Path("generated/restorations"), help="Output root directory")
    parser.add_argument("--model", default="gemini-2.5-flash-image-preview", help="Model name to use")
    parser.add_argument("--dry-run", action="store_true", help="Parse and plan only; no API calls")
    parser.add_argument("--only-photo", help="Only process photos whose stem matches this value", default=None)
    args = parser.parse_args()

    # Load .env if present and validate key
    load_settings()
    client = get_genai_client()

    prompts = read_prompts(args.prompts_dir)
    photos = find_photos(args.photos_dir)
    if args.only_photo:
        photos = [p for p in photos if p.stem == args.only_photo]
        if not photos:
            raise SystemExit(f"No matching photo with stem: {args.only_photo}")

    print(f"Found {len(photos)} photos and {len(prompts)} prompts. Output: {args.out_root}")

    for photo in photos:
        try:
            generate_for_photo(client, photo, prompts, args.out_root, args.model, dry_run=args.dry_run)
        except KeyboardInterrupt:
            print("Interrupted.")
            sys.exit(130)
        except Exception as e:
            print(f"[!] Error processing {photo.name}: {e}")


if __name__ == "__main__":
    main()
