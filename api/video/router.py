from fastapi import APIRouter, HTTPException

from video.models import Job
from video.schemas import VideoStatusResponse

router = APIRouter(prefix="/video")

jobs: dict[str, Job] = {}


@router.get("/status/{job_id}", response_model=VideoStatusResponse)
async def video_status(job_id: str):
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return VideoStatusResponse(status=job.status, progress=job.progress, error=job.error)
