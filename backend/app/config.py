"""Application configuration."""

from pathlib import Path
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Application
    app_name: str = "Pixcore"
    app_version: str = "0.1.0"
    debug: bool = True

    # API
    api_prefix: str = "/api"

    # Database
    database_url: str = "sqlite:///./pixcore.db"

    # Storage
    storage_root: Path = Path.home() / "PixcoreStorage"
    thumb_size: tuple[int, int] = (400, 300)
    max_versions_per_shot: int = 20

    # Server
    host: str = "127.0.0.1"
    port: int = 8000

    # CORS
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "tauri://localhost",
        "https://tauri.localhost",
    ]

    # Security
    secret_key: str = "your-secret-key-change-in-production"

    # Logging
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = "INFO"

    # AI Generation APIs
    replicate_api_token: str | None = None
    openai_api_key: str | None = None
    stability_api_key: str | None = None

    # Default generation model
    default_image_model: str = "stability-ai/sdxl"
    default_video_model: str = "stability-ai/stable-video-diffusion"


settings = Settings()
