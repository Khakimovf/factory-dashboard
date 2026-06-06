from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services.procurement_service import ProcurementService
from app.models.procurement import Supplier, PurchaseRequisition, PurchaseOrder

router = APIRouter(prefix="/procurement", tags=["procurement"])

@router.get("/suppliers")
def get_suppliers(db: Session = Depends(get_db)):
    return db.query(Supplier).all()

@router.get("/requisitions")
def get_requisitions(db: Session = Depends(get_db)):
    return db.query(PurchaseRequisition).all()

@router.get("/orders")
def get_orders(db: Session = Depends(get_db)):
    return db.query(PurchaseOrder).all()

@router.post("/po/receive")
def receive_po(qr_code: str, operator_id: str = "SYSTEM", db: Session = Depends(get_db)):
    service = ProcurementService(db)
    return service.process_po_receipt(qr_code, operator_id)
