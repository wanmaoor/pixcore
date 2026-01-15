"""Asset API routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.asset import Asset
from app.models.shot import Shot
from app.schemas.asset import AssetCreate, AssetReferences, AssetResponse, AssetUpdate

router = APIRouter()


@router.get("/{asset_id}", response_model=AssetResponse)
def get_asset(asset_id: int, db: Session = Depends(get_db)):
    """Get asset by ID."""
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset


@router.put("/{asset_id}", response_model=AssetResponse)
def update_asset(asset_id: int, asset: AssetUpdate, db: Session = Depends(get_db)):
    """Update asset."""
    db_asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not db_asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    for key, value in asset.model_dump(exclude_unset=True).items():
        setattr(db_asset, key, value)

    db.commit()
    db.refresh(db_asset)
    return db_asset


@router.get("/{asset_id}/references", response_model=AssetReferences)
def get_asset_references(asset_id: int, db: Session = Depends(get_db)):
    """Get asset references (which shots use this asset)."""
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    # Find all shots that reference this asset
    shots = db.query(Shot).all()
    references = []
    for shot in shots:
        if asset_id in [ref.get("id") for ref in shot.asset_refs if isinstance(ref, dict)]:
            references.append({
                "shot_id": shot.id,
                "scene_id": shot.scene_id,
                "shot_order": shot.order,
            })

    return AssetReferences(
        asset_id=asset_id,
        references=references,
        can_delete=len(references) == 0,
    )


@router.delete("/{asset_id}", status_code=204)
def delete_asset(asset_id: int, db: Session = Depends(get_db)):
    """Delete asset (soft delete if referenced)."""
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    # Check for references
    shots = db.query(Shot).all()
    has_references = any(
        asset_id in [ref.get("id") for ref in shot.asset_refs if isinstance(ref, dict)]
        for shot in shots
    )

    if has_references:
        # Soft delete
        asset.is_archived = True
        db.commit()
    else:
        # Hard delete
        db.delete(asset)
        db.commit()

    return None
