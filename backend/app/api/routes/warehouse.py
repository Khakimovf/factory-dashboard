from fastapi import APIRouter, HTTPException, Depends
from typing import List
from pydantic import BaseModel

from app.services.warehouse_service import WarehouseService
from app.repositories.warehouse_repository import MaterialRepository, LogRepository, RequestRepository

router = APIRouter(prefix="/warehouse", tags=["warehouse"])

# Instantiate service (in-memory for now, global instance could be better but this works for demo)
# Using globals here so state is shared across requests for in-memory DB
material_repo = MaterialRepository()
log_repo = LogRepository()
request_repo = RequestRepository()
warehouse_service = WarehouseService(material_repo, log_repo, request_repo)

@router.get("/inventory-health")
async def get_inventory_health():
    """Get inventory health status for all materials."""
    try:
        health_data = warehouse_service.get_inventory_health_dashboard()
        return health_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
