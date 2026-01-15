"""Version model."""

from datetime import datetime

from sqlalchemy import Boolean, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Version(Base):
    """Version model."""

    __tablename__ = "versions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    shot_id: Mapped[int] = mapped_column(Integer, ForeignKey("shots.id", ondelete="CASCADE"), nullable=False)
    type: Mapped[str] = mapped_column(String(20), nullable=False)  # image/video
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    thumb_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Generation parameters
    params: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Primary version flag
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)

    # Timestamp
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    # Relationships
    shot: Mapped["Shot"] = relationship("Shot", back_populates="versions")
