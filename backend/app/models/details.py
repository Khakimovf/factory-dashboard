"""Father-Child Detail models for BOM management."""
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field


class FatherDetail(BaseModel):
    """Father (parent assembly / finished part) detail."""
    id: str = Field(..., description="Unique ID")
    code: str = Field(..., description="Part code e.g. DOOR-PANEL-FL")
    name: str = Field(..., description="Human-readable name")
    description: Optional[str] = Field(None, description="Extended description")
    category: Optional[str] = Field("Plastik Qoliplar", description="Part category / classification")
    supplier: Optional[str] = Field("Polymer-Uz", description="Supplier or manufacturer")
    status: Optional[str] = Field("Faol", description="Status: Faol, Arxiv, Sinovda")


class FatherDetailCreate(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    category: Optional[str] = "Plastik Qoliplar"
    supplier: Optional[str] = "Polymer-Uz"
    status: Optional[str] = "Faol"


class FatherDetailUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    supplier: Optional[str] = None
    status: Optional[str] = None
    # Code change audit trail (required when code changes)
    change_reason: Optional[str] = None
    change_date: Optional[str] = None   # ISO date string yyyy-mm-dd
    changed_by: Optional[str] = None


class BulkFatherUpdate(BaseModel):
    ids: List[str]
    category: Optional[str] = None
    supplier: Optional[str] = None
    status: Optional[str] = None


class BulkDelete(BaseModel):
    ids: List[str]


class ChildDetail(BaseModel):
    """Child (sub-component) detail linked to a FatherDetail."""
    id: str = Field(..., description="Unique ID")
    code: str = Field(..., description="Child part code e.g. CLIP-ABS-01")
    name: str = Field(..., description="Human-readable name")
    description: Optional[str] = Field(None)
    father_detail_id: str = Field(..., description="Foreign key to FatherDetail.id")
    quantity_per_unit: float = Field(default=1.0, description="Qty of child needed per 1 unit of father")
    unit: str = Field(default="pcs", description="Unit: pcs, kg, g, etc.")
    category: Optional[str] = Field("Fastenerlar", description="Sub-part category")
    supplier: Optional[str] = Field("GlobalFasteners", description="Supplier name")
    status: Optional[str] = Field("Faol", description="Status: Faol, Arxiv")
    stock_level: Optional[float] = Field(default=250.0, description="Current stock level in warehouse")


class ChildDetailCreate(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    father_detail_id: str
    quantity_per_unit: float = 1.0
    unit: str = "pcs"
    category: Optional[str] = "Fastenerlar"
    supplier: Optional[str] = "GlobalFasteners"
    status: Optional[str] = "Faol"
    stock_level: Optional[float] = 250.0


class ChildDetailUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    father_detail_id: Optional[str] = None
    quantity_per_unit: Optional[float] = None
    unit: Optional[str] = None
    category: Optional[str] = None
    supplier: Optional[str] = None
    status: Optional[str] = None
    stock_level: Optional[float] = None
    # Code change audit trail
    change_reason: Optional[str] = None
    change_date: Optional[str] = None
    changed_by: Optional[str] = None


class BulkChildUpdate(BaseModel):
    ids: List[str]
    category: Optional[str] = None
    supplier: Optional[str] = None
    status: Optional[str] = None


# ── Code Change Log ─────────────────────────────────────────────────────────

class CodeChangeLog(BaseModel):
    """Audit record for a code change on FatherDetail or ChildDetail."""
    id: str
    entity_type: str          # "father" | "child"
    entity_id: str
    old_code: str
    new_code: str
    reason: Optional[str] = None
    change_date: Optional[str] = None
    changed_by: Optional[str] = "system"
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class CodeChangeLogCreate(BaseModel):
    entity_type: str
    entity_id: str
    old_code: str
    new_code: str
    reason: Optional[str] = None
    change_date: Optional[str] = None
    changed_by: Optional[str] = None


# ── Contract Comments ────────────────────────────────────────────────────────

class ContractComment(BaseModel):
    """A textual comment / contract note attached to a Father or Child detail."""
    id: str
    entity_type: str          # "father" | "child"
    entity_id: str
    note: str
    filename: Optional[str] = None   # Optional attached filename reference
    uploaded_by: Optional[str] = "system"
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class ContractCommentCreate(BaseModel):
    note: str
    filename: Optional[str] = None
    uploaded_by: Optional[str] = None


# ── BOM / Reports ────────────────────────────────────────────────────────────

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
