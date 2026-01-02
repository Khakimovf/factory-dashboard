"""Models package."""
from .document import DocumentMetadata
from .maintenance import (
    FailureReport,
    FailureReportCreate,
    FailureReportUpdate,
    MaintenanceStatus
)

__all__ = [
    "DocumentMetadata",
    "FailureReport",
    "FailureReportCreate",
    "FailureReportUpdate",
    "MaintenanceStatus",
]
