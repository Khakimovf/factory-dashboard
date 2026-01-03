"""Maintenance routes."""
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, status, UploadFile, File
from fastapi.responses import JSONResponse

from app.models.maintenance import (
    FailureReport,
    FailureReportCreate,
    FailureReportUpdate,
    MaintenanceStatus
)
from app.services.maintenance_service import MaintenanceService
from app.services.file_service import FileService
from app.core.dependencies import get_maintenance_service, get_file_service
from app.core.exceptions import NotFoundError, FileUploadError

router = APIRouter(prefix="/maintenance", tags=["maintenance"])


@router.post(
    "/failure-reports",
    response_model=FailureReport,
    status_code=status.HTTP_201_CREATED,
    summary="Create a failure report",
    description="Create a new failure report by line master",
)
async def create_failure_report(
    report_data: FailureReportCreate,
    service: MaintenanceService = Depends(get_maintenance_service)
):
    """
    Create a new failure report.
    
    - **line_id**: Production line ID
    - **line_name**: Production line name
    - **description**: Description of the failure
    - **reported_by**: Line master name
    - **priority**: Priority level (optional)
    
    Returns the created failure report.
    """
    return await service.create_failure_report(report_data)


@router.get(
    "/failure-reports",
    response_model=List[FailureReport],
    summary="Get all failure reports",
    description="Get all failure reports with optional filtering",
)
async def get_failure_reports(
    status_filter: Optional[MaintenanceStatus] = None,
    line_id: Optional[str] = None,
    service: MaintenanceService = Depends(get_maintenance_service)
):
    """
    Get all failure reports.
    
    - **status_filter**: Filter by status (open, in_progress, closed)
    - **line_id**: Filter by production line ID
    
    Returns a list of failure reports.
    """
    return await service.get_all_failure_reports(
        status=status_filter,
        line_id=line_id
    )


@router.get(
    "/failure-reports/{report_id}",
    response_model=FailureReport,
    summary="Get failure report by ID",
    description="Get a specific failure report by its ID",
)
async def get_failure_report(
    report_id: str,
    service: MaintenanceService = Depends(get_maintenance_service)
):
    """
    Get a failure report by ID.
    
    - **report_id**: Failure report ID
    
    Returns the failure report.
    """
    return await service.get_failure_report(report_id)


@router.patch(
    "/failure-reports/{report_id}",
    response_model=FailureReport,
    summary="Update failure report",
    description="Update a failure report (status, assignment, comments, etc.)",
)
async def update_failure_report(
    report_id: str,
    update_data: FailureReportUpdate,
    service: MaintenanceService = Depends(get_maintenance_service)
):
    """
    Update a failure report.
    
    - **report_id**: Failure report ID
    - **update_data**: Update fields (status, assigned_to, comments, etc.)
    
    Returns the updated failure report.
    """
    return await service.update_failure_report(report_id, update_data)


@router.post(
    "/failure-reports/{report_id}/worker-arrived",
    response_model=FailureReport,
    summary="Mark worker arrived",
    description="Mark that maintenance worker has arrived at the line",
)
async def mark_worker_arrived(
    report_id: str,
    service: MaintenanceService = Depends(get_maintenance_service)
):
    """
    Mark that maintenance worker has arrived.
    
    - **report_id**: Failure report ID
    
    This endpoint is called when the line master clicks "Worker arrived".
    Returns the updated failure report.
    """
    return await service.mark_worker_arrived(report_id)


@router.post(
    "/failure-reports/{report_id}/photos",
    response_model=FailureReport,
    summary="Upload photo to failure report",
    description="Upload a photo report for a failure report",
)
async def upload_photo_to_report(
    report_id: str,
    file: UploadFile = File(..., description="Photo file to upload"),
    service: MaintenanceService = Depends(get_maintenance_service),
    file_service: FileService = Depends(get_file_service)
):
    """
    Upload a photo to a failure report.
    
    - **report_id**: Failure report ID
    - **file**: Photo file (JPG, PNG)
    
    Returns the updated failure report with photo URL.
    """
    # Verify report exists
    await service.get_failure_report(report_id)
    
    # Validate and save file
    file_ext, content_type = file_service.validate_file(file)
    
    # Only allow image files for photos
    if file_ext not in [".jpg", ".jpeg", ".png"]:
        raise FileUploadError("Only image files (JPG, PNG) are allowed for photo reports")
    
    await file_service.validate_file_size(file)
    unique_filename = file_service.generate_unique_filename(file.filename)
    file_path = await file_service.save_file(file, unique_filename)
    file_info = file_service.get_file_info(file_path)
    
    # Add photo URL to report
    photo_url = file_info["file_path"]
    return await service.add_photo_to_report(report_id, photo_url)


@router.delete(
    "/failure-reports/{report_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete failure report",
    description="Delete a failure report",
)
async def delete_failure_report(
    report_id: str,
    service: MaintenanceService = Depends(get_maintenance_service)
):
    """
    Delete a failure report.
    
    - **report_id**: Failure report ID
    """
    await service.delete_failure_report(report_id)
    return JSONResponse(status_code=status.HTTP_204_NO_CONTENT, content=None)


@router.get(
    "/health",
    summary="Health check",
    description="Check if the maintenance service is healthy",
)
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "maintenance",
        "timestamp": datetime.now().isoformat()
    }




