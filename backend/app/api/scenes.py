"""Scene API routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.scene import Scene
from app.schemas.scene import SceneCreate, SceneResponse, SceneUpdate

router = APIRouter()


@router.get("/{scene_id}", response_model=SceneResponse)
def get_scene(scene_id: int, db: Session = Depends(get_db)):
    """Get scene by ID."""
    scene = db.query(Scene).filter(Scene.id == scene_id).first()
    if not scene:
        raise HTTPException(status_code=404, detail="Scene not found")
    return scene


@router.put("/{scene_id}", response_model=SceneResponse)
def update_scene(scene_id: int, scene: SceneUpdate, db: Session = Depends(get_db)):
    """Update scene."""
    db_scene = db.query(Scene).filter(Scene.id == scene_id).first()
    if not db_scene:
        raise HTTPException(status_code=404, detail="Scene not found")

    for key, value in scene.model_dump(exclude_unset=True).items():
        setattr(db_scene, key, value)

    db.commit()
    db.refresh(db_scene)
    return db_scene


@router.delete("/{scene_id}", status_code=204)
def delete_scene(scene_id: int, db: Session = Depends(get_db)):
    """Delete scene."""
    scene = db.query(Scene).filter(Scene.id == scene_id).first()
    if not scene:
        raise HTTPException(status_code=404, detail="Scene not found")

    db.delete(scene)
    db.commit()
    return None
