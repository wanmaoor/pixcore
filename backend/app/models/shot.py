"""Shot model."""

from datetime import datetime

from sqlalchemy import Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Shot(Base):
    """Shot model."""

    __tablename__ = "shots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    scene_id: Mapped[int] = mapped_column(Integer, ForeignKey("scenes.id", ondelete="CASCADE"), nullable=False)
    order: Mapped[int] = mapped_column(Integer, default=0)

    # Shot details
    shot_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    camera_move: Mapped[str | None] = mapped_column(String(50), nullable=True)
    duration: Mapped[float] = mapped_column(Float, default=5.0)
    composition: Mapped[str | None] = mapped_column(String(50), nullable=True)
    lens: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Descriptions
    story_desc: Mapped[str | None] = mapped_column(Text, nullable=True)
    visual_desc: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Prompts
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    negative_prompt: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Asset references (JSON array of {type, id, snapshot})
    asset_refs: Mapped[list] = mapped_column(JSON, default=list)

    # Status
    status: Mapped[str] = mapped_column(String(20), default="pending")

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    scene: Mapped["Scene"] = relationship("Scene", back_populates="shots")
    versions: Mapped[list["Version"]] = relationship("Version", back_populates="shot", cascade="all, delete-orphan")
