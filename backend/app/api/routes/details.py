"""API routes for Father-Child Detail (BOM) management."""
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query

from app.models.details import (
    FatherDetail, FatherDetailCreate, FatherDetailUpdate, BulkFatherUpdate,
    ChildDetail, ChildDetailCreate, ChildDetailUpdate, BulkChildUpdate, BulkDelete,
    BOMItem, BOMResult, DetailStats,
    CodeChangeLog, ContractComment, ContractCommentCreate,
)
from app.models.user import User
from app.core.dependencies import get_current_user, allow_admin
from app.repositories.details_repository import details_repo

router = APIRouter(prefix="/details", tags=["details"])


# ============================================================
# Father Detail endpoints
# ============================================================

@router.get("/fathers", response_model=List[FatherDetail])
async def list_father_details():
    """List all FatherDetails (authenticated users)."""
    return details_repo.list_fathers()


@router.get("/fathers/{father_id}", response_model=FatherDetail)
async def get_father_detail(father_id: str):
    """Get a single FatherDetail by ID."""
    f = details_repo.get_father(father_id)
    if not f:
        raise HTTPException(status_code=404, detail="FatherDetail not found")
    return f


@router.post("/fathers", response_model=FatherDetail, dependencies=[Depends(allow_admin)])
async def create_father_detail(data: FatherDetailCreate):
    """Create a new FatherDetail (admin only)."""
    existing = details_repo.get_father_by_code(data.code)
    if existing:
        raise HTTPException(status_code=400, detail=f"Code '{data.code}' already exists")
    return details_repo.create_father(data)


@router.put("/fathers/{father_id}", response_model=FatherDetail, dependencies=[Depends(allow_admin)])
async def update_father_detail(father_id: str, data: FatherDetailUpdate):
    """Update a FatherDetail (admin only). Automatically logs code changes."""
    updated = details_repo.update_father(father_id, data)
    if not updated:
        raise HTTPException(status_code=404, detail="FatherDetail not found")
    return updated


@router.post("/fathers/bulk-update", response_model=List[FatherDetail], dependencies=[Depends(allow_admin)])
async def bulk_update_fathers(data: BulkFatherUpdate):
    """Bulk update multiple FatherDetails."""
    return details_repo.bulk_update_fathers(data)


@router.post("/fathers/bulk-delete", dependencies=[Depends(allow_admin)])
async def bulk_delete_fathers(data: BulkDelete):
    """Bulk delete multiple FatherDetails."""
    count = details_repo.bulk_delete_fathers(data.ids)
    return {"status": "deleted", "count": count}


@router.delete("/fathers/{father_id}", dependencies=[Depends(allow_admin)])
async def delete_father_detail(father_id: str):
    """Delete a FatherDetail and its children (admin only)."""
    success = details_repo.delete_father(father_id)
    if not success:
        raise HTTPException(status_code=404, detail="FatherDetail not found")
    return {"status": "deleted", "id": father_id}


@router.get("/fathers/{father_id}/children", response_model=List[ChildDetail])
async def get_children_for_father(father_id: str):
    """Get all ChildDetails for a given FatherDetail."""
    f = details_repo.get_father(father_id)
    if not f:
        raise HTTPException(status_code=404, detail="FatherDetail not found")
    return details_repo.list_children_by_father(father_id)


# ── Code Change History for Fathers ──────────────────────────────────────────

@router.get("/fathers/{father_id}/changes", response_model=List[CodeChangeLog])
async def get_father_code_changes(father_id: str):
    """Get the code change history for a FatherDetail."""
    f = details_repo.get_father(father_id)
    if not f:
        raise HTTPException(status_code=404, detail="FatherDetail not found")
    return details_repo.get_code_changes(father_id, "father")


# ── Contract Comments for Fathers ────────────────────────────────────────────

@router.get("/fathers/{father_id}/comments", response_model=List[ContractComment])
async def get_father_comments(father_id: str):
    """Get all contract comments for a FatherDetail."""
    f = details_repo.get_father(father_id)
    if not f:
        raise HTTPException(status_code=404, detail="FatherDetail not found")
    return details_repo.get_comments(father_id, "father")


@router.post("/fathers/{father_id}/comments", response_model=ContractComment)
async def add_father_comment(
    father_id: str,
    data: ContractCommentCreate,
    current_user: User = Depends(get_current_user),
):
    """Add a contract comment to a FatherDetail."""
    f = details_repo.get_father(father_id)
    if not f:
        raise HTTPException(status_code=404, detail="FatherDetail not found")
    return details_repo.add_comment(father_id, "father", data, user=current_user.username)


# ============================================================
# Child Detail endpoints
# ============================================================

@router.get("/children", response_model=List[ChildDetail])
async def list_child_details():
    """List all ChildDetails."""
    return details_repo.list_children()


@router.get("/children/{child_id}", response_model=ChildDetail)
async def get_child_detail(child_id: str):
    """Get a single ChildDetail by ID."""
    c = details_repo.get_child(child_id)
    if not c:
        raise HTTPException(status_code=404, detail="ChildDetail not found")
    return c


@router.post("/children", response_model=ChildDetail, dependencies=[Depends(allow_admin)])
async def create_child_detail(data: ChildDetailCreate):
    """Create a new ChildDetail (admin only)."""
    parent = details_repo.get_father(data.father_detail_id)
    if not parent:
        raise HTTPException(status_code=404, detail="Parent FatherDetail not found")
    return details_repo.create_child(data)


@router.put("/children/{child_id}", response_model=ChildDetail, dependencies=[Depends(allow_admin)])
async def update_child_detail(child_id: str, data: ChildDetailUpdate):
    """Update a ChildDetail (admin only). Automatically logs code changes."""
    if data.father_detail_id:
        parent = details_repo.get_father(data.father_detail_id)
        if not parent:
            raise HTTPException(status_code=404, detail="Parent FatherDetail not found")
    updated = details_repo.update_child(child_id, data)
    if not updated:
        raise HTTPException(status_code=404, detail="ChildDetail not found")
    return updated


@router.post("/children/bulk-update", response_model=List[ChildDetail], dependencies=[Depends(allow_admin)])
async def bulk_update_children(data: BulkChildUpdate):
    """Bulk update multiple ChildDetails."""
    return details_repo.bulk_update_children(data)


@router.post("/children/bulk-delete", dependencies=[Depends(allow_admin)])
async def bulk_delete_children(data: BulkDelete):
    """Bulk delete multiple ChildDetails."""
    count = details_repo.bulk_delete_children(data.ids)
    return {"status": "deleted", "count": count}


@router.delete("/children/{child_id}", dependencies=[Depends(allow_admin)])
async def delete_child_detail(child_id: str):
    """Delete a ChildDetail (admin only)."""
    success = details_repo.delete_child(child_id)
    if not success:
        raise HTTPException(status_code=404, detail="ChildDetail not found")
    return {"status": "deleted", "id": child_id}


# ── Code Change History for Children ─────────────────────────────────────────

@router.get("/children/{child_id}/changes", response_model=List[CodeChangeLog])
async def get_child_code_changes(child_id: str):
    """Get the code change history for a ChildDetail."""
    c = details_repo.get_child(child_id)
    if not c:
        raise HTTPException(status_code=404, detail="ChildDetail not found")
    return details_repo.get_code_changes(child_id, "child")


# ── Contract Comments for Children ───────────────────────────────────────────

@router.get("/children/{child_id}/comments", response_model=List[ContractComment])
async def get_child_comments(child_id: str):
    """Get all contract comments for a ChildDetail."""
    c = details_repo.get_child(child_id)
    if not c:
        raise HTTPException(status_code=404, detail="ChildDetail not found")
    return details_repo.get_comments(child_id, "child")


@router.post("/children/{child_id}/comments", response_model=ContractComment)
async def add_child_comment(
    child_id: str,
    data: ContractCommentCreate,
    current_user: User = Depends(get_current_user),
):
    """Add a contract comment to a ChildDetail."""
    c = details_repo.get_child(child_id)
    if not c:
        raise HTTPException(status_code=404, detail="ChildDetail not found")
    return details_repo.add_comment(child_id, "child", data, user=current_user.username)


# ============================================================
# BOM / Production Planning endpoints
# ============================================================

@router.get("/fathers/by-code/{code}/bom", response_model=BOMResult)
async def get_bom_by_father_code(
    code: str,
    production_volume: int = Query(default=1, ge=1, description="Number of units to produce"),
):
    """
    Explode the BOM for a Father code at a given production volume.
    Checks warehouse stock and calculates shortages.
    """
    father = details_repo.get_father_by_code(code)
    if not father:
        raise HTTPException(status_code=404, detail=f"FatherDetail with code '{code}' not found")

    children = details_repo.list_children_by_father(father.id)
    if not children:
        return BOMResult(
            father_code=father.code,
            father_name=father.name,
            production_volume=production_volume,
            items=[],
            lines=["Liniya-A", "Liniya-B", "Liniya-C"],
        )

    items: List[BOMItem] = []
    for child in children:
        required = child.quantity_per_unit * production_volume
        in_stock = details_repo.get_stock(child.code)
        shortage = max(0.0, required - in_stock)

        if shortage == 0:
            status = "OK"
        elif in_stock > 0:
            status = "LOW"
        else:
            status = "SHORTAGE"

        items.append(BOMItem(
            child_id=child.id,
            child_code=child.code,
            child_name=child.name,
            unit=child.unit,
            quantity_per_unit=child.quantity_per_unit,
            required_quantity=required,
            in_stock=in_stock,
            status=status,
            shortage=shortage,
        ))
        details_repo.increment_usage(child.code)

    return BOMResult(
        father_code=father.code,
        father_name=father.name,
        production_volume=production_volume,
        items=items,
        lines=["Liniya-A", "Liniya-B", "Liniya-C"],
    )


# ============================================================
# Warehouse stock endpoints
# ============================================================

@router.get("/stock")
async def get_all_stock():
    """Return current warehouse stock for all child details."""
    stock = details_repo.get_all_stock()
    children = details_repo.list_children()
    result = []
    seen_codes: set = set()
    for child in children:
        if child.code not in seen_codes:
            seen_codes.add(child.code)
            in_stock = stock.get(child.code, 0.0)
            result.append({
                "code": child.code,
                "name": child.name,
                "unit": child.unit,
                "in_stock": in_stock,
                "status": "OK" if in_stock > 50 else ("LOW" if in_stock > 0 else "OUT"),
            })
    return result


@router.post("/stock/receive")
async def receive_child_stock(
    child_code: str = Query(...),
    quantity: float = Query(..., gt=0),
    current_user: User = Depends(get_current_user),
):
    """Record receipt of child detail stock in warehouse."""
    new_total = details_repo.receive_stock(child_code, quantity)
    return {
        "status": "received",
        "child_code": child_code,
        "quantity_added": quantity,
        "new_total": new_total,
        "received_by": current_user.username,
    }


# ============================================================
# Stats / Reports
# ============================================================

@router.get("/stats", response_model=DetailStats)
async def get_detail_stats():
    """Return statistics for the reports page."""
    fathers = details_repo.list_fathers()
    children = details_repo.list_children()
    usage = details_repo.get_usage_stats()
    stock = details_repo.get_all_stock()

    top_used = [
        {"code": code, "usage": count, "in_stock": stock.get(code, 0)}
        for code, count in list(usage.items())[:10]
    ]

    shortage_alerts = [
        {"code": code, "in_stock": qty, "recommendation": f"'{code}' ehtiyot qismi past. Qo'shimcha buyurtma bering."}
        for code, qty in stock.items()
        if qty < 50
    ]

    return DetailStats(
        total_fathers=len(fathers),
        total_children=len(children),
        top_used_children=top_used,
        shortage_alerts=shortage_alerts,
    )
