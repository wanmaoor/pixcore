"""Consistency Lock schemas."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.asset import AssetResponse


class ConsistencyLockBase(BaseModel):
    """Base consistency lock schema."""

    lock_type: Literal["character", "style", "world", "key_object"]
    asset_id: int
    order: int = 0


class ConsistencyLockCreate(ConsistencyLockBase):
    """Consistency lock creation schema."""

    pass


class ConsistencyLockUpdate(BaseModel):
    """Consistency lock update schema."""

    order: int | None = None


class ConsistencyLockResponse(ConsistencyLockBase):
    """Consistency lock response schema."""

    id: int
    project_id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class ConsistencyLockWithAsset(BaseModel):
    """Consistency lock with full asset details."""

    id: int
    project_id: int
    lock_type: str
    order: int
    asset: AssetResponse
    created_at: datetime

    model_config = {"from_attributes": True}


class ConsistencySettingsResponse(BaseModel):
    """
    Full consistency settings for a project.
    Combines lock flags with locked assets.
    """

    # Lock flags
    lock_character: bool
    lock_style: bool
    lock_world: bool
    lock_key_object: bool

    # Locked assets by type
    locked_characters: list[AssetResponse] = []
    locked_styles: list[AssetResponse] = []
    locked_worlds: list[AssetResponse] = []
    locked_key_objects: list[AssetResponse] = []


class ConsistencySettingsUpdate(BaseModel):
    """Update consistency settings - flags and assets together."""

    # Lock flags (optional)
    lock_character: bool | None = None
    lock_style: bool | None = None
    lock_world: bool | None = None
    lock_key_object: bool | None = None

    # Locked asset IDs by type (optional, replaces all if provided)
    locked_character_ids: list[int] | None = None
    locked_style_ids: list[int] | None = None
    locked_world_ids: list[int] | None = None
    locked_key_object_ids: list[int] | None = None


class BatchLockUpdate(BaseModel):
    """Batch update locked assets for a specific type."""

    lock_type: Literal["character", "style", "world", "key_object"]
    asset_ids: list[int] = Field(default_factory=list)
