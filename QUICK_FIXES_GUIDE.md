# Quick Fixes Guide - Concrete Code Examples

This document provides **copy-paste ready code** for the most critical fixes.

---

## 1. Add Environment Configuration (CRITICAL)

### Install Dependencies
```bash
pip install python-dotenv pydantic-settings
```

### Create `.env.example`
```env
# Backend Configuration
ENVIRONMENT=development
DEBUG=true

# Server
HOST=0.0.0.0
PORT=8000

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# File Upload
MAX_FILE_SIZE_MB=10
UPLOAD_DIR=uploads

# Security (generate these)
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Database (when added)
DATABASE_URL=postgresql://user:pass@localhost/dbname
```

### Refactor `backend/app/config.py`
```python
"""Application configuration using Pydantic Settings."""
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator


class Settings(BaseSettings):
    """Application settings."""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )
    
    # Environment
    ENVIRONMENT: str = Field(default="development")
    DEBUG: bool = Field(default=False)
    
    # Server
    HOST: str = Field(default="0.0.0.0")
    PORT: int = Field(default=8000)
    
    # Base directory
    BASE_DIR: Path = Path(__file__).parent.parent
    
    # Upload settings
    UPLOAD_DIR: Path = Field(default_factory=lambda: Path(__file__).parent.parent / "uploads")
    MAX_FILE_SIZE_MB: int = Field(default=10)
    
    # CORS
    ALLOWED_ORIGINS: str = Field(
        default="http://localhost:5173,http://localhost:3000"
    )
    
    # Security
    SECRET_KEY: str = Field(..., description="Secret key for JWT")
    ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30)
    
    # File validation
    ALLOWED_EXTENSIONS: set[str] = {".pdf", ".docx", ".jpg", ".jpeg"}
    
    @field_validator("ALLOWED_ORIGINS")
    @classmethod
    def parse_origins(cls, v: str) -> List[str]:
        """Parse comma-separated origins."""
        return [origin.strip() for origin in v.split(",") if origin.strip()]
    
    @property
    def MAX_FILE_SIZE(self) -> int:
        """Get max file size in bytes."""
        return self.MAX_FILE_SIZE_MB * 1024 * 1024
    
    @property
    def API_PREFIX(self) -> str:
        """API prefix."""
        return "/api/v1"


# Create settings instance
settings = Settings()

# Ensure upload directory exists
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Export commonly used values
API_PREFIX = settings.API_PREFIX
ALLOWED_ORIGINS = settings.ALLOWED_ORIGINS
UPLOAD_DIR = settings.UPLOAD_DIR
ALLOWED_EXTENSIONS = settings.ALLOWED_EXTENSIONS
MAX_FILE_SIZE = settings.MAX_FILE_SIZE
```

### Update `backend/app/main.py`
```python
from app.config import settings

app = FastAPI(
    title="Factory HR Document Workflow API",
    description="Backend API for factory HR document workflow system",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,  # Hide docs in production
    redoc_url="/redoc" if settings.DEBUG else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],  # ⚠️ FIXED: Specific methods
    allow_headers=["Content-Type", "Authorization"],  # ⚠️ FIXED: Specific headers
)
```

---

## 2. Add Structured Logging (CRITICAL)

### Install Dependencies
```bash
pip install structlog python-json-logger
```

### Create `backend/app/core/logging.py`
```python
"""Logging configuration."""
import logging
import sys
from typing import Any

import structlog
from structlog.types import Processor


def setup_logging(environment: str = "development") -> None:
    """Configure structured logging."""
    
    # Configure standard library logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=logging.DEBUG if environment == "development" else logging.INFO,
    )
    
    # Configure structlog
    processors: list[Processor] = [
        structlog.contextvars.merge_contextvars,  # Add context variables
        structlog.processors.add_log_level,
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
    ]
    
    if environment == "development":
        # Pretty printing for development
        processors.append(structlog.dev.ConsoleRenderer())
    else:
        # JSON for production
        processors.append(structlog.processors.JSONRenderer())
    
    structlog.configure(
        processors=processors,
        wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )


def get_logger(name: str) -> Any:
    """Get a logger instance."""
    return structlog.get_logger(name)
```

### Update `backend/app/main.py`
```python
from app.core.logging import setup_logging, get_logger
from app.config import settings

# Setup logging
setup_logging(settings.ENVIRONMENT)
logger = get_logger(__name__)

@app.on_event("startup")
async def startup_event():
    """Application startup."""
    logger.info("application_starting", environment=settings.ENVIRONMENT)

@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown."""
    logger.info("application_shutting_down")
```

### Add Request Logging Middleware
Create `backend/app/api/middleware/logging.py`:
```python
"""Request logging middleware."""
import time
import uuid
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from app.core.logging import get_logger

logger = get_logger(__name__)


class LoggingMiddleware(BaseHTTPMiddleware):
    """Log all requests and responses."""
    
    async def dispatch(self, request: Request, call_next):
        # Generate correlation ID
        correlation_id = str(uuid.uuid4())
        request.state.correlation_id = correlation_id
        
        # Log request
        start_time = time.time()
        logger.info(
            "request_received",
            method=request.method,
            path=request.url.path,
            query_params=dict(request.query_params),
            correlation_id=correlation_id,
            client_ip=request.client.host if request.client else None,
        )
        
        # Process request
        try:
            response = await call_next(request)
            process_time = time.time() - start_time
            
            # Log response
            logger.info(
                "request_completed",
                method=request.method,
                path=request.url.path,
                status_code=response.status_code,
                process_time=process_time,
                correlation_id=correlation_id,
            )
            
            # Add correlation ID to response header
            response.headers["X-Correlation-ID"] = correlation_id
            return response
            
        except Exception as e:
            process_time = time.time() - start_time
            logger.error(
                "request_failed",
                method=request.method,
                path=request.url.path,
                error=str(e),
                error_type=type(e).__name__,
                process_time=process_time,
                correlation_id=correlation_id,
                exc_info=True,
            )
            raise
```

### Update `backend/app/main.py`
```python
from app.api.middleware.logging import LoggingMiddleware

app.add_middleware(LoggingMiddleware)  # Add before CORS
```

---

## 3. Fix Error Handling (CRITICAL)

### Create `backend/app/core/exceptions.py`
```python
"""Custom exceptions."""
from fastapi import HTTPException, status


class BaseAPIException(HTTPException):
    """Base API exception."""
    
    def __init__(
        self,
        status_code: int,
        detail: str,
        error_code: str = None,
        headers: dict = None,
    ):
        super().__init__(status_code=status_code, detail=detail, headers=headers)
        self.error_code = error_code or f"ERR_{status_code}"


class ValidationError(BaseAPIException):
    """Validation error."""
    
    def __init__(self, detail: str, error_code: str = "VALIDATION_ERROR"):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
            error_code=error_code,
        )


class FileValidationError(ValidationError):
    """File validation error."""
    
    def __init__(self, detail: str):
        super().__init__(detail=detail, error_code="FILE_VALIDATION_ERROR")


class FileSizeError(ValidationError):
    """File size error."""
    
    def __init__(self, detail: str):
        super().__init__(detail=detail, error_code="FILE_SIZE_ERROR")


class InternalServerError(BaseAPIException):
    """Internal server error."""
    
    def __init__(self, detail: str = "Internal server error"):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=detail,
            error_code="INTERNAL_ERROR",
        )
```

### Update `backend/app/main.py`
```python
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.core.exceptions import BaseAPIException
from app.core.logging import get_logger

logger = get_logger(__name__)


@app.exception_handler(BaseAPIException)
async def api_exception_handler(request: Request, exc: BaseAPIException):
    """Handle custom API exceptions."""
    correlation_id = getattr(request.state, "correlation_id", None)
    
    logger.warning(
        "api_exception",
        error_code=exc.error_code,
        detail=exc.detail,
        path=request.url.path,
        correlation_id=correlation_id,
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.error_code,
                "message": exc.detail,
                "correlation_id": correlation_id,
            }
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors."""
    correlation_id = getattr(request.state, "correlation_id", None)
    
    logger.warning(
        "validation_error",
        errors=exc.errors(),
        path=request.url.path,
        correlation_id=correlation_id,
    )
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Validation failed",
                "details": exc.errors(),
                "correlation_id": correlation_id,
            }
        },
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle all other exceptions."""
    correlation_id = getattr(request.state, "correlation_id", None)
    
    # Log full error with stack trace
    logger.error(
        "unhandled_exception",
        error_type=type(exc).__name__,
        error=str(exc),
        path=request.url.path,
        correlation_id=correlation_id,
        exc_info=True,
    )
    
    # Return generic error to client
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "An internal error occurred",
                "correlation_id": correlation_id,
            }
        },
    )
```

### Update `backend/app/services/file_service.py`
```python
from app.core.exceptions import FileValidationError, FileSizeError

class FileService:
    @staticmethod
    def validate_file(file: UploadFile) -> Tuple[str, str]:
        if not file.filename:
            raise FileValidationError("File must have a filename")
        
        file_ext = Path(file.filename).suffix.lower()
        
        if file_ext not in ALLOWED_EXTENSIONS:
            allowed = ", ".join(ALLOWED_EXTENSIONS)
            raise FileValidationError(
                f"File type not allowed. Allowed types: {allowed}"
            )
        
        return file_ext, file.content_type or ""
    
    @staticmethod
    async def validate_file_size(file: UploadFile) -> int:
        content = await file.read()
        file_size = len(content)
        await file.seek(0)
        
        if file_size > MAX_FILE_SIZE:
            max_size_mb = MAX_FILE_SIZE / (1024 * 1024)
            raise FileSizeError(
                f"File size exceeds maximum allowed size of {max_size_mb}MB"
            )
        
        if file_size == 0:
            raise FileValidationError("File is empty")
        
        return file_size
```

### Update `backend/app/api/routes/documents.py`
```python
from app.core.exceptions import BaseAPIException
from app.core.logging import get_logger

logger = get_logger(__name__)

@router.post("/upload", ...)
async def upload_document(file: UploadFile = File(...)):
    """Upload a document file."""
    try:
        file_service = FileService()
        
        # Validate file
        file_ext, content_type = file_service.validate_file(file)
        file_size = await file_service.validate_file_size(file)
        
        # Generate unique filename
        unique_filename = file_service.generate_unique_filename(file.filename)
        
        # Save file
        file_path = await file_service.save_file(file, unique_filename)
        file_info = file_service.get_file_info(file_path)
        
        # Create metadata
        metadata = DocumentMetadata(
            filename=unique_filename,
            upload_date=datetime.now(),
            status="draft",
            file_path=file_info["file_path"],
            file_size=file_info["file_size"],
            file_type=content_type,
        )
        
        logger.info(
            "document_uploaded",
            filename=unique_filename,
            file_size=file_size,
            file_type=content_type,
        )
        
        return metadata
        
    except BaseAPIException:
        # Re-raise our custom exceptions
        raise
    except Exception as e:
        # Log unexpected errors
        logger.error("upload_failed", error=str(e), exc_info=True)
        raise InternalServerError("Failed to upload document")
```

---

## 4. Improve File Validation (CRITICAL)

### Install Dependencies
```bash
pip install python-magic-bin  # Windows
# OR
pip install python-magic     # Linux/Mac
```

### Update `backend/app/services/file_service.py`
```python
import magic
from app.core.exceptions import FileValidationError

# MIME type mapping
ALLOWED_MIME_TYPES = {
    "application/pdf": {".pdf"},
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {".docx"},
    "image/jpeg": {".jpg", ".jpeg"},
}

class FileService:
    @staticmethod
    def validate_file(file: UploadFile) -> Tuple[str, str]:
        if not file.filename:
            raise FileValidationError("File must have a filename")
        
        # Validate extension
        file_ext = Path(file.filename).suffix.lower()
        if file_ext not in ALLOWED_EXTENSIONS:
            allowed = ", ".join(ALLOWED_EXTENSIONS)
            raise FileValidationError(
                f"File type not allowed. Allowed types: {allowed}"
            )
        
        return file_ext, file.content_type or ""
    
    @staticmethod
    async def validate_file_content(file: UploadFile, file_ext: str) -> None:
        """Validate file content using magic bytes."""
        # Read first chunk for magic bytes
        chunk = await file.read(1024)
        await file.seek(0)
        
        # Detect MIME type from content
        mime_type = magic.from_buffer(chunk, mime=True)
        
        # Check if detected MIME type is allowed for this extension
        if mime_type not in ALLOWED_MIME_TYPES:
            raise FileValidationError(
                f"File content type '{mime_type}' is not allowed"
            )
        
        if file_ext not in ALLOWED_MIME_TYPES[mime_type]:
            raise FileValidationError(
                f"File extension '{file_ext}' does not match content type '{mime_type}'"
            )
        
        return mime_type
```

### Update route to use content validation
```python
# In upload_document:
file_ext, content_type = file_service.validate_file(file)
await file_service.validate_file_content(file, file_ext)  # Add this
file_size = await file_service.validate_file_size(file)
```

---

## 5. Add Dependency Injection (HIGH)

### Update `backend/app/api/dependencies.py`
```python
"""FastAPI dependencies."""
from fastapi import Depends
from app.services.file_service import FileService


def get_file_service() -> FileService:
    """Get file service instance."""
    return FileService()
```

### Update `backend/app/api/routes/documents.py`
```python
from app.api.dependencies import get_file_service

@router.post("/upload", ...)
async def upload_document(
    file: UploadFile = File(...),
    file_service: FileService = Depends(get_file_service),  # ⚠️ FIXED: DI
):
    """Upload a document file."""
    # Now file_service is injected
    file_ext, content_type = file_service.validate_file(file)
    # ...
```

---

## 6. Frontend: Create API Service Layer (HIGH)

### Install Dependencies
```bash
npm install axios
```

### Create `src/app/api/client.ts`
```typescript
import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle errors globally
    if (error.response?.status === 401) {
      // Handle unauthorized
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### Create `src/app/api/types.ts`
```typescript
export interface DocumentMetadata {
  filename: string;
  upload_date: string;
  status: 'draft' | 'pending' | 'approved' | 'archived';
  file_path?: string;
  file_size?: number;
  file_type?: string;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    correlation_id?: string;
    details?: unknown;
  };
}
```

### Create `src/app/services/documentService.ts`
```typescript
import { apiClient } from '../api/client';
import type { DocumentMetadata, ApiError } from '../api/types';

export const documentService = {
  async uploadDocument(file: File): Promise<DocumentMetadata> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post<DocumentMetadata>(
      '/api/v1/documents/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    return response.data;
  },
  
  async getDocuments(): Promise<DocumentMetadata[]> {
    const response = await apiClient.get<DocumentMetadata[]>(
      '/api/v1/documents'
    );
    return response.data;
  },
};
```

### Create `src/app/hooks/useDocuments.ts`
```typescript
import { useState, useCallback } from 'react';
import { documentService } from '../services/documentService';
import type { DocumentMetadata } from '../api/types';

export function useDocuments() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const uploadDocument = useCallback(async (file: File): Promise<DocumentMetadata | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await documentService.uploadDocument(file);
      return result;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 'Upload failed';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);
  
  return {
    uploadDocument,
    loading,
    error,
  };
}
```

---

## 7. Add .env File to .gitignore

### Update `.gitignore`
```gitignore
# Environment variables
.env
.env.local
.env.*.local
```

### Create `.env.example` (commit this)
```env
VITE_API_URL=http://localhost:8000
```

---

## Summary Checklist

- [ ] Add environment configuration
- [ ] Add structured logging
- [ ] Fix error handling
- [ ] Improve file validation (magic bytes)
- [ ] Add dependency injection
- [ ] Create frontend API service layer
- [ ] Update .gitignore

**Next:** Implement authentication (see ARCHITECTURE_REVIEW.md Phase 2)



