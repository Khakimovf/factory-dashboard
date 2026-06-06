from fastapi import APIRouter, HTTPException, Header
from typing import Optional, Any

from app.models.production import DailyPlan
from app.services.production_service import ProductionService
from app.repositories.production_repository import PlanRepository, BOMRepository
from app.repositories.warehouse_repository import MaterialRepository, LogRepository, RequestRepository
from app.services.warehouse_service import WarehouseService

router = APIRouter(prefix="/production", tags=["production"])

def get_production_service():
    # Lazy instantiation to avoid circularity and recursion during startup
    plan_repo = PlanRepository()
    bom_repo = BOMRepository()
    warehouse_service = WarehouseService(MaterialRepository(), LogRepository(), RequestRepository())
    return ProductionService(plan_repo, bom_repo, warehouse_service)

@router.post("/daily-plan", response_model=Any)
async def create_daily_plan(
    plan: Any,
    x_user_id: Optional[str] = Header("system_user", description="User ID from session")
):
    """Create a new daily plan and trigger material reservations."""
    try:
        # Manual validation to bypass Pydantic recursion during FastAPI startup
        validated_plan = DailyPlan.model_validate(plan)
        
        service = get_production_service()
        saved_plan = service.create_daily_plan(
            plan_data=validated_plan,
            user_id=x_user_id
        )
        return saved_plan
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Print for debugging if it still fails
        print(f"DEBUG: Production Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
