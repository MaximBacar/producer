from pathlib import Path

from fastapi import HTTPException, UploadFile


def _suffix(upload: UploadFile) -> str:
    return Path(upload.filename or "").suffix.lower()


def _require_audio(upload: UploadFile) -> None:
    if _suffix(upload) not in {".wav", ".mp3"}:
        raise HTTPException(
            status_code=422,
            detail=f"Audio must be .wav or .mp3, got '{_suffix(upload) or 'unknown'}'",
        )
