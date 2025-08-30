from google import genai


def get_genai_client() -> genai.Client:
    """Create and return a Google GenAI client.

    The client reads the API key from the GEMINI_API_KEY environment variable,
    which is the recommended approach per the official docs.
    """
    return genai.Client()
