"""Father-Child Detail models for BOM management."""
from typing import Optional, List
from pydantic import BaseModel, Field


class FatherDetail(BaseModel):
    """Father (parent assembly / finished part) detail."""
    id: str = Field(..., description="Unique ID")
    code: str = Field(..., description="Part code e.g. DOOR-PANEL-FL")
    name: str = Field(..., description="Human-readable name")
    description: Optional[str] = Field(None, description="Extended description")


class FatherDetailCreate(BaseModel):
    code: str
    name: str
    description: Optional[str] = None


class FatherDetailUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None


class ChildDetail(BaseModel):
    """Child (sub-component) detail linked to a FatherDetail."""
    id: str = Field(..., description="Unique ID")
    code: str = Field(..., description="Child part code e.g. CLIP-ABS-01")
    name: str = Field(..., description="Human-readable name")
    description: Optional[str] = Field(None)
    father_detail_id: str = Field(..., description="Foreign key to FatherDetail.id")
    quantity_per_unit: float = Field(default=1.0, description="Qty of child needed per 1 unit of father")
    unit: str = Field(default="pcs", description="Unit: pcs, kg, g, etc.")


class ChildDetailCreate(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    father_detail_id: str
    quantity_per_unit: float = 1.0
    unit: str = "pcs"


class ChildDetailUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    father_detail_id: Optional[str] = None
    quantity_per_unit: Optional[float] = None
    unit: Optional[str] = None


class BOMItem(BaseModel):
    """Single line in a Bill of Materials calculation."""
    child_id: str
    child_code: str
    child_name: str
    unit: str
    quantity_per_unit: float
    required_quantity: float
    in_stock: float
    status: str  # "OK" | "LOW" | "SHORTAGE"
    shortage: float


class BOMResult(BaseModel):
    """Result of a BOM explosion for a given father code + production volume."""
    father_code: str
    father_name: str
    production_volume: int
    items: List[BOMItem]
    lines: List[str]


class DetailStats(BaseModel):
    """Stats for reporting."""
    total_fathers: int
    total_children: int
    top_used_children: List[dict]
    shortage_alerts: List[dict]
