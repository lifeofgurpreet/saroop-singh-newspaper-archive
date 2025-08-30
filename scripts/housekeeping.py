#!/usr/bin/env python3
"""
Housekeeping utilities:
- suggest-photo-names: Use Gemini to propose descriptive filenames for photos.
- apply-photo-renames: Apply renames from a JSONL/CSV mapping file produced by suggest-photo-names.
- format-prompts: Normalize/format prompt files into Markdown with titles and slugs (dry-run by default).
"""
import argparse
import json
import csv
import sys
from dataclasses import dataclass
from io import BytesIO
from pathlib import Path
from typing import Iterable, Optional

from PIL import Image

# Ensure project root is importable for `tools` package
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from tools.gemini import get_genai_client, load_settings

SUPPORTED_IMAGE_EXTS = (".jpg", ".jpeg", ".png", ".tif", ".tiff", ".webp")


@dataclass
class PhotoSuggestion:
    src_path: Path
    title: str
    slug: str
    short_description: str
    suggested_filename: str

    def to_dict(self) -> dict:
        return {
            "src_path": str(self.src_path),
            "title": self.title,
            "slug": self.slug,
            "short_description": self.short_description,
            "suggested_filename": self.suggested_filename,
        }


def find_images(photos_dir: Path) -> list[Path]:
    if not photos_dir.exists():
        raise SystemExit(f"Photos directory not found: {photos_dir}")
    files: list[Path] = []
    for p in sorted(photos_dir.iterdir()):
        if p.is_file() and p.suffix.lower() in SUPPORTED_IMAGE_EXTS:
            files.append(p)
    if not files:
        raise SystemExit(f"No images found in: {photos_dir}")
    return files


def ask_gemini_for_name(client, image: Image.Image) -> Optional[PhotoSuggestion]:
    instruction = (
        "You are helping organize a family history photo archive. "
        "Analyze the attached image and output a JSON object with keys: "
        "title (concise, 5-12 words), slug (kebab-case from title), short_description (<=160 chars), "
        "suggested_filename (use slug + 2-4 salient tokens like year/place/people; keep only [a-z0-9-]_ and end with .jpg). "
        "Return ONLY the JSON."
    )
    resp = client.models.generate_content(
        model="gemini-2.5-flash-image-preview",
        contents=[image, instruction],
    )
    parts = resp.candidates[0].content.parts
    json_text = None
    for part in parts:
        if getattr(part, "text", None):
            json_text = part.text.strip()
            break
    if not json_text:
        return None
    try:
        data = json.loads(json_text)
    except Exception:
        # Try to extract JSON block heuristically
        start = json_text.find("{")
        end = json_text.rfind("}")
        if start != -1 and end != -1 and end > start:
            try:
                data = json.loads(json_text[start : end + 1])
            except Exception:
                return None
        else:
            return None
    title = data.get("title") or "Untitled Photo"
    slug = data.get("slug") or "untitled-photo"
    short_description = data.get("short_description") or ""
    suggested_filename = data.get("suggested_filename") or f"{slug}.jpg"
    return title, slug, short_description, suggested_filename


def suggest_photo_names(photos_dir: Path, out_file: Path) -> None:
    load_settings()
    client = get_genai_client()
    photos = find_images(photos_dir)
    out_file.parent.mkdir(parents=True, exist_ok=True)

    suggestions: list[dict] = []
    for p in photos:
        try:
            img = Image.open(p)
            res = ask_gemini_for_name(client, img)
            if not res:
                print(f"[!] No suggestion for {p.name}")
                continue
            title, slug, short_description, suggested_filename = res
            # Ensure extension preserved from source unless model suggested otherwise
            if not suggested_filename.lower().endswith(p.suffix.lower()):
                suggested_filename = f"{Path(suggested_filename).stem}{p.suffix.lower()}"
            suggestions.append(
                {
                    "src_path": str(p),
                    "title": title,
                    "slug": slug,
                    "short_description": short_description,
                    "suggested_filename": suggested_filename,
                }
            )
            print(f"[+] {p.name} -> {suggested_filename}")
        except KeyboardInterrupt:
            raise
        except Exception as e:
            print(f"[!] Error processing {p.name}: {e}")

    if not suggestions:
        print("No suggestions generated.")
        return

    # Write JSONL for easy editing
    with out_file.open("w", encoding="utf-8") as f:
        for row in suggestions:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")
    print(f"Saved suggestions to {out_file}")


def apply_photo_renames(mapping_file: Path, dry_run: bool = True) -> None:
    if not mapping_file.exists():
        raise SystemExit(f"Mapping file not found: {mapping_file}")
    rows: list[dict] = []
    with mapping_file.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                rows.append(json.loads(line))
            except Exception:
                pass
    if not rows:
        raise SystemExit("No rows found in mapping file (expected JSONL)")

    for row in rows:
        src = Path(row.get("src_path", ""))
        dest_name = row.get("suggested_filename")
        if not src.exists() or not dest_name:
            print(f"[!] Skip invalid row: {row}")
            continue
        dest = src.with_name(dest_name)
        final = dest
        i = 2
        while final.exists():
            final = src.with_name(f"{Path(dest_name).stem}-{i}{src.suffix.lower()}")
            i += 1
        if dry_run:
            print(f"[DRY-RUN] Would rename {src.name} -> {final.name}")
        else:
            src.rename(final)
            print(f"Renamed {src.name} -> {final.name}")


def slugify(name: str) -> str:
    s = name.strip().lower()
    out = []
    for ch in s:
        if ch.isalnum():
            out.append(ch)
        elif ch in (" ", "-", "_", "."):
            out.append("-")
        else:
            out.append("-")
    slug = "".join(out)
    while "--" in slug:
        slug = slug.replace("--", "-")
    return slug.strip("-") or "prompt"


def format_prompts(prompts_dir: Path, out_ext: str = ".md", apply: bool = False) -> None:
    if not prompts_dir.exists():
        raise SystemExit(f"Prompts directory not found: {prompts_dir}")

    files = [p for p in sorted(prompts_dir.iterdir()) if p.is_file()]
    if not files:
        raise SystemExit(f"No prompt files in: {prompts_dir}")

    load_settings()
    client = get_genai_client()

    for p in files:
        try:
            raw = p.read_text(encoding="utf-8").strip()
        except Exception:
            print(f"[!] Cannot read {p.name}; skipping")
            continue
        if not raw:
            print(f"[!] Empty prompt {p.name}; skipping")
            continue

        # Ask the model to produce a concise title only, then a neatly formatted markdown
        title_resp = client.models.generate_content(
            model="gemini-2.5-flash-image-preview",
            contents=[
                "Generate a concise Title (<=10 words) for this image restoration prompt. Return ONLY the title text.",
                raw,
            ],
        )
        title_text = None
        for part in title_resp.candidates[0].content.parts:
            if getattr(part, "text", None):
                title_text = part.text.strip()
                break
        if not title_text:
            title_text = p.stem

        md_resp = client.models.generate_content(
            model="gemini-2.5-flash-image-preview",
            contents=[
                "Format the following prompt into clean, readable Markdown. Preserve technical details and structure. Add clear section headings if implied. Return ONLY markdown.",
                raw,
            ],
        )
        md_text = None
        for part in md_resp.candidates[0].content.parts:
            if getattr(part, "text", None):
                md_text = part.text
                break
        if not md_text:
            md_text = raw

        slug = slugify(title_text)
        new_name = f"{slug}{out_ext}"
        header = f"# {title_text}\n\n"
        final_md = header + md_text.lstrip()

        out_path = p.with_name(new_name)
        if apply:
            out_path.write_text(final_md, encoding="utf-8")
            if p.name != new_name:
                p.unlink(missing_ok=True)
            print(f"[APPLY] Wrote {out_path.name}")
        else:
            preview_path = p.with_name(new_name + ".preview")
            preview_path.write_text(final_md, encoding="utf-8")
            print(f"[DRY-RUN] Wrote preview {preview_path.name}")


def main():
    parser = argparse.ArgumentParser(description="Archive housekeeping utils")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p1 = sub.add_parser("suggest-photo-names", help="Propose descriptive filenames for photos")
    p1.add_argument("--photos-dir", type=Path, default=Path("old-family-photos"))
    p1.add_argument("--out-file", type=Path, default=Path("generated/housekeeping/photo_name_suggestions.jsonl"))

    p2 = sub.add_parser("apply-photo-renames", help="Apply renames from suggestions JSONL")
    p2.add_argument("--mapping-file", type=Path, default=Path("generated/housekeeping/photo_name_suggestions.jsonl"))
    p2.add_argument("--apply", action="store_true", help="Actually rename files (otherwise dry-run)")

    p3 = sub.add_parser("format-prompts", help="Format prompt files to Markdown with titles and slugs")
    p3.add_argument("--prompts-dir", type=Path, default=Path("ai-system-prompts/Image Restoration System Prompts"))
    p3.add_argument("--apply", action="store_true", help="Write .md files and remove originals; default writes .preview")

    args = parser.parse_args()

    if args.cmd == "suggest-photo-names":
        suggest_photo_names(args.photos_dir, args.out_file)
    elif args.cmd == "apply-photo-renames":
        apply_photo_renames(args.mapping_file, dry_run=not args.apply)
    elif args.cmd == "format-prompts":
        format_prompts(args.prompts_dir, apply=args.apply)


if __name__ == "__main__":
    main()
