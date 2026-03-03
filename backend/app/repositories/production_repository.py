from typing import List, Optional
from app.models.production import BillOfMaterial, BOMItem, DailyPlan
from app.repositories.base import BaseRepository

class BOMRepository(BaseRepository[BillOfMaterial, str]):
    def __init__(self):
        self._boms: dict[str, BillOfMaterial] = {}
        # Seed for testing Door Trim
        bom1 = BillOfMaterial(
            finished_good_id="fg_door_trim",
            items=[
                BOMItem(material_id="mat_1", quantity_required=0.5), # Polypropylene
                BOMItem(material_id="mat_2", quantity_required=4.0)  # Clips
            ]
        )
        self._boms[bom1.finished_good_id] = bom1

    def create(self, entity: BillOfMaterial) -> BillOfMaterial:
        self._boms[entity.finished_good_id] = entity
        return entity
        
    def get_by_id(self, entity_id: str) -> Optional[BillOfMaterial]:
        # Using finished_good_id as the ID
        return self._boms.get(entity_id)
        
    def get_all(self, **filters) -> List[BillOfMaterial]:
        return list(self._boms.values())
        
    def update(self, entity_id: str, entity: BillOfMaterial) -> Optional[BillOfMaterial]:
        return None
        
    def delete(self, entity_id: str) -> bool:
        return False

class PlanRepository(BaseRepository[DailyPlan, str]):
    def __init__(self):
        self._plans: dict[str, DailyPlan] = {}

    def create(self, entity: DailyPlan) -> DailyPlan:
        self._plans[entity.id] = entity
        return entity
        
    def get_by_id(self, entity_id: str) -> Optional[DailyPlan]:
        return self._plans.get(entity_id)
        
    def get_all(self, **filters) -> List[DailyPlan]:
        return list(self._plans.values())
        
    def update(self, entity_id: str, entity: DailyPlan) -> Optional[DailyPlan]:
        return None
        
    def delete(self, entity_id: str) -> bool:
        return False
