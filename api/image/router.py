import asyncio

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from image.services import fetch_image

router = APIRouter(prefix="/image")


@router.get("/proxy")
async def image_proxy(url: str):
    if not url.startswith(("http://", "https://")):
        raise HTTPException(status_code=422, detail="Only http/https URLs are supported")
    try:
        data, content_type = await asyncio.to_thread(fetch_image, url)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Could not fetch image: {exc}")
    return Response(content=data, media_type=content_type)
