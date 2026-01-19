"""AI Generation Service - Handles text-to-image, text-to-video, image-to-video generation."""

import asyncio
import hashlib
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Literal

import httpx
from loguru import logger
from sqlalchemy.orm import Session

from app.config import settings
from app.models.version import Version


class GenerationTask:
    """Represents an in-progress generation task."""

    def __init__(
        self,
        task_id: str,
        shot_id: int,
        task_type: Literal["text-to-image", "text-to-video", "image-to-video"],
        prompt: str,
        params: dict[str, Any] | None = None,
    ):
        self.task_id = task_id
        self.shot_id = shot_id
        self.task_type = task_type
        self.prompt = prompt
        self.params = params or {}
        self.status: Literal["queued", "running", "success", "failed"] = "queued"
        self.progress: int = 0
        self.message: str = "Task queued"
        self.result_url: str | None = None
        self.error: str | None = None
        self.created_at = datetime.utcnow()


# In-memory task store (for MVP; production would use Redis/DB)
_tasks: dict[str, GenerationTask] = {}


class GenerationService:
    """Service for handling AI generation tasks."""

    def __init__(self, db: Session):
        self.db = db

    @staticmethod
    def _generate_task_id() -> str:
        """Generate unique task ID."""
        return str(uuid.uuid4())

    @staticmethod
    def get_task(task_id: str) -> GenerationTask | None:
        """Get task by ID."""
        return _tasks.get(task_id)

    async def create_text_to_image_task(
        self,
        shot_id: int,
        prompt: str,
        negative_prompt: str | None = None,
        model: str | None = None,
        params: dict[str, Any] | None = None,
    ) -> GenerationTask:
        """Create and queue a text-to-image task."""
        task_id = self._generate_task_id()
        task = GenerationTask(
            task_id=task_id,
            shot_id=shot_id,
            task_type="text-to-image",
            prompt=prompt,
            params={
                "negative_prompt": negative_prompt,
                "model": model or settings.default_image_model,
                **(params or {}),
            },
        )
        _tasks[task_id] = task

        # Start async generation
        asyncio.create_task(self._run_text_to_image(task))

        return task

    async def create_text_to_video_task(
        self,
        shot_id: int,
        prompt: str,
        negative_prompt: str | None = None,
        model: str | None = None,
        params: dict[str, Any] | None = None,
    ) -> GenerationTask:
        """Create and queue a text-to-video task."""
        task_id = self._generate_task_id()
        task = GenerationTask(
            task_id=task_id,
            shot_id=shot_id,
            task_type="text-to-video",
            prompt=prompt,
            params={
                "negative_prompt": negative_prompt,
                "model": model or settings.default_video_model,
                **(params or {}),
            },
        )
        _tasks[task_id] = task

        # Start async generation
        asyncio.create_task(self._run_text_to_video(task))

        return task

    async def create_image_to_video_task(
        self,
        shot_id: int,
        image_url: str,
        prompt: str | None = None,
        model: str | None = None,
        params: dict[str, Any] | None = None,
    ) -> GenerationTask:
        """Create and queue an image-to-video task."""
        task_id = self._generate_task_id()
        task = GenerationTask(
            task_id=task_id,
            shot_id=shot_id,
            task_type="image-to-video",
            prompt=prompt or "",
            params={
                "image_url": image_url,
                "model": model or settings.default_video_model,
                **(params or {}),
            },
        )
        _tasks[task_id] = task

        # Start async generation
        asyncio.create_task(self._run_image_to_video(task))

        return task

    async def _run_text_to_image(self, task: GenerationTask) -> None:
        """Execute text-to-image generation."""
        task.status = "running"
        task.message = "Generating image..."
        task.progress = 10

        try:
            # Check if Replicate API token is configured
            if settings.replicate_api_token:
                result_url = await self._call_replicate_image(task)
            else:
                # Fallback: generate placeholder for development
                logger.warning("No AI API configured, using placeholder image")
                result_url = await self._generate_placeholder_image(task)

            task.progress = 90
            task.message = "Saving result..."

            # Save to storage and create version
            saved_url = await self._save_result(task, result_url, "image")

            task.status = "success"
            task.progress = 100
            task.result_url = saved_url
            task.message = "Generation completed"

            # Create version record
            await self._create_version(task, saved_url, "image")

        except Exception as e:
            logger.error(f"Generation failed: {e}")
            task.status = "failed"
            task.error = str(e)
            task.message = f"Generation failed: {e}"

    async def _run_text_to_video(self, task: GenerationTask) -> None:
        """Execute text-to-video generation."""
        task.status = "running"
        task.message = "Generating video..."
        task.progress = 10

        try:
            if settings.replicate_api_token:
                result_url = await self._call_replicate_video(task)
            else:
                logger.warning("No AI API configured, using placeholder video")
                result_url = await self._generate_placeholder_video(task)

            task.progress = 90
            task.message = "Saving result..."

            saved_url = await self._save_result(task, result_url, "video")

            task.status = "success"
            task.progress = 100
            task.result_url = saved_url
            task.message = "Generation completed"

            await self._create_version(task, saved_url, "video")

        except Exception as e:
            logger.error(f"Generation failed: {e}")
            task.status = "failed"
            task.error = str(e)
            task.message = f"Generation failed: {e}"

    async def _run_image_to_video(self, task: GenerationTask) -> None:
        """Execute image-to-video generation."""
        task.status = "running"
        task.message = "Converting image to video..."
        task.progress = 10

        try:
            if settings.replicate_api_token:
                result_url = await self._call_replicate_i2v(task)
            else:
                logger.warning("No AI API configured, using placeholder video")
                result_url = await self._generate_placeholder_video(task)

            task.progress = 90
            task.message = "Saving result..."

            saved_url = await self._save_result(task, result_url, "video")

            task.status = "success"
            task.progress = 100
            task.result_url = saved_url
            task.message = "Generation completed"

            await self._create_version(task, saved_url, "video")

        except Exception as e:
            logger.error(f"Generation failed: {e}")
            task.status = "failed"
            task.error = str(e)
            task.message = f"Generation failed: {e}"

    async def _call_replicate_image(self, task: GenerationTask) -> str:
        """Call Replicate API for image generation."""
        async with httpx.AsyncClient() as client:
            # Create prediction
            response = await client.post(
                "https://api.replicate.com/v1/predictions",
                headers={
                    "Authorization": f"Token {settings.replicate_api_token}",
                    "Content-Type": "application/json",
                },
                json={
                    "version": "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",  # SDXL
                    "input": {
                        "prompt": task.prompt,
                        "negative_prompt": task.params.get("negative_prompt", ""),
                        "width": task.params.get("width", 1024),
                        "height": task.params.get("height", 1024),
                    },
                },
                timeout=30.0,
            )
            response.raise_for_status()
            prediction = response.json()

            # Poll for completion
            prediction_id = prediction["id"]
            for _ in range(120):  # Max 2 minutes
                await asyncio.sleep(1)
                task.progress = min(task.progress + 1, 85)

                response = await client.get(
                    f"https://api.replicate.com/v1/predictions/{prediction_id}",
                    headers={"Authorization": f"Token {settings.replicate_api_token}"},
                    timeout=10.0,
                )
                response.raise_for_status()
                result = response.json()

                if result["status"] == "succeeded":
                    output = result["output"]
                    return output[0] if isinstance(output, list) else output
                elif result["status"] == "failed":
                    raise Exception(result.get("error", "Generation failed"))

            raise Exception("Generation timeout")

    async def _call_replicate_video(self, task: GenerationTask) -> str:
        """Call Replicate API for video generation."""
        # Similar to image but with video model
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.replicate.com/v1/predictions",
                headers={
                    "Authorization": f"Token {settings.replicate_api_token}",
                    "Content-Type": "application/json",
                },
                json={
                    "version": "3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438",  # SVD
                    "input": {
                        "prompt": task.prompt,
                    },
                },
                timeout=30.0,
            )
            response.raise_for_status()
            prediction = response.json()

            prediction_id = prediction["id"]
            for _ in range(300):  # Max 5 minutes for video
                await asyncio.sleep(1)
                task.progress = min(task.progress + 0.5, 85)

                response = await client.get(
                    f"https://api.replicate.com/v1/predictions/{prediction_id}",
                    headers={"Authorization": f"Token {settings.replicate_api_token}"},
                    timeout=10.0,
                )
                response.raise_for_status()
                result = response.json()

                if result["status"] == "succeeded":
                    output = result["output"]
                    return output[0] if isinstance(output, list) else output
                elif result["status"] == "failed":
                    raise Exception(result.get("error", "Generation failed"))

            raise Exception("Generation timeout")

    async def _call_replicate_i2v(self, task: GenerationTask) -> str:
        """Call Replicate API for image-to-video generation."""
        image_url = task.params.get("image_url")
        if not image_url:
            raise ValueError("image_url is required for image-to-video")

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.replicate.com/v1/predictions",
                headers={
                    "Authorization": f"Token {settings.replicate_api_token}",
                    "Content-Type": "application/json",
                },
                json={
                    "version": "3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438",
                    "input": {
                        "input_image": image_url,
                    },
                },
                timeout=30.0,
            )
            response.raise_for_status()
            prediction = response.json()

            prediction_id = prediction["id"]
            for _ in range(300):
                await asyncio.sleep(1)
                task.progress = min(task.progress + 0.5, 85)

                response = await client.get(
                    f"https://api.replicate.com/v1/predictions/{prediction_id}",
                    headers={"Authorization": f"Token {settings.replicate_api_token}"},
                    timeout=10.0,
                )
                response.raise_for_status()
                result = response.json()

                if result["status"] == "succeeded":
                    output = result["output"]
                    return output[0] if isinstance(output, list) else output
                elif result["status"] == "failed":
                    raise Exception(result.get("error", "Generation failed"))

            raise Exception("Generation timeout")

    async def _generate_placeholder_image(self, task: GenerationTask) -> str:
        """Generate placeholder image for development."""
        # Use a deterministic placeholder based on prompt
        prompt_hash = hashlib.md5(task.prompt.encode()).hexdigest()[:8]
        width = task.params.get("width", 1024)
        height = task.params.get("height", 1024)

        # Simulate generation time
        await asyncio.sleep(2)
        task.progress = 50
        await asyncio.sleep(1)

        return f"https://picsum.photos/seed/{prompt_hash}/{width}/{height}"

    async def _generate_placeholder_video(self, task: GenerationTask) -> str:
        """Generate placeholder video for development."""
        # Simulate generation time
        await asyncio.sleep(3)
        task.progress = 50
        await asyncio.sleep(2)

        # Return a sample video URL
        return "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4"

    async def _save_result(
        self, task: GenerationTask, url: str, media_type: Literal["image", "video"]
    ) -> str:
        """Download and save result to local storage."""
        # Create storage directory
        shot_dir = settings.storage_root / "shots" / str(task.shot_id)
        shot_dir.mkdir(parents=True, exist_ok=True)

        # Generate filename
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        ext = "png" if media_type == "image" else "mp4"
        filename = f"{task.task_id}_{timestamp}.{ext}"
        filepath = shot_dir / filename

        # Download file
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=60.0, follow_redirects=True)
            response.raise_for_status()
            filepath.write_bytes(response.content)

        # Return relative URL for API access
        return f"/media/shots/{task.shot_id}/{filename}"

    async def _create_version(
        self, task: GenerationTask, url: str, media_type: Literal["image", "video"]
    ) -> None:
        """Create version record in database."""
        # Check if this is the first version for this shot
        existing_count = (
            self.db.query(Version).filter(Version.shot_id == task.shot_id).count()
        )

        version = Version(
            shot_id=task.shot_id,
            type=media_type,
            url=url,
            thumb_url=url if media_type == "image" else None,
            params={
                "prompt": task.prompt,
                "model": task.params.get("model"),
                "task_id": task.task_id,
                **task.params,
            },
            is_primary=existing_count == 0,  # First version is primary
        )
        self.db.add(version)
        self.db.commit()

    @staticmethod
    def estimate_cost(
        task_type: Literal["text-to-image", "text-to-video", "image-to-video"],
        params: dict[str, Any] | None = None,
    ) -> tuple[float, float]:
        """Estimate time (seconds) and cost (USD) for a task."""
        estimates = {
            "text-to-image": (15.0, 0.02),
            "text-to-video": (60.0, 0.10),
            "image-to-video": (45.0, 0.08),
        }
        return estimates.get(task_type, (30.0, 0.05))
