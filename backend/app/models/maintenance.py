"""Maintenance models."""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from enum import Enum


class MaintenanceStatus(str, Enum):
    """Maintenance status enum."""
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    CLOSED = "closed"


class FailureReportBase(BaseModel):
    """Base failure report model."""
    
    line_id: str = Field(..., description="Production line ID where failure occurred")
    line_name: str = Field(..., description="Production line name")
    description: str = Field(..., description="Description of the failure")
    reported_by: str = Field(..., description="Line master who reported the failure")
    priority: Optional[str] = Field(default="normal", description="Priority level (low, normal, high, urgent)")


class FailureReportCreate(FailureReportBase):
    """Failure report creation model."""
    pass


class FailureReportUpdate(BaseModel):
    """Failure report update model."""
    
    description: Optional[str] = Field(None, description="Updated description")
    status: Optional[MaintenanceStatus] = Field(None, description="Updated status")
    assigned_to: Optional[str] = Field(None, description="Maintenance worker assigned")
    comments: Optional[str] = Field(None, description="Additional comments/notes")
    photo_urls: Optional[List[str]] = Field(None, description="Photo report URLs")
    worker_arrived_at: Optional[datetime] = Field(None, description="Timestamp when worker arrived")
    completed_at: Optional[datetime] = Field(None, description="Timestamp when repair completed")


class FailureReport(FailureReportBase):
    """Failure report model."""
    
    id: str = Field(..., description="Unique failure report ID")
    status: MaintenanceStatus = Field(default=MaintenanceStatus.OPEN, description="Current status")
    assigned_to: Optional[str] = Field(None, description="Maintenance worker assigned")
    comments: Optional[str] = Field(None, description="Additional comments/notes")
    photo_urls: List[str] = Field(default_factory=list, description="Photo report URLs")
    created_at: datetime = Field(..., description="Timestamp when report was created")
    start_time: Optional[datetime] = Field(None, description="Timestamp when work started")
    worker_arrived_at: Optional[datetime] = Field(None, description="Timestamp when worker arrived")
    completed_at: Optional[datetime] = Field(None, description="Timestamp when repair completed")
    total_duration_minutes: Optional[int] = Field(None, description="Total repair duration in minutes")
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "fr_123456",
                "line_id": "1",
                "line_name": "Assembly Line A",
                "description": "Conveyor belt malfunction - stops intermittently",
                "reported_by": "Line Master John",
                "priority": "high",
                "status": "in_progress",
                "assigned_to": "Maintenance Worker Bob",
                "comments": "Checking motor connections",
                "photo_urls": ["uploads/failure_20250115_103000_abc123.jpg"],
                "created_at": "2025-01-15T10:30:00",
                "start_time": "2025-01-15T10:35:00",
                "worker_arrived_at": "2025-01-15T10:32:00",
                "completed_at": None,
                "total_duration_minutes": None
            }
        }




