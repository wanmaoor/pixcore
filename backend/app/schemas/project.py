"""Project schemas."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class ProjectBase(BaseModel):
    """Base project schema."""

    name: str = Field(..., min_length=2, max_length=50)
    type: Literal["story", "animation", "short"] = "story"
    resolution: dict[str, int] = {"width": 1920, "height": 1080}
    fps: int = Field(default=24, ge=1, le=120)
    default_model: str | None = None
    default_params: dict | None = None
    default_negative_prompt: str | None = None


class ProjectCreate(ProjectBase):
    """Project creation schema."""

    lock_character: bool = False
    lock_style: bool = False
    lock_world: bool = False
    lock_key_object: bool = False


class ProjectUpdate(BaseModel):
    """Project update schema."""

    name: str | None = Field(None, min_length=2, max_length=50)
    type: Literal["story", "animation", "short"] | None = None
    resolution: dict[str, int] | None = None
    fps: int | None = Field(None, ge=1, le=120)
    default_model: str | None = None
    default_params: dict | None = None
    default_negative_prompt: str | None = None
    lock_character: bool | None = None
    lock_style: bool | None = None
    lock_world: bool | None = None
    lock_key_object: bool | None = None


class ProjectResponse(ProjectBase):
    """Project response schema."""

    id: int
    lock_character: bool
    lock_style: bool
    lock_world: bool
    lock_key_object: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
