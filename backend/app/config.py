"""Application configuration (deprecated - use app.core.config instead)."""
from app.core.config import settings

# Backward compatibility exports
BASE_DIR = settings.BASE_DIR
UPLOAD_DIR = settings.upload_dir_path
ALLOWED_EXTENSIONS = settings.allowed_extensions_set
MAX_FILE_SIZE = settings.max_file_size_bytes
API_PREFIX = settings.API_PREFIX
ALLOWED_ORIGINS = settings.allowed_origins_list
