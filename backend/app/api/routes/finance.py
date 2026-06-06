from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services.finance_service import FinanceService
from app.models.finance import JournalEntry, GLAccount

router = APIRouter(prefix="/finance", tags=["finance"])

@router.get("/gl-entries")
def get_gl_entries(db: Session = Depends(get_db)):
    return db.query(JournalEntry).order_by(JournalEntry.date.desc()).all()

@router.get("/accounts")
def get_accounts(db: Session = Depends(get_db)):
    return db.query(GLAccount).all()

@router.get("/costing/{sku}")
def get_cogs(sku: str, db: Session = Depends(get_db)):
    service = FinanceService(db)
    return {"sku": sku, "cogs": service.calculate_bom_cost(sku)}
