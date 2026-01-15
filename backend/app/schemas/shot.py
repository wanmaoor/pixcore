"""Shot schemas."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class ShotBase(BaseModel):
    """Base shot schema."""

    order: int = Field(default=0, ge=0)
    shot_type: str | None = None
    camera_move: str | None = None
    duration: float = Field(default=5.0, gt=0)
    composition: str | None = None
    lens: str | None = None
    story_desc: str | None = None
    visual_desc: str | None = None
    prompt: str
    negative_prompt: str | None = None
    asset_refs: list[dict] = []


class ShotCreate(ShotBase):
    """Shot creation schema."""

    scene_id: int


class ShotUpdate(BaseModel):
    """Shot update schema."""

    order: int | None = Field(None, ge=0)
    shot_type: str | None = None
    camera_move: str | None = None
    duration: float | None = Field(None, gt=0)
    composition: str | None = None
    lens: str | None = None
    story_desc: str | None = None
    visual_desc: str | None = None
    prompt: str | None = None
    negative_prompt: str | None = None
    asset_refs: list[dict] | None = None
    status: Literal["pending", "generating", "completed", "failed"] | None = None


class ShotResponse(ShotBase):
    """Shot response schema."""

    id: int
    scene_id: int
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
