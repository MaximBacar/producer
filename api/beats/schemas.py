from pydantic import BaseModel


class CreateBeatResponse(BaseModel):
    beat_id: str
    bpm: int
    key: str
    scale: str
