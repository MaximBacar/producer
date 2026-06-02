from pydantic import BaseModel


class VideoGenerateResponse(BaseModel):
    job_id: str


class VideoStatusResponse(BaseModel):
    status: str
    progress: int
    error: str | None = None
