"""Generation task API routes."""

from fastapi import APIRouter

from app.schemas.generation import (
    ImageToVideoRequest,
    TaskEstimate,
    TaskStatus,
    TextToImageRequest,
    TextToVideoRequest,
)

router = APIRouter()


@router.post("/text-to-image", response_model=dict)
async def create_text_to_image_task(request: TextToImageRequest):
    """Create text-to-image generation task."""
    # TODO: Implement task creation and queueing
    return {
        "task_id": "temp_task_id",
        "status": "queued",
        "message": "Task queued successfully",
    }


@router.post("/text-to-video", response_model=dict)
async def create_text_to_video_task(request: TextToVideoRequest):
    """Create text-to-video generation task."""
    # TODO: Implement task creation and queueing
    return {
        "task_id": "temp_task_id",
        "status": "queued",
        "message": "Task queued successfully",
    }


@router.post("/image-to-video", response_model=dict)
async def create_image_to_video_task(request: ImageToVideoRequest):
    """Create image-to-video generation task."""
    # TODO: Implement task creation and queueing
    return {
        "task_id": "temp_task_id",
        "status": "queued",
        "message": "Task queued successfully",
    }


@router.get("/tasks/{task_id}", response_model=TaskStatus)
async def get_task_status(task_id: str):
    """Get task status."""
    # TODO: Implement task status retrieval
    return TaskStatus(
        task_id=task_id,
        status="queued",
        progress=0,
        message="Task is queued",
    )


@router.post("/estimate", response_model=TaskEstimate)
async def estimate_task_cost(params: dict):
    """Estimate task cost and time."""
    # TODO: Implement cost estimation logic
    return TaskEstimate(
        estimated_time=30,
        estimated_cost=0.1,
    )
