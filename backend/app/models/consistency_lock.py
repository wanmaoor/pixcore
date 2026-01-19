"""Consistency Lock model for project-asset relationships."""

from datetime import datetime

from sqlalchemy import ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ConsistencyLock(Base):
    """
    Consistency Lock model.

    Links a project's consistency lock setting to specific assets.
    When lock_character/lock_style/lock_world/lock_key_object is enabled,
    the corresponding assets here will be injected into generation prompts.
    """

    __tablename__ = "consistency_locks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    project_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    asset_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("assets.id", ondelete="CASCADE"), nullable=False
    )
    # Lock type: character/style/world/key_object
    lock_type: Mapped[str] = mapped_column(String(20), nullable=False)
    # Display order for multiple assets of the same type
    order: Mapped[int] = mapped_column(Integer, default=0)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    # Relationships
    project: Mapped["Project"] = relationship("Project", back_populates="consistency_locks")
    asset: Mapped["Asset"] = relationship("Asset", back_populates="consistency_locks")

    # Ensure unique asset per project per lock type
    __table_args__ = (
        UniqueConstraint("project_id", "asset_id", "lock_type", name="uq_project_asset_lock"),
    )
