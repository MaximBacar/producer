import httpx


def fetch_image(url: str) -> tuple[bytes, str]:
    """Fetch an external image. Returns (content, content_type)."""
    with httpx.Client(timeout=15, follow_redirects=True) as client:
        resp = client.get(url, headers={"User-Agent": "Mozilla/5.0"})
        resp.raise_for_status()
        content_type = resp.headers.get("content-type", "image/jpeg").split(";")[0].strip()
        return resp.content, content_type
