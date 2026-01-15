"""FastAPI application entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from loguru import logger

from app.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    logger.info("Starting Pixcore API...")
    settings.storage_root.mkdir(parents=True, exist_ok=True)
    logger.info(f"Storage root: {settings.storage_root}")

    yield

    # Shutdown
    logger.info("Shutting down Pixcore API...")


# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
try:
    app.mount("/media", StaticFiles(directory=str(settings.storage_root)), name="media")
except Exception as e:
    logger.warning(f"Failed to mount media directory: {e}")


# Health check
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "version": settings.app_version,
        "storage_root": str(settings.storage_root),
    }


# Import routers (after app is created to avoid circular imports)
from app.api import (  # noqa: E402
    assets,
    generation,
    projects,
    scenes,
    settings as settings_router,
    shots,
    versions,
)

# Include routers
app.include_router(projects.router, prefix=f"{settings.api_prefix}/projects", tags=["projects"])
app.include_router(scenes.router, prefix=f"{settings.api_prefix}/scenes", tags=["scenes"])
app.include_router(shots.router, prefix=f"{settings.api_prefix}/shots", tags=["shots"])
app.include_router(assets.router, prefix=f"{settings.api_prefix}/assets", tags=["assets"])
app.include_router(versions.router, prefix=f"{settings.api_prefix}/versions", tags=["versions"])
app.include_router(generation.router, prefix=f"{settings.api_prefix}/generation", tags=["generation"])
app.include_router(settings_router.router, prefix=f"{settings.api_prefix}/settings", tags=["settings"])


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )
