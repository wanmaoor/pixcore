"""Settings API routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.settings import Settings

router = APIRouter()


@router.get("/")
def get_settings(db: Session = Depends(get_db)):
    """Get all settings."""
    settings = db.query(Settings).all()
    return {s.key: s.value for s in settings}


@router.put("/")
def update_settings(settings: dict[str, str], db: Session = Depends(get_db)):
    """Update settings."""
    for key, value in settings.items():
        db_setting = db.query(Settings).filter(Settings.key == key).first()
        if db_setting:
            db_setting.value = value
        else:
            db_setting = Settings(key=key, value=value)
            db.add(db_setting)

    db.commit()
    return {"message": "Settings updated successfully"}


@router.get("/{key}")
def get_setting(key: str, db: Session = Depends(get_db)):
    """Get setting by key."""
    setting = db.query(Settings).filter(Settings.key == key).first()
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    return {setting.key: setting.value}
