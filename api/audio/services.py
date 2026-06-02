import os
import tempfile

from essentia.standard import KeyExtractor, MonoLoader, RhythmExtractor2013


def analyze_key(audio_bytes: bytes, suffix: str) -> tuple[str, str]:
    tmp = _write_temp(audio_bytes, suffix)
    try:
        audio = MonoLoader(filename=tmp)()
        key, scale, _ = KeyExtractor()(audio)
        return key, scale
    finally:
        os.unlink(tmp)


def analyze_bpm(audio_bytes: bytes, suffix: str) -> int:
    tmp = _write_temp(audio_bytes, suffix)
    try:
        audio = MonoLoader(filename=tmp)()
        bpm, _, _, _, _ = RhythmExtractor2013()(audio)
        return round(bpm)
    finally:
        os.unlink(tmp)


def _write_temp(data: bytes, suffix: str) -> str:
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as f:
        f.write(data)
        return f.name
