"""Version API routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.version import Version
from app.schemas.version import VersionResponse

router = APIRouter()


@router.get("/{version_id}", response_model=VersionResponse)
def get_version(version_id: int, db: Session = Depends(get_db)):
    """Get version by ID."""
    version = db.query(Version).filter(Version.id == version_id).first()
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    return version


@router.post("/{version_id}/set-primary", response_model=VersionResponse)
def set_primary_version(version_id: int, db: Session = Depends(get_db)):
    """Set version as primary."""
    version = db.query(Version).filter(Version.id == version_id).first()
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")

    # Unset other primary versions for the same shot
    db.query(Version).filter(
        Version.shot_id == version.shot_id, Version.id != version_id
    ).update({"is_primary": False})

    # Set this version as primary
    version.is_primary = True
    db.commit()
    db.refresh(version)
    return version


@router.delete("/{version_id}", status_code=204)
def delete_version(version_id: int, db: Session = Depends(get_db)):
    """Delete version."""
    version = db.query(Version).filter(Version.id == version_id).first()
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")

    if version.is_primary:
        raise HTTPException(status_code=400, detail="Cannot delete primary version")

    db.delete(version)
    db.commit()
    return None
