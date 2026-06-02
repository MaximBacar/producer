from pydantic import BaseModel


class BPMResponse(BaseModel):
    bpm: int


class KeyResponse(BaseModel):
    key: str
    scale: str
