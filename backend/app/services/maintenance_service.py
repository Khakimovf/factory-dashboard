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


class MaintenanceService:
    """Service for handling maintenance operations."""
    
    def __init__(self):
        # In-memory storage (can be replaced with database)
        self._reports: dict[str, FailureReport] = {}
    
    def create_failure_report(self, report_data: FailureReportCreate) -> FailureReport:
        """
        Create a new failure report.
        
        Args:
            report_data: Failure report data
            
        Returns:
            Created failure report
        """
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
        
        self._reports[report_id] = report
        return report
    
    def get_failure_report(self, report_id: str) -> Optional[FailureReport]:
        """
        Get a failure report by ID.
        
        Args:
            report_id: Failure report ID
            
        Returns:
            Failure report or None if not found
        """
        return self._reports.get(report_id)
    
    def get_all_failure_reports(
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
        """
        reports = list(self._reports.values())
        
        if status:
            reports = [r for r in reports if r.status == status]
        
        if line_id:
            reports = [r for r in reports if r.line_id == line_id]
        
        # Sort by created_at descending (newest first)
        reports.sort(key=lambda x: x.created_at, reverse=True)
        
        return reports
    
    def update_failure_report(
        self,
        report_id: str,
        update_data: FailureReportUpdate
    ) -> Optional[FailureReport]:
        """
        Update a failure report.
        
        Args:
            report_id: Failure report ID
            update_data: Update data
            
        Returns:
            Updated failure report or None if not found
        """
        report = self._reports.get(report_id)
        if not report:
            return None
        
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
        
        return report
    
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
    
    def mark_worker_arrived(self, report_id: str) -> Optional[FailureReport]:
        """
        Mark that maintenance worker has arrived.
        
        Args:
            report_id: Failure report ID
            
        Returns:
            Updated failure report or None if not found
        """
        report = self._reports.get(report_id)
        if not report:
            return None
        
        if not report.worker_arrived_at:
            report.worker_arrived_at = datetime.now()
        
        # If status is OPEN, automatically move to IN_PROGRESS
        if report.status == MaintenanceStatus.OPEN:
            report.status = MaintenanceStatus.IN_PROGRESS
            if not report.start_time:
                report.start_time = datetime.now()
        
        return report
    
    def add_photo_to_report(
        self,
        report_id: str,
        photo_url: str
    ) -> Optional[FailureReport]:
        """
        Add a photo URL to a failure report.
        
        Args:
            report_id: Failure report ID
            photo_url: URL of uploaded photo
            
        Returns:
            Updated failure report or None if not found
        """
        report = self._reports.get(report_id)
        if not report:
            return None
        
        if photo_url not in report.photo_urls:
            report.photo_urls.append(photo_url)
        
        return report
    
    def delete_failure_report(self, report_id: str) -> bool:
        """
        Delete a failure report.
        
        Args:
            report_id: Failure report ID
            
        Returns:
            True if deleted, False if not found
        """
        if report_id in self._reports:
            del self._reports[report_id]
            return True
        return False


# Global service instance (singleton pattern)
_maintenance_service = None


def get_maintenance_service() -> MaintenanceService:
    """Get the global maintenance service instance."""
    global _maintenance_service
    if _maintenance_service is None:
        _maintenance_service = MaintenanceService()
    return _maintenance_service

