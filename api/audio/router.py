import asyncio

from fastapi import APIRouter, File, UploadFile

from audio.schemas import BPMResponse, KeyResponse
from audio.services import analyze_bpm, analyze_key
from utils import _require_audio, _suffix

router = APIRouter(prefix="/audio")


@router.post("/key", response_model=KeyResponse)
async def audio_key(audio: UploadFile = File(...)):
    _require_audio(audio)
    data = await audio.read()
    key, scale = await asyncio.to_thread(analyze_key, data, _suffix(audio))
    return KeyResponse(key=key, scale=scale)


@router.post("/bpm", response_model=BPMResponse)
async def audio_bpm(audio: UploadFile = File(...)):
    _require_audio(audio)
    data = await audio.read()
    bpm = await asyncio.to_thread(analyze_bpm, data, _suffix(audio))
    return BPMResponse(bpm=bpm)
