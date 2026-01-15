"""Scene schemas."""

from datetime import datetime

from pydantic import BaseModel, Field


class SceneBase(BaseModel):
    """Base scene schema."""

    name: str = Field(..., min_length=1, max_length=100)
    order: int = Field(default=0, ge=0)


class SceneCreate(SceneBase):
    """Scene creation schema."""

    project_id: int


class SceneUpdate(BaseModel):
    """Scene update schema."""

    name: str | None = Field(None, min_length=1, max_length=100)
    order: int | None = Field(None, ge=0)


class SceneResponse(SceneBase):
    """Scene response schema."""

    id: int
    project_id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
