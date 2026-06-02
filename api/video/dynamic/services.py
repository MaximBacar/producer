import glob
import itertools
import logging
import os
import random
import re
import subprocess
import tempfile
from collections.abc import Callable

from yt_dlp import YoutubeDL

from video.services import _get_duration, _run_ffmpeg

log = logging.getLogger(__name__)

_TS_RE = re.compile(r'pts_time:(\d+\.?\d*)')
_SCORE_RE = re.compile(r'lavfi\.scene_score=(\d+\.?\d*)')


def generate_dynamic_video(
    youtube_url: str,
    audio_bytes: bytes,
    audio_suffix: str,
    on_progress: Callable[[int], None] | None = None,
) -> str:
    """Download YouTube video, extract scene clips, assemble with beat audio.

    Returns temp file path — caller must delete it after upload.
    All intermediates are cleaned automatically via TemporaryDirectory.
    """
    output_path = tempfile.NamedTemporaryFile(delete=False, suffix=".mp4").name

    with tempfile.TemporaryDirectory() as tmpdir:
        # ── Phase 1: Download (0–25%) ─────────────────────────────────────────
        log.info("dynamic_video: starting download url=%s", youtube_url)
        video_path = _download_video(youtube_url, tmpdir, on_progress)
        log.info("dynamic_video: download complete path=%s size_mb=%.1f", video_path, os.path.getsize(video_path) / 1e6)

        # ── Phase 2: Scene detection (25–35%) ────────────────────────────────
        if on_progress:
            on_progress(25)
        log.info("dynamic_video: running scene detection")
        scene_timestamps = _detect_scenes(video_path, threshold=0.25, max_scenes=20)
        log.info("dynamic_video: scene detection done scenes=%d timestamps=%s", len(scene_timestamps), scene_timestamps[:5])
        if on_progress:
            on_progress(35)

        # ── Phase 3: Clip extraction (35–60%) ────────────────────────────────
        log.info("dynamic_video: extracting %d clips", len(scene_timestamps))
        clips_dir = os.path.join(tmpdir, "clips")
        os.makedirs(clips_dir)
        clip_paths = _extract_clips(
            video_path, scene_timestamps, clips_dir,
            on_progress, progress_start=35, progress_end=60,
        )
        log.info("dynamic_video: clip extraction done clips=%d", len(clip_paths))

        # ── Phase 4: Assembly (60–95%) ────────────────────────────────────────
        log.info("dynamic_video: assembling final video")
        audio_path = os.path.join(tmpdir, f"audio{audio_suffix}")
        with open(audio_path, "wb") as f:
            f.write(audio_bytes)

        concat_txt = os.path.join(tmpdir, "concat.txt")
        _build_concat_list(clip_paths, audio_path, concat_txt)

        audio_dur = _get_duration(audio_path)
        log.info("dynamic_video: audio_dur=%.1fs output=%s", audio_dur, output_path)
        _run_ffmpeg([
            "ffmpeg", "-y", "-progress", "pipe:1", "-loglevel", "warning",
            "-f", "concat", "-safe", "0", "-i", concat_txt,
            "-i", audio_path,
            "-vf", "scale=1080:1080:flags=fast_bilinear,pad=1920:1080:(ow-iw)/2:0:black",
            "-c:v", "libx264", "-preset", "ultrafast", "-crf", "23", "-r", "12",
            "-c:a", "aac", "-b:a", "320k", "-ar", "48000",
            "-shortest",
            output_path,
        ], duration_s=audio_dur, on_progress=on_progress, progress_start=60, progress_end=95)
        log.info("dynamic_video: assembly complete")

    if on_progress:
        on_progress(95)

    return output_path


def _download_video(youtube_url: str, tmpdir: str, on_progress: Callable[[int], None] | None) -> str:
    outtmpl = os.path.join(tmpdir, "source.%(ext)s")

    def _hook(d: dict) -> None:
        if on_progress is None:
            return
        if d["status"] == "downloading":
            total = d.get("total_bytes") or d.get("total_bytes_estimate") or 0
            downloaded = d.get("downloaded_bytes", 0)
            if total > 0:
                on_progress(int(downloaded / total * 25))
        elif d["status"] == "finished":
            on_progress(25)

    ydl_opts = {
        "format": "bestvideo[ext=mp4][height<=720]/bestvideo[height<=720]/best[height<=720]",
        "outtmpl": outtmpl,
        "progress_hooks": [_hook],
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,       # only download the single video, ignore list= param
        "fixup": "never",         # skip ffmpeg fixup post-processors that can hang
        "socket_timeout": 30,
    }
    with YoutubeDL(ydl_opts) as ydl:
        ydl.download([youtube_url])

    matches = glob.glob(os.path.join(tmpdir, "source.*"))
    if not matches:
        raise RuntimeError("yt-dlp did not produce an output file")
    return matches[0]


def _detect_scenes(video_path: str, threshold: float, max_scenes: int) -> list[float]:
    log.info("_detect_scenes: running ffmpeg on %s", video_path)
    result = subprocess.run(
        [
            "ffmpeg", "-hide_banner",
            "-i", video_path,
            "-vf", f"select='gt(scene,{threshold})',metadata=print",
            "-f", "null", "-",
        ],
        capture_output=True,
        text=True,
        timeout=300,
    )
    log.info("_detect_scenes: ffmpeg returncode=%d stderr_len=%d", result.returncode, len(result.stderr))
    # ffmpeg writes metadata to stderr with -f null
    output = result.stderr + result.stdout

    scenes: list[tuple[float, float]] = []  # (score, pts_time)
    current_ts: float | None = None

    for line in output.splitlines():
        ts_match = _TS_RE.search(line)
        if ts_match:
            current_ts = float(ts_match.group(1))
        score_match = _SCORE_RE.search(line)
        if score_match and current_ts is not None:
            scenes.append((float(score_match.group(1)), current_ts))
            current_ts = None

    if len(scenes) < 3:
        # Fallback: sample uniformly
        dur = _get_duration(video_path)
        n = max(3, max_scenes)
        return [i * (dur / n) for i in range(n)]

    scenes.sort(key=lambda x: x[0], reverse=True)
    return [ts for _, ts in scenes[:max_scenes]]


def _extract_clips(
    video_path: str,
    timestamps: list[float],
    clips_dir: str,
    on_progress: Callable[[int], None] | None,
    progress_start: int,
    progress_end: int,
) -> list[str]:
    clip_paths: list[str] = []
    n = len(timestamps)

    for i, ts in enumerate(timestamps):
        out = os.path.join(clips_dir, f"clip_{i:03d}.mp4")
        subprocess.run(
            [
                "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
                "-ss", str(ts), "-t", "5", "-i", video_path,
                "-vf", "crop=min(iw\\,ih):min(iw\\,ih),scale=1080:1080,fps=12",
                "-c:v", "libx264", "-preset", "ultrafast", "-crf", "28", "-an",
                out,
            ],
            check=True,
        )
        clip_paths.append(out)
        if on_progress:
            on_progress(progress_start + int((i + 1) / n * (progress_end - progress_start)))

    return sorted(clip_paths)


def _build_concat_list(clip_paths: list[str], audio_path: str, concat_txt: str) -> None:
    audio_dur = _get_duration(audio_path)
    clip_dur = 5.0  # each clip is 5 seconds

    random.shuffle(clip_paths)
    needed = max(1, int(audio_dur / clip_dur) + 2)

    lines: list[str] = []
    for clip in itertools.islice(itertools.cycle(clip_paths), needed):
        lines.append(f"file '{clip}'")

    with open(concat_txt, "w") as f:
        f.write("\n".join(lines) + "\n")
