"""Audit repository for data access."""
from typing import List, Optional
from app.models.audit import AuditLog
from app.repositories.base import BaseRepository

class AuditRepository(BaseRepository[AuditLog, str]):
    """Repository for audit logs."""
    
    def __init__(self):
        self._logs: dict[str, AuditLog] = {}
    
    def create(self, entity: AuditLog) -> AuditLog:
        """Create a new audit log."""
        self._logs[entity.id] = entity
        return entity
    
    def get_by_id(self, entity_id: str) -> Optional[AuditLog]:
        """Get audit log by ID."""
        return self._logs.get(entity_id)
    
    def get_all(self) -> List[AuditLog]:
        """Get all audit logs."""
        logs = list(self._logs.values())
        # Sort by timestamp descending
        logs.sort(key=lambda x: x.timestamp, reverse=True)
        return logs
    
    def update(self, entity_id: str, entity: AuditLog) -> Optional[AuditLog]:
        """Update an audit log (usually not allowed)."""
        if entity_id not in self._logs:
            return None
        self._logs[entity_id] = entity
        return entity
    
    def delete(self, entity_id: str) -> bool:
        """Delete an audit log (usually not allowed)."""
        if entity_id in self._logs:
            del self._logs[entity_id]
            return True
        return False
