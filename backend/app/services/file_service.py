"""File handling service."""
import uuid
from datetime import datetime
from pathlib import Path
from typing import Tuple

from fastapi import UploadFile, HTTPException

from app.config import UPLOAD_DIR, ALLOWED_EXTENSIONS, MAX_FILE_SIZE


class FileService:
    """Service for handling file operations."""
    
    @staticmethod
    def validate_file(file: UploadFile) -> Tuple[str, str]:
        """
        Validate uploaded file.
        
        Args:
            file: Uploaded file
            
        Returns:
            Tuple of (file_extension, mime_type)
            
        Raises:
            HTTPException: If file is invalid
        """
        # Check if file has a name
        if not file.filename:
            raise HTTPException(status_code=400, detail="File must have a filename")
        
        # Get file extension
        file_ext = Path(file.filename).suffix.lower()
        
        # Validate extension
        if file_ext not in ALLOWED_EXTENSIONS:
            allowed = ", ".join(ALLOWED_EXTENSIONS)
            raise HTTPException(
                status_code=400,
                detail=f"File type not allowed. Allowed types: {allowed}"
            )
        
        # Get content type
        content_type = file.content_type or ""
        
        return file_ext, content_type
    
    @staticmethod
    async def validate_file_size(file: UploadFile) -> int:
        """
        Validate and get file size.
        
        Args:
            file: Uploaded file
            
        Returns:
            File size in bytes
            
        Raises:
            HTTPException: If file is too large
        """
        # Read file content to get size
        content = await file.read()
        file_size = len(content)
        
        # Reset file pointer
        await file.seek(0)
        
        if file_size > MAX_FILE_SIZE:
            max_size_mb = MAX_FILE_SIZE / (1024 * 1024)
            raise HTTPException(
                status_code=400,
                detail=f"File size exceeds maximum allowed size of {max_size_mb}MB"
            )
        
        if file_size == 0:
            raise HTTPException(status_code=400, detail="File is empty")
        
        return file_size
    
    @staticmethod
    def generate_unique_filename(original_filename: str) -> str:
        """
        Generate a unique filename with timestamp and UUID.
        
        Args:
            original_filename: Original filename
            
        Returns:
            Unique filename
        """
        # Get file extension
        file_ext = Path(original_filename).suffix.lower()
        # Get base name without extension
        base_name = Path(original_filename).stem
        
        # Generate unique filename: base_name_timestamp_uuid.ext
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        
        safe_base_name = "".join(c for c in base_name if c.isalnum() or c in (' ', '-', '_')).strip()
        safe_base_name = safe_base_name.replace(' ', '_')
        
        return f"{safe_base_name}_{timestamp}_{unique_id}{file_ext}"
    
    @staticmethod
    async def save_file(file: UploadFile, filename: str) -> Path:
        """
        Save uploaded file to disk.
        
        Args:
            file: Uploaded file
            filename: Target filename
            
        Returns:
            Path to saved file
        """
        file_path = UPLOAD_DIR / filename
        
        # Write file content
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        return file_path
    
    @staticmethod
    def get_file_info(file_path: Path) -> dict:
        """
        Get file information.
        
        Args:
            file_path: Path to file
            
        Returns:
            Dictionary with file information
        """
        stat = file_path.stat()
        # Return relative path from backend directory (e.g., "uploads/filename.pdf")
        try:
            # UPLOAD_DIR.parent is the backend directory
            file_path_str = str(file_path.relative_to(UPLOAD_DIR.parent))
        except ValueError:
            # Fallback if path calculation fails
            file_path_str = str(file_path)
        
        return {
            "file_path": file_path_str,
            "file_size": stat.st_size,
        }
