"""Custom exception classes."""
from typing import Optional


class BaseAPIException(Exception):
    """Base exception for API errors."""
    
    def __init__(
        self,
        message: str,
        status_code: int = 500,
        detail: Optional[str] = None
    ):
        self.message = message
        self.status_code = status_code
        self.detail = detail or message
        super().__init__(self.message)


class NotFoundError(BaseAPIException):
    """Resource not found exception."""
    
    def __init__(self, resource: str, identifier: str):
        message = f"{resource} with ID '{identifier}' not found"
        super().__init__(message, status_code=404)


class ValidationError(BaseAPIException):
    """Validation error exception."""
    
    def __init__(self, message: str, field: Optional[str] = None):
        detail = f"Validation error: {message}"
        if field:
            detail = f"Validation error in field '{field}': {message}"
        super().__init__(message, status_code=400, detail=detail)


class FileUploadError(BaseAPIException):
    """File upload error exception."""
    
    def __init__(self, message: str):
        super().__init__(message, status_code=400)


class ServiceError(BaseAPIException):
    """Service layer error exception."""
    
    def __init__(self, message: str, status_code: int = 500):
        super().__init__(message, status_code=status_code)

