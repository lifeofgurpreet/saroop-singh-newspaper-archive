import os
from typing import Optional

try:
    # Optional: load from .env if present
    from dotenv import load_dotenv  # type: ignore

    load_dotenv()  # nosec - local dev convenience only
except Exception:
    # dotenv is optional
    pass


def get_api_key(explicit_key: Optional[str] = None) -> str:
    """Return the Gemini API key.

    Order of resolution:
    1) explicit_key argument
    2) GEMINI_API_KEY env var (recommended by Google GenAI SDK)
    """
    key = explicit_key or os.getenv("GEMINI_API_KEY")
    if not key:
        raise RuntimeError(
            "Missing GEMINI_API_KEY. Set it in your environment or .env file."
        )
    return key


def load_settings() -> dict:
    """Load basic settings for the Gemini client.

    Currently just returns the API key if present. The google-genai client will
    pick up GEMINI_API_KEY automatically; we still validate presence for a
    clearer error message.
    """
    # Will raise clearly if not set
    _ = get_api_key()
    return {"api_key_env": "GEMINI_API_KEY"}
