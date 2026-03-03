from fastapi import APIRouter, HTTPException, Header
from typing import Optional

from app.models.production import DailyPlan
from app.services.production_service import ProductionService
from app.repositories.production_repository import PlanRepository, BOMRepository
from app.api.routes.warehouse import warehouse_service

router = APIRouter(prefix="/production", tags=["production"])

plan_repo = PlanRepository()
bom_repo = BOMRepository()
production_service = ProductionService(plan_repo, bom_repo, warehouse_service)

@router.post("/daily-plan", response_model=DailyPlan)
async def create_daily_plan(
    plan: DailyPlan,
    x_user_id: Optional[str] = Header("system_user", description="User ID from session")
):
    """Create a new daily plan and trigger material reservations."""
    try:
        saved_plan = production_service.create_daily_plan(
            plan_data=plan,
            user_id=x_user_id
        )
        return saved_plan
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
