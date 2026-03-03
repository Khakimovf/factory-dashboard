import uuid
from app.models.production import DailyPlan, BillOfMaterial
from app.repositories.production_repository import PlanRepository, BOMRepository
from app.services.warehouse_service import WarehouseService

class ProductionService:
    def __init__(self, plans: PlanRepository, boms: BOMRepository, warehouse_service: WarehouseService):
        self.plans = plans
        self.boms = boms
        self.warehouse_service = warehouse_service

    def create_daily_plan(self, plan_data: DailyPlan, user_id: str):
        # 1. Fetch BOM for the FG
        bom = self.boms.get_by_id(plan_data.finished_good_id)
        if not bom:
            raise ValueError(f"No BOM registered for product (ID: {plan_data.finished_good_id})")

        # 2. Save Plan (using provided ID or generating one if empty, here assuming provided but valid)
        if not plan_data.id:
            plan_data.id = str(uuid.uuid4())
        saved_plan = self.plans.create(plan_data)

        # 3. Calculate materials needed and trigger Warehouse Service
        for item in bom.items:
            total_needed = item.quantity_required * plan_data.planned_quantity
            self.warehouse_service.reserve_materials_for_plan(
                plan_id=saved_plan.id,
                material_id=item.material_id,
                required_qty=total_needed,
                user_id=user_id
            )

        return saved_plan
