"""Audit models."""
from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field

class AuditLog(BaseModel):
    """Audit log model."""
    id: str = Field(..., description="Unique log ID")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Time of the action")
    user_id: Optional[str] = Field(None, description="ID of the user who performed the action")
    username: Optional[str] = Field(None, description="Username of the user")
    action: str = Field(..., description="Description of the action (e.g., 'CREATE_USER', 'UPDATE_ROLE')")
    module: str = Field(..., description="System module (e.g., 'ADMIN', 'VGM', 'QC')")
    status: str = Field(default="SUCCESS", description="Action status (SUCCESS, WARNING, CRITICAL)")
    ip_address: Optional[str] = Field(None, description="Client IP address")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional context")
    target_id: Optional[str] = Field(None, description="ID of affected entity")
    old_value: Optional[Dict[str, Any]] = Field(None, description="Metadata before change")
    new_value: Optional[Dict[str, Any]] = Field(None, description="Metadata after change")
