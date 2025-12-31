"""Document models."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class DocumentMetadata(BaseModel):
    """Document metadata model."""
    
    filename: str = Field(..., description="Name of the uploaded file")
    upload_date: datetime = Field(..., description="Date and time of upload")
    status: str = Field(default="draft", description="Document status")
    file_path: Optional[str] = Field(None, description="Path to the stored file")
    file_size: Optional[int] = Field(None, description="File size in bytes")
    file_type: Optional[str] = Field(None, description="MIME type of the file")
    
    class Config:
        json_schema_extra = {
            "example": {
                "filename": "employee_handbook.pdf",
                "upload_date": "2025-01-15T10:30:00",
                "status": "draft",
                "file_path": "uploads/employee_handbook_20250115_103000.pdf",
                "file_size": 1024000,
                "file_type": "application/pdf"
            }
        }
