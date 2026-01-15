"""Generation task schemas."""

from typing import Literal

from pydantic import BaseModel, Field


class GenerationTaskBase(BaseModel):
    """Base generation task schema."""

    prompt: str
    negative_prompt: str | None = None
    params: dict = {}


class TextToImageRequest(GenerationTaskBase):
    """Text-to-image generation request."""

    shot_id: int
    resolution: tuple[int, int] = (1024, 1024)


class TextToVideoRequest(GenerationTaskBase):
    """Text-to-video generation request."""

    shot_id: int
    duration: float = Field(default=5.0, gt=0, le=30)
    fps: int = Field(default=24, ge=1, le=60)


class ImageToVideoRequest(BaseModel):
    """Image-to-video generation request."""

    shot_id: int
    image_url: str
    prompt: str | None = None
    duration: float = Field(default=5.0, gt=0, le=30)
    fps: int = Field(default=24, ge=1, le=60)
    params: dict = {}


class TaskStatus(BaseModel):
    """Task status response."""

    task_id: str
    status: Literal["queued", "running", "success", "failed"]
    progress: int = Field(ge=0, le=100)
    message: str | None = None
    result: dict | None = None


class TaskEstimate(BaseModel):
    """Task cost and time estimate."""

    estimated_time: int  # seconds
    estimated_cost: float | None = None
