"""Consistency Lock API routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.asset import Asset
from app.models.consistency_lock import ConsistencyLock
from app.models.project import Project
from app.schemas.asset import AssetResponse
from app.schemas.consistency_lock import (
    BatchLockUpdate,
    ConsistencyLockCreate,
    ConsistencyLockResponse,
    ConsistencySettingsResponse,
    ConsistencySettingsUpdate,
)

router = APIRouter()


@router.get("/{project_id}/consistency", response_model=ConsistencySettingsResponse)
def get_consistency_settings(project_id: int, db: Session = Depends(get_db)):
    """Get full consistency settings for a project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Get all locked assets grouped by type
    locks = (
        db.query(ConsistencyLock)
        .filter(ConsistencyLock.project_id == project_id)
        .order_by(ConsistencyLock.lock_type, ConsistencyLock.order)
        .all()
    )

    # Group assets by lock type
    locked_characters = []
    locked_styles = []
    locked_worlds = []
    locked_key_objects = []

    for lock in locks:
        asset = db.query(Asset).filter(Asset.id == lock.asset_id).first()
        if asset and not asset.is_archived:
            asset_response = AssetResponse.model_validate(asset)
            if lock.lock_type == "character":
                locked_characters.append(asset_response)
            elif lock.lock_type == "style":
                locked_styles.append(asset_response)
            elif lock.lock_type == "world":
                locked_worlds.append(asset_response)
            elif lock.lock_type == "key_object":
                locked_key_objects.append(asset_response)

    return ConsistencySettingsResponse(
        lock_character=project.lock_character,
        lock_style=project.lock_style,
        lock_world=project.lock_world,
        lock_key_object=project.lock_key_object,
        locked_characters=locked_characters,
        locked_styles=locked_styles,
        locked_worlds=locked_worlds,
        locked_key_objects=locked_key_objects,
    )


@router.put("/{project_id}/consistency", response_model=ConsistencySettingsResponse)
def update_consistency_settings(
    project_id: int,
    settings: ConsistencySettingsUpdate,
    db: Session = Depends(get_db),
):
    """Update consistency settings for a project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Update lock flags
    if settings.lock_character is not None:
        project.lock_character = settings.lock_character
    if settings.lock_style is not None:
        project.lock_style = settings.lock_style
    if settings.lock_world is not None:
        project.lock_world = settings.lock_world
    if settings.lock_key_object is not None:
        project.lock_key_object = settings.lock_key_object

    # Update locked assets if provided
    def update_locks(lock_type: str, asset_ids: list[int] | None):
        if asset_ids is None:
            return

        # Remove existing locks for this type
        db.query(ConsistencyLock).filter(
            ConsistencyLock.project_id == project_id,
            ConsistencyLock.lock_type == lock_type,
        ).delete()

        # Add new locks
        for order, asset_id in enumerate(asset_ids):
            # Verify asset exists and belongs to project
            asset = db.query(Asset).filter(
                Asset.id == asset_id,
                Asset.project_id == project_id,
            ).first()
            if asset:
                lock = ConsistencyLock(
                    project_id=project_id,
                    asset_id=asset_id,
                    lock_type=lock_type,
                    order=order,
                )
                db.add(lock)

    update_locks("character", settings.locked_character_ids)
    update_locks("style", settings.locked_style_ids)
    update_locks("world", settings.locked_world_ids)
    update_locks("key_object", settings.locked_key_object_ids)

    db.commit()
    db.refresh(project)

    # Return updated settings
    return get_consistency_settings(project_id, db)


@router.post("/{project_id}/consistency/locks", response_model=ConsistencyLockResponse)
def add_consistency_lock(
    project_id: int,
    lock: ConsistencyLockCreate,
    db: Session = Depends(get_db),
):
    """Add a single asset to consistency lock."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Verify asset exists and belongs to project
    asset = db.query(Asset).filter(
        Asset.id == lock.asset_id,
        Asset.project_id == project_id,
    ).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found in this project")

    # Check if already locked
    existing = db.query(ConsistencyLock).filter(
        ConsistencyLock.project_id == project_id,
        ConsistencyLock.asset_id == lock.asset_id,
        ConsistencyLock.lock_type == lock.lock_type,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Asset already locked for this type")

    # Get max order for this lock type
    max_order = (
        db.query(ConsistencyLock)
        .filter(
            ConsistencyLock.project_id == project_id,
            ConsistencyLock.lock_type == lock.lock_type,
        )
        .count()
    )

    db_lock = ConsistencyLock(
        project_id=project_id,
        asset_id=lock.asset_id,
        lock_type=lock.lock_type,
        order=max_order,
    )
    db.add(db_lock)
    db.commit()
    db.refresh(db_lock)
    return db_lock


@router.delete("/{project_id}/consistency/locks/{lock_id}", status_code=204)
def remove_consistency_lock(
    project_id: int,
    lock_id: int,
    db: Session = Depends(get_db),
):
    """Remove a single asset from consistency lock."""
    lock = db.query(ConsistencyLock).filter(
        ConsistencyLock.id == lock_id,
        ConsistencyLock.project_id == project_id,
    ).first()
    if not lock:
        raise HTTPException(status_code=404, detail="Lock not found")

    db.delete(lock)
    db.commit()
    return None


@router.put("/{project_id}/consistency/locks/batch", response_model=ConsistencySettingsResponse)
def batch_update_locks(
    project_id: int,
    batch: BatchLockUpdate,
    db: Session = Depends(get_db),
):
    """Batch update locked assets for a specific type."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Remove existing locks for this type
    db.query(ConsistencyLock).filter(
        ConsistencyLock.project_id == project_id,
        ConsistencyLock.lock_type == batch.lock_type,
    ).delete()

    # Add new locks
    for order, asset_id in enumerate(batch.asset_ids):
        # Verify asset exists and belongs to project
        asset = db.query(Asset).filter(
            Asset.id == asset_id,
            Asset.project_id == project_id,
        ).first()
        if asset:
            lock = ConsistencyLock(
                project_id=project_id,
                asset_id=asset_id,
                lock_type=batch.lock_type,
                order=order,
            )
            db.add(lock)

    db.commit()

    # Return updated settings
    return get_consistency_settings(project_id, db)


@router.get("/{project_id}/consistency/prompt-injection")
def get_prompt_injection(project_id: int, db: Session = Depends(get_db)):
    """
    Get the consistency prompt injection text for AI generation.
    This combines all locked asset descriptions into a structured prompt.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    injections = []

    # Get locked assets
    locks = (
        db.query(ConsistencyLock)
        .filter(ConsistencyLock.project_id == project_id)
        .order_by(ConsistencyLock.lock_type, ConsistencyLock.order)
        .all()
    )

    # Group by type and build injection text
    type_descriptions = {
        "character": [],
        "style": [],
        "world": [],
        "key_object": [],
    }

    for lock in locks:
        # Check if this lock type is enabled
        lock_enabled = False
        if lock.lock_type == "character" and project.lock_character:
            lock_enabled = True
        elif lock.lock_type == "style" and project.lock_style:
            lock_enabled = True
        elif lock.lock_type == "world" and project.lock_world:
            lock_enabled = True
        elif lock.lock_type == "key_object" and project.lock_key_object:
            lock_enabled = True

        if lock_enabled:
            asset = db.query(Asset).filter(Asset.id == lock.asset_id).first()
            if asset and not asset.is_archived and asset.description:
                type_descriptions[lock.lock_type].append(
                    f"- {asset.name}: {asset.description}"
                )

    # Build structured prompt
    if type_descriptions["character"]:
        injections.append(f"[Characters]\n" + "\n".join(type_descriptions["character"]))

    if type_descriptions["style"]:
        injections.append(f"[Visual Style]\n" + "\n".join(type_descriptions["style"]))

    if type_descriptions["world"]:
        injections.append(f"[World/Environment]\n" + "\n".join(type_descriptions["world"]))

    if type_descriptions["key_object"]:
        injections.append(f"[Key Objects]\n" + "\n".join(type_descriptions["key_object"]))

    return {
        "project_id": project_id,
        "injection_text": "\n\n".join(injections) if injections else "",
        "has_injections": len(injections) > 0,
        "active_locks": {
            "character": project.lock_character and len(type_descriptions["character"]) > 0,
            "style": project.lock_style and len(type_descriptions["style"]) > 0,
            "world": project.lock_world and len(type_descriptions["world"]) > 0,
            "key_object": project.lock_key_object and len(type_descriptions["key_object"]) > 0,
        },
    }
