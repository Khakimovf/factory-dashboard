"""Application configuration using pydantic-settings."""
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings."""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )
    
    # Base directory
    BASE_DIR: Path = Path(__file__).parent.parent.parent
    
    # API Settings
    API_PREFIX: str = "/api/v1"
    API_VERSION: str = "1.0.0"
    
    # Server Settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = False
    
    # CORS Settings
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:5173,http://localhost:4173"
    
    @property
    def allowed_origins_list(self) -> List[str]:
        """Parse ALLOWED_ORIGINS string into list."""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]
    
    # File Upload Settings
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE_MB: int = 10
    ALLOWED_EXTENSIONS: str = ".pdf,.docx,.jpg,.jpeg,.png"
    
    @property
    def upload_dir_path(self) -> Path:
        """Get upload directory path."""
        path = self.BASE_DIR / self.UPLOAD_DIR
        path.mkdir(exist_ok=True)
        return path
    
    @property
    def max_file_size_bytes(self) -> int:
        """Convert MB to bytes."""
        return self.MAX_FILE_SIZE_MB * 1024 * 1024
    
    @property
    def allowed_extensions_set(self) -> set:
        """Parse ALLOWED_EXTENSIONS string into set."""
        return {ext.strip() for ext in self.ALLOWED_EXTENSIONS.split(",") if ext.strip()}
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"  # json or text
    
    # Database (for future use)
    # DATABASE_URL: Optional[str] = None


# Global settings instance
settings = Settings()

