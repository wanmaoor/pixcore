"""Project model."""

from datetime import datetime

from sqlalchemy import Boolean, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Project(Base):
    """Project model."""

    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    type: Mapped[str] = mapped_column(String(20), default="story")
    resolution: Mapped[dict] = mapped_column(JSON, default={"width": 1920, "height": 1080})
    fps: Mapped[int] = mapped_column(Integer, default=24)
    default_model: Mapped[str | None] = mapped_column(String(50), nullable=True)
    default_params: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    default_negative_prompt: Mapped[str | None] = mapped_column(String, nullable=True)

    # Consistency locks
    lock_character: Mapped[bool] = mapped_column(Boolean, default=False)
    lock_style: Mapped[bool] = mapped_column(Boolean, default=False)
    lock_world: Mapped[bool] = mapped_column(Boolean, default=False)
    lock_key_object: Mapped[bool] = mapped_column(Boolean, default=False)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    scenes: Mapped[list["Scene"]] = relationship("Scene", back_populates="project", cascade="all, delete-orphan")
    assets: Mapped[list["Asset"]] = relationship("Asset", back_populates="project", cascade="all, delete-orphan")
