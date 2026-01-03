"""Maintenance repository for data access."""
from typing import List, Optional
from app.models.maintenance import FailureReport, MaintenanceStatus
from app.repositories.base import BaseRepository


class MaintenanceRepository(BaseRepository[FailureReport, str]):
    """Repository for failure reports."""
    
    def __init__(self):
        # In-memory storage (can be replaced with database)
        self._reports: dict[str, FailureReport] = {}
    
    def create(self, entity: FailureReport) -> FailureReport:
        """
        Create a new failure report.
        
        Args:
            entity: Failure report to create
            
        Returns:
            Created failure report
        """
        self._reports[entity.id] = entity
        return entity
    
    def get_by_id(self, entity_id: str) -> Optional[FailureReport]:
        """
        Get failure report by ID.
        
        Args:
            entity_id: Failure report ID
            
        Returns:
            Failure report or None if not found
        """
        return self._reports.get(entity_id)
    
    def get_all(
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
    
    def update(self, entity_id: str, entity: FailureReport) -> Optional[FailureReport]:
        """
        Update a failure report.
        
        Args:
            entity_id: Failure report ID
            entity: Updated failure report
            
        Returns:
            Updated failure report or None if not found
        """
        if entity_id not in self._reports:
            return None
        
        self._reports[entity_id] = entity
        return entity
    
    def delete(self, entity_id: str) -> bool:
        """
        Delete a failure report.
        
        Args:
            entity_id: Failure report ID
            
        Returns:
            True if deleted, False if not found
        """
        if entity_id in self._reports:
            del self._reports[entity_id]
            return True
        return False

