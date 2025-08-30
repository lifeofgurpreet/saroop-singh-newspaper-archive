import base64
from io import BytesIO
from pathlib import Path
from typing import Iterable, Optional

from PIL import Image


def save_inline_image_parts(parts: Iterable, out_dir: Path, stem: str = "image") -> list[Path]:
    """Save inline image parts from a generate_content response.

    Args:
        parts: iterable of "parts" from the response (e.g., response.candidates[0].content.parts)
        out_dir: directory to save images
        stem: filename stem used for outputs

    Returns:
        List of file paths saved.
    """
    out_dir.mkdir(parents=True, exist_ok=True)
    saved: list[Path] = []
    idx = 1
    for part in parts:
        data = getattr(part, "inline_data", None)
        if data is None:
            # JS/REST style key name fallback when parts are dict-like
            data = getattr(part, "inlineData", None) or getattr(part, "inline_data", None)
        if data is None:
            continue

        mime = getattr(data, "mime_type", None) or getattr(data, "mimeType", None) or "image/png"
        ext = _ext_from_mime(mime)
        file_path = out_dir / f"{stem}_{idx}{ext}"
        idx += 1

        # google-genai Python returns raw bytes for InlineData.data
        raw = getattr(data, "data", None)
        if isinstance(raw, (bytes, bytearray)):
            img = Image.open(BytesIO(raw))
            img.save(file_path)
        else:
            # if base64 str (e.g., when using REST directly)
            if isinstance(raw, str):
                buffer = base64.b64decode(raw)
                img = Image.open(BytesIO(buffer))
                img.save(file_path)
            else:
                # Unknown format; attempt to write bytes
                if raw is not None:
                    try:
                        with open(file_path, "wb") as f:
                            f.write(raw)
                    except Exception:
                        continue
                else:
                    continue
        saved.append(file_path)
    return saved


def _ext_from_mime(mime: Optional[str]) -> str:
    if not mime:
        return ".png"
    mapping = {
        "image/png": ".png",
        "image/jpeg": ".jpg",
        "image/jpg": ".jpg",
        "image/webp": ".webp",
    }
    return mapping.get(mime.lower(), ".png")
