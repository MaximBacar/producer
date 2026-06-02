import logging

from fastapi import APIRouter, HTTPException

from video.schemas import VideoStatusResponse
from video.store import job_store

log = logging.getLogger(__name__)
router = APIRouter(prefix="/video")


@router.get("/status/{job_id}", response_model=VideoStatusResponse)
async def video_status(job_id: str):
    try:
        job = await job_store.get(job_id)
    except Exception as e:
        log.warning("Redis error polling job %s: %s", job_id, e)
        raise HTTPException(status_code=503, detail="Status temporarily unavailable, please retry")
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return VideoStatusResponse(status=job.status, progress=job.progress, error=job.error)
