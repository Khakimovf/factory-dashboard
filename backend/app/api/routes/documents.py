"""Document routes."""
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from pathlib import Path

from app.models.document import DocumentMetadata
from app.services.file_service import FileService

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post(
    "/upload",
    response_model=DocumentMetadata,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a document",
    description="Upload a document file (PDF, DOCX, JPG) and receive metadata",
)
async def upload_document(file: UploadFile = File(..., description="Document file to upload")):
    """
    Upload a document file.
    
    - **file**: Document file (PDF, DOCX, JPG)
    
    Returns document metadata including filename, upload date, and status.
    """
    file_service = FileService()
    
    # Validate file
    try:
        file_ext, content_type = file_service.validate_file(file)
        file_size = await file_service.validate_file_size(file)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error validating file: {str(e)}"
        )
    
    # Generate unique filename
    unique_filename = file_service.generate_unique_filename(file.filename)
    
    # Save file
    try:
        file_path = await file_service.save_file(file, unique_filename)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error saving file: {str(e)}"
        )
    
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
