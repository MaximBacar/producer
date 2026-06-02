import asyncio
import os
import uuid
from urllib.parse import quote

import httpx
from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, Response, UploadFile
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from google.cloud.firestore import SERVER_TIMESTAMP
from google.cloud.storage.blob import Blob

from audio.services import analyze_bpm, analyze_key
from beats.schemas import CreateBeatResponse
from firebase_admin_app import get_bucket, get_firestore, verify_token
from utils import _require_audio, _suffix
from video.models import Job
from video.router import jobs
from video.services import generate_video

router = APIRouter(prefix="/beats")
_bearer = HTTPBearer()


def _storage_download_url(blob: Blob) -> str:
    """Return a permanent Firebase Storage download URL (token-based, no expiry)."""
    token = str(uuid.uuid4())
    blob.metadata = {"firebaseStorageDownloadTokens": token}
    blob.patch()
    bucket = blob.bucket.name
    path = quote(blob.name, safe="")
    return f"https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media&token={token}"


def _get_uid(creds: HTTPAuthorizationCredentials = Depends(_bearer)) -> str:
    try:
        return verify_token(creds.credentials)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


@router.post("", status_code=201, response_model=CreateBeatResponse)
async def create_beat(
    title: str = Form(...),
    audio: UploadFile = File(...),
    uid: str = Depends(_get_uid),
):
    _require_audio(audio)
    suffix = _suffix(audio)
    audio_bytes = await audio.read()

    bpm, (key, scale) = await asyncio.gather(
        asyncio.to_thread(analyze_bpm, audio_bytes, suffix),
        asyncio.to_thread(analyze_key, audio_bytes, suffix),
    )

    beat_id = str(uuid.uuid4())

    bucket = get_bucket()
    blob = bucket.blob(f"users/{uid}/beats/{beat_id}/audio{suffix}")
    blob.upload_from_string(audio_bytes, content_type=audio.content_type or "audio/mpeg")
    audio_url = _storage_download_url(blob)

    db = get_firestore()
    db.collection("users").document(uid).collection("beats").document(beat_id).set({
        "name": title,
        "artists": [],
        "bpm": bpm,
        "key": key,
        "scale": scale,
        "audioStorageUrl": audio_url,
        "videoStorageUrl": None,
        "videoTitle": None,
        "videoDescription": None,
        "is_generating": False,
        "video_job_id": None,
        "createdAt": SERVER_TIMESTAMP,
        "updatedAt": SERVER_TIMESTAMP,
    })

    return CreateBeatResponse(beat_id=beat_id, bpm=bpm, key=key, scale=scale)


@router.post("/{beat_id}/generate-video", status_code=202)
async def beat_generate_video(
    beat_id: str,
    background_tasks: BackgroundTasks,
    image: UploadFile = File(...),
    uid: str = Depends(_get_uid),
):
    db = get_firestore()
    beat_ref = db.collection("users").document(uid).collection("beats").document(beat_id)
    beat_doc = beat_ref.get()
    if not beat_doc.exists:
        raise HTTPException(status_code=404, detail="Beat not found")

    audio_url = beat_doc.to_dict().get("audioStorageUrl")
    if not audio_url:
        raise HTTPException(status_code=422, detail="Beat has no audio file")

    image_data = await image.read()
    image_suffix = _suffix(image)

    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.get(audio_url)
        resp.raise_for_status()
        audio_data = resp.content
        ct = resp.headers.get("content-type", "")
        audio_suffix = ".wav" if "wav" in ct else ".mp3"

    job = Job(id=str(uuid.uuid4()))
    jobs[job.id] = job

    beat_ref.update({
        "is_generating": True,
        "video_job_id": job.id,
        "updatedAt": SERVER_TIMESTAMP,
    })

    def _run() -> None:
        job.status = "processing"
        try:
            path = generate_video(
                image_data, image_suffix, audio_data, audio_suffix,
                lambda pct: setattr(job, "progress", pct),
            )
            job.progress = 100
            job.output_path = path

            bucket = get_bucket()
            blob = bucket.blob(f"users/{uid}/beats/{beat_id}/video.mp4")
            with open(path, "rb") as f:
                blob.upload_from_file(f, content_type="video/mp4")
            os.unlink(path)

            video_url = _storage_download_url(blob)

            beat_ref.update({
                "videoStorageUrl": video_url,
                "is_generating": False,
                "video_job_id": None,
                "updatedAt": SERVER_TIMESTAMP,
            })
            job.status = "done"
        except Exception as exc:
            import traceback
            traceback.print_exc()
            job.error = repr(exc)
            job.status = "failed"
            beat_ref.update({
                "is_generating": False,
                "video_job_id": None,
                "updatedAt": SERVER_TIMESTAMP,
            })

    background_tasks.add_task(_run)
    return {"job_id": job.id}


@router.delete("/{beat_id}", status_code=204)
async def delete_beat(beat_id: str, uid: str = Depends(_get_uid)):
    db = get_firestore()
    beat_ref = db.collection("users").document(uid).collection("beats").document(beat_id)
    if not beat_ref.get().exists:
        raise HTTPException(status_code=404, detail="Beat not found")

    beat_ref.delete()

    bucket = get_bucket()
    blobs = list(bucket.list_blobs(prefix=f"users/{uid}/beats/{beat_id}/"))
    if blobs:
        bucket.delete_blobs(blobs)

    return Response(status_code=204)
