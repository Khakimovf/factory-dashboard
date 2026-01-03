"""Maintenance service for business logic."""
from datetime import datetime
from typing import List, Optional
from uuid import uuid4

from app.models.maintenance import (
    FailureReport,
    FailureReportCreate,
    FailureReportUpdate,
    MaintenanceStatus
)
from app.repositories.maintenance_repository import MaintenanceRepository
from app.core.exceptions import NotFoundError, ServiceError


class MaintenanceService:
    """Service for handling maintenance operations."""
    
    def __init__(self, repository: Optional[MaintenanceRepository] = None):
        """
        Initialize maintenance service.
        
        Args:
            repository: Maintenance repository instance (for dependency injection)
        """
        self.repository = repository or MaintenanceRepository()
    
    async def create_failure_report(self, report_data: FailureReportCreate) -> FailureReport:
        """
        Create a new failure report.
        
        Args:
            report_data: Failure report data
            
        Returns:
            Created failure report
            
        Raises:
            ServiceError: If creation fails
        """
        try:
            report_id = f"fr_{uuid4().hex[:8]}"
            
            report = FailureReport(
                id=report_id,
                line_id=report_data.line_id,
                line_name=report_data.line_name,
                description=report_data.description,
                reported_by=report_data.reported_by,
                priority=report_data.priority or "normal",
                status=MaintenanceStatus.OPEN,
                created_at=datetime.now(),
                photo_urls=[],
            )
            
            return self.repository.create(report)
        except Exception as e:
            raise ServiceError(f"Failed to create failure report: {str(e)}")
    
    async def get_failure_report(self, report_id: str) -> FailureReport:
        """
        Get a failure report by ID.
        
        Args:
            report_id: Failure report ID
            
        Returns:
            Failure report
            
        Raises:
            NotFoundError: If report not found
        """
        report = self.repository.get_by_id(report_id)
        if not report:
            raise NotFoundError("Failure report", report_id)
        return report
    
    async def get_all_failure_reports(
        self,
        status: Optional[MaintenanceStatus] = None,
        line_id: Optional[str] = None
    ) -> List[FailureReport]:
        """
        Get all failure reports with optional filtering.
        
        Args:
            status: Filter by status
            line_id: Filter by line ID
            
        Returns:
            List of failure reports
            
        Raises:
            ServiceError: If retrieval fails
        """
        try:
            return self.repository.get_all(status=status, line_id=line_id)
        except Exception as e:
            raise ServiceError(f"Failed to retrieve failure reports: {str(e)}")
    
    async def update_failure_report(
        self,
        report_id: str,
        update_data: FailureReportUpdate
    ) -> FailureReport:
        """
        Update a failure report.
        
        Args:
            report_id: Failure report ID
            update_data: Update data
            
        Returns:
            Updated failure report
            
        Raises:
            NotFoundError: If report not found
            ServiceError: If update fails
        """
        report = await self.get_failure_report(report_id)
        
        try:
            # Update fields
            update_dict = update_data.model_dump(exclude_unset=True)
            
            for key, value in update_dict.items():
                if hasattr(report, key) and value is not None:
                    setattr(report, key, value)
            
            # Handle status transitions
            if update_data.status:
                self._handle_status_transition(report, update_data.status)
            
            # Calculate duration if completed
            if report.status == MaintenanceStatus.CLOSED and report.completed_at:
                if report.start_time:
                    duration = report.completed_at - report.start_time
                    report.total_duration_minutes = int(duration.total_seconds() / 60)
            
            return self.repository.update(report_id, report)
        except NotFoundError:
            raise
        except Exception as e:
            raise ServiceError(f"Failed to update failure report: {str(e)}")
    
    def _handle_status_transition(
        self,
        report: FailureReport,
        new_status: MaintenanceStatus
    ):
        """
        Handle status transitions and set timestamps.
        
        Args:
            report: Failure report
            new_status: New status
        """
        current_status = report.status
        now = datetime.now()
        
        # Set start_time when moving to IN_PROGRESS
        if new_status == MaintenanceStatus.IN_PROGRESS and not report.start_time:
            report.start_time = now
        
        # Set worker_arrived_at if not set (when status changes to IN_PROGRESS)
        if new_status == MaintenanceStatus.IN_PROGRESS and not report.worker_arrived_at:
            # This will be set explicitly when line master clicks "Worker arrived"
            pass
        
        # Set completed_at when closing
        if new_status == MaintenanceStatus.CLOSED and not report.completed_at:
            report.completed_at = now
        
        report.status = new_status
    
    async def mark_worker_arrived(self, report_id: str) -> FailureReport:
        """
        Mark that maintenance worker has arrived.
        
        Args:
            report_id: Failure report ID
            
        Returns:
            Updated failure report
            
        Raises:
            NotFoundError: If report not found
            ServiceError: If update fails
        """
        report = await self.get_failure_report(report_id)
        
        try:
            if not report.worker_arrived_at:
                report.worker_arrived_at = datetime.now()
            
            # If status is OPEN, automatically move to IN_PROGRESS
            if report.status == MaintenanceStatus.OPEN:
                report.status = MaintenanceStatus.IN_PROGRESS
                if not report.start_time:
                    report.start_time = datetime.now()
            
            return self.repository.update(report_id, report)
        except NotFoundError:
            raise
        except Exception as e:
            raise ServiceError(f"Failed to mark worker arrived: {str(e)}")
    
    async def add_photo_to_report(
        self,
        report_id: str,
        photo_url: str
    ) -> FailureReport:
        """
        Add a photo URL to a failure report.
        
        Args:
            report_id: Failure report ID
            photo_url: URL of uploaded photo
            
        Returns:
            Updated failure report
            
        Raises:
            NotFoundError: If report not found
            ServiceError: If update fails
        """
        report = await self.get_failure_report(report_id)
        
        try:
            if photo_url not in report.photo_urls:
                report.photo_urls.append(photo_url)
            
            return self.repository.update(report_id, report)
        except NotFoundError:
            raise
        except Exception as e:
            raise ServiceError(f"Failed to add photo to report: {str(e)}")
    
    async def delete_failure_report(self, report_id: str) -> bool:
        """
        Delete a failure report.
        
        Args:
            report_id: Failure report ID
            
        Returns:
            True if deleted
            
        Raises:
            NotFoundError: If report not found
            ServiceError: If deletion fails
        """
        # Verify report exists
        await self.get_failure_report(report_id)
        
        try:
            return self.repository.delete(report_id)
        except NotFoundError:
            raise
        except Exception as e:
            raise ServiceError(f"Failed to delete failure report: {str(e)}")




