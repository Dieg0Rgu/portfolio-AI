"""Pydantic models and settings for the Email Assistant API.

The `Settings` class loads environment variables (SMTP credentials, API key, etc.)
using `python-dotenv`.  This keeps secrets out of source control.
"""

import os
from pathlib import Path
from typing import List, Optional

from pydantic import BaseModel, BaseSettings, EmailStr, Field, validator

class Settings(BaseSettings):
    """Application configuration loaded from ``.env`` or the environment.

    Required variables:
    - ``API_KEY`` – simple API‑key used by FastAPI dependency.
    - ``SMTP_HOST`` – SMTP server hostname (e.g. ``smtp.gmail.com``).
    - ``SMTP_PORT`` – Port (default 465 for SSL).
    - ``SMTP_USER`` – Email address used as sender.
    - ``SMTP_PASS`` – App‑password or SMTP token.
    """

    API_KEY: str = Field(..., env="API_KEY")
    SMTP_HOST: str = Field(..., env="SMTP_HOST")
    SMTP_PORT: int = Field(465, env="SMTP_PORT")
    SMTP_USER: EmailStr = Field(..., env="SMTP_USER")
    SMTP_PASS: str = Field(..., env="SMTP_PASS")
    # Optional: The sender name shown in emails
    SMTP_SENDER_NAME: Optional[str] = Field(None, env="SMTP_SENDER_NAME")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

# Instantiate a singleton settings object for import elsewhere
settings = Settings()

# Helper to get absolute static directory path (used by services)
STATIC_DIR = Path(__file__).parent / "static"
STATIC_DIR.mkdir(parents=True, exist_ok=True)
