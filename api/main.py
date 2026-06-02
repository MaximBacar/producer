import logging
import os
from contextlib import asynccontextmanager

os.environ.setdefault("GRPC_VERBOSITY", "ERROR")

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")

load_dotenv()

from audio.router import router as audio_router
from beats.router import router as beats_router
from image.router import router as image_router
from video.router import router as video_router
from video.store import job_store

log = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    count = await job_store.fail_stuck_jobs()
    if count:
        log.info("startup: reset %d stuck job(s) to failed", count)
    yield


app = FastAPI(title="Producer API", lifespan=lifespan)
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
