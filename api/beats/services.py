import logging
import os
import traceback
import uuid
from urllib.parse import quote

from google.cloud.firestore import SERVER_TIMESTAMP
from google.cloud.storage.blob import Blob

from firebase_admin_app import get_bucket
from video.models import Job
from video.services import generate_video

log = logging.getLogger(__name__)


def storage_download_url(blob: Blob) -> str:
    """Return a permanent Firebase Storage download URL (token-based, no expiry)."""
    token = str(uuid.uuid4())
    blob.metadata = {"firebaseStorageDownloadTokens": token}
    blob.patch()
    bucket = blob.bucket.name
    path = quote(blob.name, safe="")
    return f"https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media&token={token}"


def run_video_job(
    job: Job,
    beat_ref,
    uid: str,
    beat_id: str,
    image_data: bytes,
    image_suffix: str,
    audio_data: bytes,
    audio_suffix: str,
) -> None:
    log.info("[job=%s] starting — beat=%s uid=%s image=%s audio=%s",
             job.id, beat_id, uid, image_suffix, audio_suffix)
    job.status = "processing"
    try:
        path = generate_video(
            image_data, image_suffix, audio_data, audio_suffix,
            lambda pct: setattr(job, "progress", pct),
        )
        log.info("[job=%s] ffmpeg done, output=%s size=%d bytes", job.id, path, os.path.getsize(path))
        job.progress = 100
        job.output_path = path

        bucket = get_bucket()
        blob = bucket.blob(f"users/{uid}/beats/{beat_id}/video.mp4")
        log.info("[job=%s] uploading to storage", job.id)
        with open(path, "rb") as f:
            blob.upload_from_file(f, content_type="video/mp4")
        os.unlink(path)

        video_url = storage_download_url(blob)
        log.info("[job=%s] upload complete, updating firestore", job.id)

        beat_ref.update({
            "videoStorageUrl": video_url,
            "is_generating": False,
            "video_job_id": None,
            "updatedAt": SERVER_TIMESTAMP,
        })
        job.status = "done"
        log.info("[job=%s] done", job.id)
    except Exception as exc:
        log.error("[job=%s] failed: %s", job.id, exc, exc_info=True)
        traceback.print_exc()
        job.error = repr(exc)
        job.status = "failed"
        beat_ref.update({
            "is_generating": False,
            "video_job_id": None,
            "updatedAt": SERVER_TIMESTAMP,
        })