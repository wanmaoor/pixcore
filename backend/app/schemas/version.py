"""Version schemas."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class VersionBase(BaseModel):
    """Base version schema."""

    type: Literal["image", "video"]
    url: str
    thumb_url: str | None = None
    params: dict | None = None


class VersionCreate(VersionBase):
    """Version creation schema."""

    shot_id: int


class VersionResponse(VersionBase):
    """Version response schema."""

    id: int
    shot_id: int
    is_primary: bool
    created_at: datetime

    model_config = {"from_attributes": True}
