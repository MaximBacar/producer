from dataclasses import dataclass, field
from typing import Literal


@dataclass
class Job:
    id: str
    status: Literal["pending", "processing", "done", "failed"] = "pending"
    output_path: str | None = None
    error: str | None = None
    progress: int = 0
