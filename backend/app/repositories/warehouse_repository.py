from typing import List, Optional
from app.models.warehouse import Material, MaterialMovementLog, MaterialRequest
from app.repositories.base import BaseRepository

class MaterialRepository(BaseRepository[Material, str]):
    def __init__(self):
        self._materials: dict[str, Material] = {}
        # Seed some data for testing
        m1 = Material(id="mat_1", name="Polypropylene", unit="kg", current_stock=1000.0, minimum_stock=500.0)
        m2 = Material(id="mat_2", name="Clips", unit="pcs", current_stock=5000.0, minimum_stock=1000.0)
        self._materials[m1.id] = m1
        self._materials[m2.id] = m2

    def create(self, entity: Material) -> Material:
        self._materials[entity.id] = entity
        return entity
        
    def get_by_id(self, entity_id: str) -> Optional[Material]:
        return self._materials.get(entity_id)
        
    def get_all(self, **filters) -> List[Material]:
        return list(self._materials.values())
        
    def update(self, entity_id: str, entity: Material) -> Optional[Material]:
        if entity_id in self._materials:
            self._materials[entity_id] = entity
            return entity
        return None
        
    def delete(self, entity_id: str) -> bool:
        if entity_id in self._materials:
            del self._materials[entity_id]
            return True
        return False

class LogRepository(BaseRepository[MaterialMovementLog, str]):
    def __init__(self):
        self._logs: dict[str, MaterialMovementLog] = {}

    def create(self, entity: MaterialMovementLog) -> MaterialMovementLog:
        self._logs[entity.id] = entity
        return entity
        
    def get_by_id(self, entity_id: str) -> Optional[MaterialMovementLog]:
        return self._logs.get(entity_id)
        
    def get_all(self, **filters) -> List[MaterialMovementLog]:
        return list(self._logs.values())
        
    def update(self, entity_id: str, entity: MaterialMovementLog) -> Optional[MaterialMovementLog]:
        return None
        
    def delete(self, entity_id: str) -> bool:
        return False

class RequestRepository(BaseRepository[MaterialRequest, str]):
    def __init__(self):
        self._requests: dict[str, MaterialRequest] = {}

    def create(self, entity: MaterialRequest) -> MaterialRequest:
        self._requests[entity.id] = entity
        return entity
        
    def get_by_id(self, entity_id: str) -> Optional[MaterialRequest]:
        return self._requests.get(entity_id)
        
    def get_all(self, **filters) -> List[MaterialRequest]:
        return list(self._requests.values())
        
    def update(self, entity_id: str, entity: MaterialRequest) -> Optional[MaterialRequest]:
        if entity_id in self._requests:
            self._requests[entity_id] = entity
            return entity
        return None
        
    def delete(self, entity_id: str) -> bool:
        return False
