"""Asset schemas."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class AssetBase(BaseModel):
    """Base asset schema."""

    type: Literal["character", "scene", "style", "key_object"]
    name: str = Field(..., min_length=1, max_length=100)
    description: str | None = None
    reference_images: list[str] = []
    meta: dict | None = None


class AssetCreate(AssetBase):
    """Asset creation schema."""

    project_id: int


class AssetUpdate(BaseModel):
    """Asset update schema."""

    type: Literal["character", "scene", "style", "key_object"] | None = None
    name: str | None = Field(None, min_length=1, max_length=100)
    description: str | None = None
    reference_images: list[str] | None = None
    meta: dict | None = None


class AssetResponse(AssetBase):
    """Asset response schema."""

    id: int
    project_id: int
    is_archived: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AssetReferences(BaseModel):
    """Asset references response."""

    asset_id: int
    references: list[dict]  # [{shot_id, scene_id, scene_name, shot_order}]
    can_delete: bool
