"""Shot API routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.shot import Shot
from app.schemas.shot import ShotCreate, ShotResponse, ShotUpdate

router = APIRouter()


@router.get("/{shot_id}", response_model=ShotResponse)
def get_shot(shot_id: int, db: Session = Depends(get_db)):
    """Get shot by ID."""
    shot = db.query(Shot).filter(Shot.id == shot_id).first()
    if not shot:
        raise HTTPException(status_code=404, detail="Shot not found")
    return shot


@router.put("/{shot_id}", response_model=ShotResponse)
def update_shot(shot_id: int, shot: ShotUpdate, db: Session = Depends(get_db)):
    """Update shot."""
    db_shot = db.query(Shot).filter(Shot.id == shot_id).first()
    if not db_shot:
        raise HTTPException(status_code=404, detail="Shot not found")

    for key, value in shot.model_dump(exclude_unset=True).items():
        setattr(db_shot, key, value)

    db.commit()
    db.refresh(db_shot)
    return db_shot


@router.delete("/{shot_id}", status_code=204)
def delete_shot(shot_id: int, db: Session = Depends(get_db)):
    """Delete shot."""
    shot = db.query(Shot).filter(Shot.id == shot_id).first()
    if not shot:
        raise HTTPException(status_code=404, detail="Shot not found")

    db.delete(shot)
    db.commit()
    return None
