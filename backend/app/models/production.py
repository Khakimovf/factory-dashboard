from pydantic import BaseModel, Field
from typing import List
from datetime import date
from enum import Enum

class BOMItem(BaseModel):
    material_id: str = Field(..., description="Raw Material ID")
    quantity_required: float = Field(..., description="Quantity needed per 1 unit of product")

class BillOfMaterial(BaseModel):
    finished_good_id: str = Field(...)
    items: List[BOMItem] = Field(default_factory=list)

class DailyPlan(BaseModel):
    id: str = Field(...)
    date: date = Field(...)
    finished_good_id: str = Field(...)
    planned_quantity: int = Field(...)
    created_by: str = Field(..., description="User session ID")
