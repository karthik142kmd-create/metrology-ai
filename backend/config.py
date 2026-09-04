"""
Configuration settings for MetrologyAI backend
"""

# pyrefly: ignore [missing-import]
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional, Tuple
import os


class Settings(BaseSettings):
    """
    Application settings from environment variables
    """
    
    # Database
    database_url: str = "sqlite:///./metrology.db"
    
    # JWT
    jwt_secret_key: str = "your-secret-key-change-this-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 24
    
    # File uploads
    upload_dir: str = "uploads"
    max_upload_size_mb: int = 10
    allowed_extensions: Tuple[str, ...] = ("jpg", "jpeg", "png", "gif")
    
    # Reports
    report_dir: str = "reports"
    
    # OCR
    ocr_provider: str = "auto"  # "tesseract", "demo", "auto"
    
    # Application
    app_name: str = "MetrologyAI"
    app_subtitle: str = "AI-Assisted Packaged Commodity Compliance Inspection"
    debug: bool = False
    
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False, extra="allow")
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Create necessary directories
        os.makedirs(self.upload_dir, exist_ok=True)
        os.makedirs(self.report_dir, exist_ok=True)


settings = Settings()
