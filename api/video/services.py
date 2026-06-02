import logging
import os
import subprocess
import tempfile
from collections.abc import Callable

log = logging.getLogger(__name__)


def _get_duration(path: str) -> float:
    r = subprocess.run(
        [
            "ffprobe", "-v", "quiet",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            path,
        ],
        capture_output=True,
        text=True,
    )
    try:
        return float(r.stdout.strip())
    except (ValueError, AttributeError):
        return 0.0


def generate_video(
    image_bytes: bytes,
    image_suffix: str,
    audio_bytes: bytes,
    audio_suffix: str,
    on_progress: Callable[[int], None] | None = None,
) -> str:
    """Generate MP4 from image + audio. Returns output temp file path — caller must delete it."""
    tmp_image = _write_temp(image_bytes, image_suffix)
    tmp_audio = _write_temp(audio_bytes, audio_suffix)
    tmp_video_only = tempfile.NamedTemporaryFile(delete=False, suffix=".mp4").name
    tmp_output = tempfile.NamedTemporaryFile(delete=False, suffix=".mp4").name

    try:
        duration = _get_duration(tmp_audio)
        log.info("audio duration=%.2fs  image=%s  audio=%s", duration, image_suffix, audio_suffix)

        # Step 1: encode video frames only — 5%→65%
        log.info("step 1: encoding video frames")
        _run_ffmpeg([
            "ffmpeg", "-y", "-progress", "pipe:1", "-loglevel", "warning",
            "-loop", "1", "-r", "1/10", "-i", tmp_image,
            "-t", str(duration),
            "-vf",
            "scale=1280:720:force_original_aspect_ratio=decrease,"
            "pad=1280:720:(ow-iw)/2:(oh-ih)/2:black",
            "-r", "1/10",
            "-c:v", "libx264",
            "-tune", "stillimage",
            "-preset", "ultrafast",
            "-threads", "0",
            "-crf", "28",
            "-pix_fmt", "yuv420p",
            tmp_video_only,
        ], duration_s=duration, on_progress=on_progress, progress_start=5, progress_end=65)

        log.info("step 1: done")
        # Step 2: mux video + audio with AAC encode — 65%→99%
        log.info("step 2: muxing audio")
        _run_ffmpeg([
            "ffmpeg", "-y", "-progress", "pipe:1", "-loglevel", "warning",
            "-i", tmp_video_only,
            "-i", tmp_audio,
            "-map", "0:v:0",
            "-map", "1:a:0",
            "-c:v", "copy",
            "-c:a", "aac",
            "-b:a", "320k",
            "-ar", "48000",
            "-shortest",
            tmp_output,
        ], duration_s=duration, on_progress=on_progress, progress_start=65, progress_end=99)

    finally:
        os.unlink(tmp_image)
        os.unlink(tmp_audio)
        if os.path.exists(tmp_video_only):
            os.unlink(tmp_video_only)

    log.info("step 2: done")
    if on_progress:
        on_progress(99)

    return tmp_output


def _run_ffmpeg(
    cmd: list[str],
    duration_s: float = 0,
    on_progress: Callable[[int], None] | None = None,
    progress_start: int = 0,
    progress_end: int = 100,
) -> None:
    log.debug("ffmpeg cmd: %s", " ".join(cmd))
    tmp_stderr = tempfile.TemporaryFile()
    try:
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=tmp_stderr)
        log.info("ffmpeg pid=%d started", process.pid)
        last_pct = progress_start
        for raw in process.stdout:  # type: ignore[union-attr]
            if on_progress and duration_s > 0:
                line = raw.decode(errors="ignore").strip()
                if line.startswith("out_time_us="):
                    try:
                        us = int(line.split("=", 1)[1])
                        if us > 0:
                            pct = min(1.0, us / (duration_s * 1_000_000))
                            new_pct = int(progress_start + pct * (progress_end - progress_start))
                            if new_pct != last_pct:
                                log.info("ffmpeg progress %d%%", new_pct)
                                last_pct = new_pct
                            on_progress(new_pct)
                    except ValueError:
                        pass
        process.wait()
        log.info("ffmpeg pid=%d exited rc=%d", process.pid, process.returncode)
        tmp_stderr.seek(0)
        stderr_out = tmp_stderr.read().decode(errors="ignore").strip()
        if stderr_out:
            log.warning("ffmpeg stderr: %s", stderr_out[-800:])
        if process.returncode != 0:
            raise RuntimeError(f"ffmpeg exited {process.returncode}: {stderr_out[-400:]}")
    finally:
        tmp_stderr.close()


def _write_temp(data: bytes, suffix: str) -> str:
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as f:
        f.write(data)
        return f.name
