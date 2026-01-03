"""Dependency injection for FastAPI."""
from fastapi import Depends

from app.services.maintenance_service import MaintenanceService
from app.services.file_service import FileService


def get_maintenance_service() -> MaintenanceService:
    """
    Get maintenance service instance.
    
    Returns:
        MaintenanceService instance
    """
    return MaintenanceService()


def get_file_service() -> FileService:
    """
    Get file service instance.
    
    Returns:
        FileService instance
    """
    return FileService()

