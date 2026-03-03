from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum
import uuid

def split_and_capitalize(s: str) -> str:
    return s.replace("_", " ").title()

class MovementType(str, Enum):
    ENTRY = "entry"
    EXIT = "exit"
    RESERVATION = "reservation"
    CANCELLATION = "cancellation"

class Material(BaseModel):
    id: str = Field(..., description="Unique material ID (e.g., Polypropylene)")
    name: str = Field(...)
    unit: str = Field(..., description="kg, pcs, liters")
    current_stock: float = Field(default=0.0)
    reserved_stock: float = Field(default=0.0)
    minimum_stock: float = Field(default=0.0, description="Threshold for auto-reorder")

    @property
    def available_stock(self) -> float:
        return self.current_stock - self.reserved_stock
        
    @property
    def inventory_health(self) -> str:
        if self.available_stock <= 0:
            return "Out of Stock"
        elif self.available_stock < self.minimum_stock:
            return "Low"
        return "Ready"

class MaterialMovementLog(BaseModel):
    id: str = Field(...)
    material_id: str = Field(...)
    movement_type: MovementType = Field(...)
    quantity: float = Field(...)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    user_id: str = Field(..., description="User ID of the session (no manual name)")
    reference_id: Optional[str] = Field(None, description="Linked Plan ID or Request ID")

class MaterialRequestStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    FULFILLED = "fulfilled"
    REJECTED = "rejected"

class MaterialRequest(BaseModel):
    id: str = Field(...)
    plan_id: str = Field(...)
    material_id: str = Field(...)
    requested_quantity: float = Field(...)
    status: MaterialRequestStatus = Field(default=MaterialRequestStatus.PENDING)
    created_at: datetime = Field(default_factory=datetime.utcnow)
