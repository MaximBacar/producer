import asyncio
import json
import os

import redis.asyncio as aioredis

from video.models import Job

_TTL = 3600  # 1 hour


class JobStore:
    def __init__(self, url: str):
        self._r = aioredis.Redis.from_url(url, decode_responses=True)

    def _key(self, job_id: str) -> str:
        return f"job:{job_id}"

    async def create(self, job: Job) -> None:
        await self._r.set(self._key(job.id), _serialize(job), ex=_TTL)

    async def get(self, job_id: str) -> Job | None:
        raw = await self._r.get(self._key(job_id))
        return _deserialize(raw) if raw else None

    async def save(self, job: Job) -> None:
        await self._r.set(self._key(job.id), _serialize(job), ex=_TTL)

    async def fail_stuck_jobs(self) -> int:
        """Mark any pending/processing jobs as failed. Returns count of jobs reset."""
        count = 0
        async for key in self._r.scan_iter("job:*"):
            raw = await self._r.get(key)
            if not raw:
                continue
            job = _deserialize(raw)
            if job.status in ("pending", "processing"):
                job.status = "failed"
                job.error = "Server restarted while job was running"
                await self._r.set(key, _serialize(job), ex=_TTL)
                count += 1
        return count


def _serialize(job: Job) -> str:
    return json.dumps({
        "id": job.id,
        "status": job.status,
        "output_path": job.output_path,
        "error": job.error,
        "progress": job.progress,
    })


def _deserialize(raw: str) -> Job:
    d = json.loads(raw)
    return Job(
        id=d["id"],
        status=d["status"],
        output_path=d.get("output_path"),
        error=d.get("error"),
        progress=d.get("progress", 0),
    )


job_store = JobStore(os.environ.get("REDIS_URL", "redis://localhost:6379"))
