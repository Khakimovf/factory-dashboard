"""Document routes."""
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from pathlib import Path

from app.models.document import DocumentMetadata
from fastapi import Depends
from app.services.file_service import FileService
from app.core.dependencies import get_file_service

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post(
    "/upload",
    response_model=DocumentMetadata,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a document",
    description="Upload a document file (PDF, DOCX, JPG) and receive metadata",
)
async def upload_document(
    file: UploadFile = File(..., description="Document file to upload"),
    file_service: FileService = Depends(get_file_service)
):
    """
    Upload a document file.
    
    - **file**: Document file (PDF, DOCX, JPG)
    
    Returns document metadata including filename, upload date, and status.
    """
    # Validate file
    file_ext, content_type = file_service.validate_file(file)
    await file_service.validate_file_size(file)
    
    # Generate unique filename
    unique_filename = file_service.generate_unique_filename(file.filename)
    
    # Save file
    file_path = await file_service.save_file(file, unique_filename)
    
    # Get file info
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
    
    return metadata


@router.get(
    "/health",
    summary="Health check",
    description="Check if the documents service is healthy",
)
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "documents",
        "timestamp": datetime.now().isoformat()
    }
