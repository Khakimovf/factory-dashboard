from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services.import_service import ImportService
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/imports", tags=["Imports"])

@router.post("/warehouse/materials")
async def import_materials(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")
    
    content = await file.read()
    decoded_content = content.decode('utf-8')
    result = ImportService.import_materials(db, decoded_content)
    return result

@router.post("/warehouse/bins")
async def import_bins(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")
    
    content = await file.read()
    decoded_content = content.decode('utf-8')
    result = ImportService.import_bins(db, decoded_content)
    return result

@router.post("/hr/employees")
async def import_employees(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")
    
    content = await file.read()
    decoded_content = content.decode('utf-8')
    result = ImportService.import_employees(decoded_content)
    return result
