"""In-memory repository for FatherDetail and ChildDetail."""
import uuid
from typing import Dict, List, Optional

from app.models.details import (
    FatherDetail, FatherDetailCreate, FatherDetailUpdate,
    ChildDetail, ChildDetailCreate, ChildDetailUpdate,
)


# ---------------------------------------------------------------------------
# Seed data
# ---------------------------------------------------------------------------

_FATHER_SEED = [
    FatherDetail(id="f-001", code="DOOR-PANEL-FL",   name="Eshik Paneli (FL)", description="Oldingi chap eshik paneli"),
    FatherDetail(id="f-002", code="DASHBOARD-COVER", name="Priborlar Paneli Qoplamasi", description="Markaziy priborlar paneli"),
    FatherDetail(id="f-003", code="GLOVE-BOX",       name="Qo'lqop Qutisi", description="O'ng tomonli qo'lqop qutisi"),
    FatherDetail(id="f-004", code="DOOR-PANEL-FR",   name="Eshik Paneli (FR)", description="Oldingi o'ng eshik paneli"),
    FatherDetail(id="f-005", code="CENTER-CONSOLE",  name="Markaziy Konsol", description="Markaziy konsol korpusi"),
]

_CHILD_SEED = [
    ChildDetail(id="c-001", code="CLIP-ABS-BLK-01", name="ABS Klips (Qora)",    father_detail_id="f-001", quantity_per_unit=4, unit="pcs"),
    ChildDetail(id="c-002", code="FOAM-PU-5MM",     name="PU Ko'pik 5mm",       father_detail_id="f-001", quantity_per_unit=0.2, unit="kg"),
    ChildDetail(id="c-003", code="SCREW-M6-BLK",    name="Vint M6 (Qora)",      father_detail_id="f-001", quantity_per_unit=6, unit="pcs"),
    ChildDetail(id="c-004", code="CLIP-PP-GRY-01",  name="PP Klips (Kulrang)",  father_detail_id="f-002", quantity_per_unit=8, unit="pcs"),
    ChildDetail(id="c-005", code="BEZEL-CHROME-01", name="Xrom Bezak",          father_detail_id="f-002", quantity_per_unit=1, unit="pcs"),
    ChildDetail(id="c-006", code="SCREW-M6-BLK",    name="Vint M6 (Qora)",      father_detail_id="f-002", quantity_per_unit=4, unit="pcs", description="Same part, different parent"),
    ChildDetail(id="c-007", code="HINGE-STL-01",    name="Po'lat Petlya",       father_detail_id="f-003", quantity_per_unit=2, unit="pcs"),
    ChildDetail(id="c-008", code="FOAM-PU-5MM",     name="PU Ko'pik 5mm",       father_detail_id="f-003", quantity_per_unit=0.1, unit="kg"),
    ChildDetail(id="c-009", code="CLIP-ABS-BLK-01", name="ABS Klips (Qora)",    father_detail_id="f-004", quantity_per_unit=4, unit="pcs"),
    ChildDetail(id="c-010", code="SCREW-M6-BLK",    name="Vint M6 (Qora)",      father_detail_id="f-004", quantity_per_unit=6, unit="pcs"),
    ChildDetail(id="c-011", code="ARMREST-FBRK",    name="Qo'l Tiragi (Fiber)", father_detail_id="f-005", quantity_per_unit=1, unit="pcs"),
    ChildDetail(id="c-012", code="CLIP-PP-GRY-01",  name="PP Klips (Kulrang)",  father_detail_id="f-005", quantity_per_unit=6, unit="pcs"),
]

# Simulated warehouse stock (child code → units in stock)
CHILD_STOCK: Dict[str, float] = {
    "CLIP-ABS-BLK-01": 850,
    "FOAM-PU-5MM":      42.5,
    "SCREW-M6-BLK":     3200,
    "CLIP-PP-GRY-01":   120,
    "BEZEL-CHROME-01":  15,
    "HINGE-STL-01":     200,
    "ARMREST-FBRK":     30,
}

# Usage tracking for reports (child_code → times_used)
USAGE_COUNTER: Dict[str, int] = {
    "CLIP-ABS-BLK-01": 47,
    "SCREW-M6-BLK":    38,
    "CLIP-PP-GRY-01":  31,
    "FOAM-PU-5MM":     22,
    "BEZEL-CHROME-01": 18,
    "HINGE-STL-01":    12,
    "ARMREST-FBRK":    9,
}


class DetailsRepository:
    """Singleton-style in-memory store for Father/Child details."""

    def __init__(self):
        self._fathers: Dict[str, FatherDetail] = {f.id: f for f in _FATHER_SEED}
        self._children: Dict[str, ChildDetail] = {c.id: c for c in _CHILD_SEED}

    # ---- FatherDetail CRUD -----------------------------------------------

    def list_fathers(self) -> List[FatherDetail]:
        return list(self._fathers.values())

    def get_father(self, father_id: str) -> Optional[FatherDetail]:
        return self._fathers.get(father_id)

    def get_father_by_code(self, code: str) -> Optional[FatherDetail]:
        for f in self._fathers.values():
            if f.code.upper() == code.upper():
                return f
        return None

    def create_father(self, data: FatherDetailCreate) -> FatherDetail:
        new_id = f"f-{str(uuid.uuid4())[:8]}"
        father = FatherDetail(id=new_id, **data.dict())
        self._fathers[new_id] = father
        return father

    def update_father(self, father_id: str, data: FatherDetailUpdate) -> Optional[FatherDetail]:
        father = self._fathers.get(father_id)
        if not father:
            return None
        updated = father.copy(update={k: v for k, v in data.dict().items() if v is not None})
        self._fathers[father_id] = updated
        return updated

    def delete_father(self, father_id: str) -> bool:
        if father_id in self._fathers:
            del self._fathers[father_id]
            # Cascade-delete children
            to_delete = [cid for cid, c in self._children.items() if c.father_detail_id == father_id]
            for cid in to_delete:
                del self._children[cid]
            return True
        return False

    # ---- ChildDetail CRUD ------------------------------------------------

    def list_children(self) -> List[ChildDetail]:
        return list(self._children.values())

    def list_children_by_father(self, father_id: str) -> List[ChildDetail]:
        return [c for c in self._children.values() if c.father_detail_id == father_id]

    def get_child(self, child_id: str) -> Optional[ChildDetail]:
        return self._children.get(child_id)

    def create_child(self, data: ChildDetailCreate) -> ChildDetail:
        new_id = f"c-{str(uuid.uuid4())[:8]}"
        child = ChildDetail(id=new_id, **data.dict())
        self._children[new_id] = child
        return child

    def update_child(self, child_id: str, data: ChildDetailUpdate) -> Optional[ChildDetail]:
        child = self._children.get(child_id)
        if not child:
            return None
        updated = child.copy(update={k: v for k, v in data.dict().items() if v is not None})
        self._children[child_id] = updated
        return updated

    def delete_child(self, child_id: str) -> bool:
        if child_id in self._children:
            del self._children[child_id]
            return True
        return False

    # ---- Warehouse stock helpers ------------------------------------------

    def get_stock(self, child_code: str) -> float:
        return CHILD_STOCK.get(child_code, 0.0)

    def receive_stock(self, child_code: str, quantity: float) -> float:
        CHILD_STOCK[child_code] = CHILD_STOCK.get(child_code, 0.0) + quantity
        return CHILD_STOCK[child_code]

    def get_all_stock(self) -> Dict[str, float]:
        return dict(CHILD_STOCK)

    # ---- Usage stats -------------------------------------------------------

    def increment_usage(self, child_code: str):
        USAGE_COUNTER[child_code] = USAGE_COUNTER.get(child_code, 0) + 1

    def get_usage_stats(self) -> Dict[str, int]:
        return dict(sorted(USAGE_COUNTER.items(), key=lambda x: x[1], reverse=True))


# Singleton instance shared across the app
details_repo = DetailsRepository()
