"""Asset model."""

from datetime import datetime

from sqlalchemy import Boolean, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Asset(Base):
    """Asset model."""

    __tablename__ = "assets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    project_id: Mapped[int] = mapped_column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    type: Mapped[str] = mapped_column(String(20), nullable=False)  # character/scene/style/key_object
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Reference images (JSON array of URLs)
    reference_images: Mapped[list] = mapped_column(JSON, default=list)

    # Additional metadata
    meta: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Soft delete flag
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    project: Mapped["Project"] = relationship("Project", back_populates="assets")
    consistency_locks: Mapped[list["ConsistencyLock"]] = relationship(
        "ConsistencyLock", back_populates="asset", cascade="all, delete-orphan"
    )
