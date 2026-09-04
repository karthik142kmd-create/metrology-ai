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
    allowed_extensions: Tuple[str, ...] = ("jpg", "jpeg", "png", "gif", "webp", "bmp")
    
    # Reports
    report_dir: str = "reports"
    
    # OCR
    ocr_provider: str = "auto"  # "tesseract", "demo", "auto"
    tesseract_path: Optional[str] = None
    
    # AI Compliance Engine
    ai_provider: str = "builtin"  # "builtin", "gemini", "openai"
    ai_api_key: Optional[str] = None
    ai_model: str = "gemini-1.5-flash"
    
    # Application
    app_name: str = "MetrologyAI"
    app_subtitle: str = "AI-Assisted Packaged Commodity Compliance Inspection"
    debug: bool = False
    cors_origins: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000,*"
    
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False, extra="allow")
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Create necessary directories
        os.makedirs(self.upload_dir, exist_ok=True)
        os.makedirs(self.report_dir, exist_ok=True)
        
        # Auto-detect Tesseract binary on Windows if not provided
        if not self.tesseract_path:
            win_candidates = [
                r"C:\Program Files\Tesseract-OCR\tesseract.exe",
                r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
                os.path.expandvars(r"%LOCALAPPDATA%\Programs\Tesseract-OCR\tesseract.exe")
            ]
            for cand in win_candidates:
                if os.path.exists(cand):
                    self.tesseract_path = cand
                    break


settings = Settings()
