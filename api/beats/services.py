import asyncio
import os
import traceback
import uuid
from urllib.parse import quote

from google.cloud.firestore import SERVER_TIMESTAMP
from google.cloud.storage.blob import Blob

from firebase_admin_app import get_bucket
from video.dynamic.services import generate_dynamic_video
from video.services import generate_video
from video.store import job_store


def storage_download_url(blob: Blob) -> str:
    """Return a permanent Firebase Storage download URL (token-based, no expiry)."""
    token = str(uuid.uuid4())
    blob.metadata = {"firebaseStorageDownloadTokens": token}
    blob.patch()
    bucket = blob.bucket.name
    path = quote(blob.name, safe="")
    return f"https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media&token={token}"


async def run_video_job(
    job_id: str,
    beat_ref,
    uid: str,
    beat_id: str,
    image_data: bytes,
    image_suffix: str,
    audio_data: bytes,
    audio_suffix: str,
) -> None:
    loop = asyncio.get_running_loop()

    job = await job_store.get(job_id)
    job.status = "processing"
    await job_store.save(job)

    def on_progress(pct: int) -> None:
        job.progress = pct
        asyncio.run_coroutine_threadsafe(job_store.save(job), loop)

    try:
        path = await asyncio.to_thread(
            generate_video, image_data, image_suffix, audio_data, audio_suffix, on_progress,
        )
        job.progress = 100
        job.output_path = path
        await job_store.save(job)

        bucket = get_bucket()
        blob = bucket.blob(f"users/{uid}/beats/{beat_id}/video.mp4")
        with open(path, "rb") as f:
            blob.upload_from_file(f, content_type="video/mp4")
        os.unlink(path)

        video_url = storage_download_url(blob)

        beat_ref.update({
            "videoStorageUrl": video_url,
            "is_generating": False,
            "video_job_id": None,
            "updatedAt": SERVER_TIMESTAMP,
        })
        job.status = "done"
        await job_store.save(job)
    except Exception as exc:
        traceback.print_exc()
        job.error = repr(exc)
        job.status = "failed"
        await job_store.save(job)
        beat_ref.update({
            "is_generating": False,
            "video_job_id": None,
            "updatedAt": SERVER_TIMESTAMP,
        })


async def run_dynamic_video_job(
    job_id: str,
    beat_ref,
    uid: str,
    beat_id: str,
    youtube_url: str,
    audio_data: bytes,
    audio_suffix: str,
) -> None:
    loop = asyncio.get_running_loop()

    job = await job_store.get(job_id)
    job.status = "processing"
    await job_store.save(job)

    def on_progress(pct: int) -> None:
        job.progress = pct
        asyncio.run_coroutine_threadsafe(job_store.save(job), loop)

    path: str | None = None
    try:
        path = await asyncio.to_thread(
            generate_dynamic_video, youtube_url, audio_data, audio_suffix, on_progress,
        )
        job.progress = 95
        job.output_path = path
        await job_store.save(job)

        bucket = get_bucket()
        blob = bucket.blob(f"users/{uid}/beats/{beat_id}/video.mp4")
        with open(path, "rb") as f:
            blob.upload_from_file(f, content_type="video/mp4")

        video_url = storage_download_url(blob)

        beat_ref.update({
            "videoStorageUrl": video_url,
            "is_generating": False,
            "video_job_id": None,
            "updatedAt": SERVER_TIMESTAMP,
        })
        job.status = "done"
        await job_store.save(job)
    except Exception as exc:
        traceback.print_exc()
        job.error = repr(exc)
        job.status = "failed"
        await job_store.save(job)
        beat_ref.update({
            "is_generating": False,
            "video_job_id": None,
            "updatedAt": SERVER_TIMESTAMP,
        })
    finally:
        if path and os.path.exists(path):
            os.unlink(path)