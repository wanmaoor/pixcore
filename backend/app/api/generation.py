"""Generation task API routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.generation import (
    ImageToVideoRequest,
    TaskEstimate,
    TaskStatus,
    TextToImageRequest,
    TextToVideoRequest,
)
from app.services.generation_service import GenerationService


router = APIRouter()


@router.post("/text-to-image", response_model=dict)
async def create_text_to_image_task(
    request: TextToImageRequest,
    db: Session = Depends(get_db),
):
    """Create text-to-image generation task."""
    service = GenerationService(db)
    task = await service.create_text_to_image_task(
        shot_id=request.shot_id,
        prompt=request.prompt,
        negative_prompt=request.negative_prompt,
        model=request.model,
        params=request.params,
    )
    return {
        "task_id": task.task_id,
        "status": task.status,
        "message": task.message,
    }


@router.post("/text-to-video", response_model=dict)
async def create_text_to_video_task(
    request: TextToVideoRequest,
    db: Session = Depends(get_db),
):
    """Create text-to-video generation task."""
    service = GenerationService(db)
    task = await service.create_text_to_video_task(
        shot_id=request.shot_id,
        prompt=request.prompt,
        negative_prompt=request.negative_prompt,
        model=request.model,
        params=request.params,
    )
    return {
        "task_id": task.task_id,
        "status": task.status,
        "message": task.message,
    }


@router.post("/image-to-video", response_model=dict)
async def create_image_to_video_task(
    request: ImageToVideoRequest,
    db: Session = Depends(get_db),
):
    """Create image-to-video generation task."""
    service = GenerationService(db)
    task = await service.create_image_to_video_task(
        shot_id=request.shot_id,
        image_url=request.image_url,
        prompt=request.prompt,
        model=request.model,
        params=request.params,
    )
    return {
        "task_id": task.task_id,
        "status": task.status,
        "message": task.message,
    }


@router.get("/tasks/{task_id}", response_model=TaskStatus)
async def get_task_status(task_id: str):
    """Get task status."""
    task = GenerationService.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    return TaskStatus(
        task_id=task.task_id,
        status=task.status,
        progress=task.progress,
        message=task.message,
        result_url=task.result_url,
    )


@router.post("/estimate", response_model=TaskEstimate)
async def estimate_task_cost(params: dict):
    """Estimate task cost and time."""
    task_type = params.get("task_type", "text-to-image")
    estimated_time, estimated_cost = GenerationService.estimate_cost(task_type, params)

    return TaskEstimate(
        estimated_time=estimated_time,
        estimated_cost=estimated_cost,
    )
