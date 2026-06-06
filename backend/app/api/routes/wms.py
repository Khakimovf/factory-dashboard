from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.wms import (
    GoodsReceiptRequest, GoodsReceiptResponse,
    PickingAllocationRequest, PickingAllocationResponse,
    PickScanConfirmRequest, WMSStockView
)
from app.services.wms_service import WMSService
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/wms", tags=["WMS STELA"])

def get_wms_service(db: Session = Depends(get_db)):
    return WMSService(db)

@router.post("/receipt", response_model=GoodsReceiptResponse)
def goods_receipt(
    req: GoodsReceiptRequest,
    service: WMSService = Depends(get_wms_service),
    current_user: User = Depends(get_current_user)
):
    """
    Process inbound goods receipt with auto-bin assignment.
    """
    operator_id = current_user.id if current_user else "SYSTEM"
    return service.process_goods_receipt(req, operator_id)

@router.post("/picking/allocate", response_model=PickingAllocationResponse)
def allocate_picking(
    req: PickingAllocationRequest,
    service: WMSService = Depends(get_wms_service),
    current_user: User = Depends(get_current_user)
):
    """
    Allocate picking task from Sales Order based on strict FIFO.
    """
    operator_id = current_user.id if current_user else "SYSTEM"
    return service.allocate_pick_task(req, operator_id)

@router.post("/picking/scan-confirm")
def scan_confirm_pick(
    req: PickScanConfirmRequest,
    service: WMSService = Depends(get_wms_service),
    current_user: User = Depends(get_current_user)
):
    """
    Confirm individual pick scan. Validates Bin and Batch rigorous.
    """
    operator_id = current_user.id if current_user else "SYSTEM"
    return service.confirm_pick_scan(req, operator_id)
