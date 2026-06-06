from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime

class GoodsReceiptRequest(BaseModel):
    sku: str
    qty: int
    shift: str # A, B, C
    production_date: date

class GoodsReceiptResponse(BaseModel):
    batch_id: str
    bin_code: str
    status: str
    message: str

class PickLineRequest(BaseModel):
    sku: str
    qty: int

class PickingAllocationRequest(BaseModel):
    so_id: str
    lines: List[PickLineRequest]

class PickTaskItem(BaseModel):
    sku: str
    batch_id: str
    bin_code: str
    required_qty: int

class PickingAllocationResponse(BaseModel):
    pick_task_id: str
    status: str
    items: List[PickTaskItem]

class PickScanConfirmRequest(BaseModel):
    pick_task_id: str
    sku: str
    scanned_batch: str
    scanned_bin: str
    qty_picked: int

class WMSStockView(BaseModel):
    sku: str
    batch_id: str
    bin_code: str
    qty_available: int
    qty_reserved: int
    qty_blocked: int

    class Config:
        orm_mode = True
