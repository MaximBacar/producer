import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv(Path(__file__).parent.parent / ".env.local")

from audio.router import router as audio_router
from beats.router import router as beats_router
from image.router import router as image_router
from video.router import router as video_router

app = FastAPI(title="Producer API")
_frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[_frontend_url],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(audio_router)
app.include_router(beats_router)
app.include_router(video_router)
app.include_router(image_router)
