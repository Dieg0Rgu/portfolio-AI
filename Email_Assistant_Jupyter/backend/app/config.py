"""Application configuration and settings management."""

import os
from pathlib import Path
from typing import Optional
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# Base directory for the app and static assets
APP_DIR = Path(__file__).resolve().parent
STATIC_DIR = APP_DIR / "static"
STATIC_DIR.mkdir(parents=True, exist_ok=True)

class Settings(BaseSettings):
    """Application settings loaded from .env or environment variables."""

    # API key required for protected endpoints (Header: X-API-Key)
    API_KEY: str = Field(default="my_secure_api_key_123", alias="API_KEY")

    # Optional SMTP configuration (only needed if using FastAPI's /send endpoint directly)
    SMTP_HOST: Optional[str] = Field(default=None, alias="SMTP_HOST")
    SMTP_PORT: int = Field(default=465, alias="SMTP_PORT")
    SMTP_USER: Optional[str] = Field(default=None, alias="SMTP_USER")
    SMTP_PASS: Optional[str] = Field(default=None, alias="SMTP_PASS")
    SMTP_SENDER_NAME: Optional[str] = Field(default="Asistente Financiero", alias="SMTP_SENDER_NAME")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
