import uuid
from datetime import datetime
from app.models.warehouse import Material, MaterialMovementLog, MovementType, MaterialRequest
from app.repositories.warehouse_repository import MaterialRepository, LogRepository, RequestRepository

class WarehouseService:
    def __init__(self, materials: MaterialRepository, logs: LogRepository, requests: RequestRepository):
        self.materials = materials
        self.logs = logs
        self.requests = requests

    def reserve_materials_for_plan(self, plan_id: str, material_id: str, required_qty: float, user_id: str):
        material = self.materials.get_by_id(material_id)
        if not material:
            raise ValueError(f"Material {material_id} not found")

        # 1. Update reserved stock
        material.reserved_stock += required_qty
        self.materials.update(material_id, material)

        # 2. Add Audit Log
        log = MaterialMovementLog(
            id=str(uuid.uuid4()),
            material_id=material_id,
            movement_type=MovementType.RESERVATION,
            quantity=required_qty,
            user_id=user_id,
            reference_id=plan_id
        )
        self.logs.create(log)

        # 3. Assess auto-reorder alert
        if material.available_stock < material.minimum_stock:
            self._trigger_procurement_alert(material)

        # 4. Generate Material Request
        mr = MaterialRequest(
            id=str(uuid.uuid4()),
            plan_id=plan_id,
            material_id=material_id,
            requested_quantity=required_qty
        )
        self.requests.create(mr)

    def _trigger_procurement_alert(self, material: Material):
        # In a real app this might send an email, WebSocket push, or create an Alert record
        print(f"CRITICAL ALERT: {material.name} requires reorder. Available: {material.available_stock}, Min: {material.minimum_stock}")

    def get_inventory_health_dashboard(self):
        materials = self.materials.get_all()
        return [
            {
                "material_id": m.id,
                "name": m.name,
                "available_stock": m.available_stock,
                "minimum_stock": m.minimum_stock,
                "health_status": m.inventory_health
            }
            for m in materials
        ]
