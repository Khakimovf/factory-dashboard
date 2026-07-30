"""In-memory repository for FatherDetail and ChildDetail."""
import uuid
from datetime import datetime
from typing import Dict, List, Optional

from app.models.details import (
    FatherDetail, FatherDetailCreate, FatherDetailUpdate, BulkFatherUpdate,
    ChildDetail, ChildDetailCreate, ChildDetailUpdate, BulkChildUpdate, BulkDelete,
    CodeChangeLog, CodeChangeLogCreate,
    ContractComment, ContractCommentCreate,
)


# ---------------------------------------------------------------------------
# Seed data with categories, suppliers, and statuses
# ---------------------------------------------------------------------------

_FATHER_SEED = [
    FatherDetail(
        id="f-001", code="DOOR-PANEL-FL", name="Eshik Paneli (FL)",
        description="Oldingi chap eshik paneli",
        category="Plastik Qoliplar", supplier="Polymer-Uz", status="Faol"
    ),
    FatherDetail(
        id="f-002", code="DASHBOARD-COVER", name="Priborlar Paneli Qoplamasi",
        description="Markaziy priborlar paneli",
        category="Plastik Qoliplar", supplier="AutoTech Ltd", status="Faol"
    ),
    FatherDetail(
        id="f-003", code="GLOVE-BOX", name="Qo'lqop Qutisi",
        description="O'ng tomonli qo'lqop qutisi",
        category="Kabinets & Konsollar", supplier="Polymer-Uz", status="Faol"
    ),
    FatherDetail(
        id="f-004", code="DOOR-PANEL-FR", name="Eshik Paneli (FR)",
        description="Oldingi o'ng eshik paneli",
        category="Plastik Qoliplar", supplier="Polymer-Uz", status="Faol"
    ),
    FatherDetail(
        id="f-005", code="CENTER-CONSOLE", name="Markaziy Konsol",
        description="Markaziy konsol korpusi",
        category="Kabinets & Konsollar", supplier="SamAuto Parts", status="Sinovda"
    ),
]

_CHILD_SEED = [
    ChildDetail(
        id="c-001", code="CLIP-ABS-BLK-01", name="ABS Klips (Qora)",
        father_detail_id="f-001", quantity_per_unit=4, unit="pcs",
        category="Fastenerlar", supplier="GlobalFasteners", status="Faol", stock_level=850.0
    ),
    ChildDetail(
        id="c-002", code="FOAM-PU-5MM", name="PU Ko'pik 5mm",
        father_detail_id="f-001", quantity_per_unit=0.2, unit="kg",
        category="Rezina va Zichlagichlar", supplier="Polymer-Uz", status="Faol", stock_level=42.5
    ),
    ChildDetail(
        id="c-003", code="SCREW-M6-BLK", name="Vint M6 (Qora)",
        father_detail_id="f-001", quantity_per_unit=6, unit="pcs",
        category="Fastenerlar", supplier="GlobalFasteners", status="Faol", stock_level=3200.0
    ),
    ChildDetail(
        id="c-004", code="CLIP-PP-GRY-01", name="PP Klips (Kulrang)",
        father_detail_id="f-002", quantity_per_unit=8, unit="pcs",
        category="Fastenerlar", supplier="GlobalFasteners", status="Faol", stock_level=120.0
    ),
    ChildDetail(
        id="c-005", code="BEZEL-CHROME-01", name="Xrom Bezak",
        father_detail_id="f-002", quantity_per_unit=1, unit="pcs",
        category="Dekorativ qismlar", supplier="AutoTech Ltd", status="Faol", stock_level=15.0
    ),
    ChildDetail(
        id="c-006", code="SCREW-M6-BLK", name="Vint M6 (Qora)",
        father_detail_id="f-002", quantity_per_unit=4, unit="pcs", description="Same part, different parent",
        category="Fastenerlar", supplier="GlobalFasteners", status="Faol", stock_level=3200.0
    ),
    ChildDetail(
        id="c-007", code="HINGE-STL-01", name="Po'lat Petlya",
        father_detail_id="f-003", quantity_per_unit=2, unit="pcs",
        category="Metall qismlar", supplier="SamAuto Parts", status="Faol", stock_level=200.0
    ),
    ChildDetail(
        id="c-008", code="FOAM-PU-5MM", name="PU Ko'pik 5mm",
        father_detail_id="f-003", quantity_per_unit=0.1, unit="kg",
        category="Rezina va Zichlagichlar", supplier="Polymer-Uz", status="Faol", stock_level=42.5
    ),
    ChildDetail(
        id="c-009", code="CLIP-ABS-BLK-01", name="ABS Klips (Qora)",
        father_detail_id="f-004", quantity_per_unit=4, unit="pcs",
        category="Fastenerlar", supplier="GlobalFasteners", status="Faol", stock_level=850.0
    ),
    ChildDetail(
        id="c-010", code="SCREW-M6-BLK", name="Vint M6 (Qora)",
        father_detail_id="f-004", quantity_per_unit=6, unit="pcs",
        category="Fastenerlar", supplier="GlobalFasteners", status="Faol", stock_level=3200.0
    ),
    ChildDetail(
        id="c-011", code="ARMREST-FBRK", name="Qo'l Tiragi (Fiber)",
        father_detail_id="f-005", quantity_per_unit=1, unit="pcs",
        category="Mebel & Tikuv", supplier="SamAuto Parts", status="Sinovda", stock_level=0.0
    ),
    ChildDetail(
        id="c-012", code="CLIP-PP-GRY-01", name="PP Klips (Kulrang)",
        father_detail_id="f-005", quantity_per_unit=6, unit="pcs",
        category="Fastenerlar", supplier="GlobalFasteners", status="Faol", stock_level=120.0
    ),
]

CHILD_STOCK: Dict[str, float] = {
    "CLIP-ABS-BLK-01": 850,
    "FOAM-PU-5MM":      42.5,
    "SCREW-M6-BLK":     3200,
    "CLIP-PP-GRY-01":   120,
    "BEZEL-CHROME-01":  15,
    "HINGE-STL-01":     200,
    "ARMREST-FBRK":     0,
}

USAGE_COUNTER: Dict[str, int] = {
    "CLIP-ABS-BLK-01": 47,
    "SCREW-M6-BLK":    38,
    "CLIP-PP-GRY-01":  31,
    "FOAM-PU-5MM":     22,
    "BEZEL-CHROME-01": 18,
    "HINGE-STL-01":    12,
    "ARMREST-FBRK":    9,
}

_CHANGE_LOG_SEED = [
    CodeChangeLog(
        id="cl-001",
        entity_type="father",
        entity_id="f-001",
        old_code="DOOR-FL-V1",
        new_code="DOOR-PANEL-FL",
        reason="Standart kodlash tizimiga o'tish",
        change_date="2025-03-10",
        changed_by="admin",
        created_at="2025-03-10T09:00:00",
    ),
    CodeChangeLog(
        id="cl-002",
        entity_type="child",
        entity_id="c-001",
        old_code="CLIP-01",
        new_code="CLIP-ABS-BLK-01",
        reason="Material va rang ma'lumotlari qo'shildi",
        change_date="2025-03-10",
        changed_by="admin",
        created_at="2025-03-10T09:15:00",
    ),
]

_COMMENT_SEED = [
    ContractComment(
        id="cc-001",
        entity_type="father",
        entity_id="f-001",
        note="2025-yil yanvar shartnomasi asosida tasdiqlangan. Shartnoma raqami: CT-2025-001",
        filename="shartnoma_CT-2025-001.pdf",
        uploaded_by="admin",
        created_at="2025-01-15T10:30:00",
    ),
]


class DetailsRepository:
    """Singleton-style in-memory store for Father/Child details."""

    def __init__(self):
        self._fathers: Dict[str, FatherDetail] = {f.id: f for f in _FATHER_SEED}
        self._children: Dict[str, ChildDetail] = {c.id: c for c in _CHILD_SEED}
        self._change_logs: List[CodeChangeLog] = list(_CHANGE_LOG_SEED)
        self._comments: List[ContractComment] = list(_COMMENT_SEED)

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

        # Detect code change and log it
        new_code = data.code
        if new_code and new_code.upper() != father.code.upper():
            log_entry = CodeChangeLog(
                id=f"cl-{str(uuid.uuid4())[:8]}",
                entity_type="father",
                entity_id=father_id,
                old_code=father.code,
                new_code=new_code.upper(),
                reason=data.change_reason,
                change_date=data.change_date,
                changed_by=data.changed_by or "system",
                created_at=datetime.utcnow().isoformat(),
            )
            self._change_logs.append(log_entry)

        update_dict = {
            k: v for k, v in data.dict().items()
            if v is not None and k not in ("change_reason", "change_date", "changed_by")
        }
        if "code" in update_dict:
            update_dict["code"] = update_dict["code"].upper()

        updated = father.copy(update=update_dict)
        self._fathers[father_id] = updated
        return updated

    def bulk_update_fathers(self, data: BulkFatherUpdate) -> List[FatherDetail]:
        updated_items = []
        for fid in data.ids:
            if fid in self._fathers:
                father = self._fathers[fid]
                updates = {}
                if data.category: updates["category"] = data.category
                if data.supplier: updates["supplier"] = data.supplier
                if data.status: updates["status"] = data.status
                updated = father.copy(update=updates)
                self._fathers[fid] = updated
                updated_items.append(updated)
        return updated_items

    def bulk_delete_fathers(self, ids: List[str]) -> int:
        count = 0
        for fid in ids:
            if fid in self._fathers:
                del self._fathers[fid]
                to_del = [cid for cid, c in self._children.items() if c.father_detail_id == fid]
                for cid in to_del:
                    del self._children[cid]
                count += 1
        return count

    def delete_father(self, father_id: str) -> bool:
        if father_id in self._fathers:
            del self._fathers[father_id]
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

        new_code = data.code
        if new_code and new_code.upper() != child.code.upper():
            log_entry = CodeChangeLog(
                id=f"cl-{str(uuid.uuid4())[:8]}",
                entity_type="child",
                entity_id=child_id,
                old_code=child.code,
                new_code=new_code.upper(),
                reason=data.change_reason,
                change_date=data.change_date,
                changed_by=data.changed_by or "system",
                created_at=datetime.utcnow().isoformat(),
            )
            self._change_logs.append(log_entry)

        update_dict = {
            k: v for k, v in data.dict().items()
            if v is not None and k not in ("change_reason", "change_date", "changed_by")
        }
        if "code" in update_dict:
            update_dict["code"] = update_dict["code"].upper()

        updated = child.copy(update=update_dict)
        self._children[child_id] = updated
        return updated

    def bulk_update_children(self, data: BulkChildUpdate) -> List[ChildDetail]:
        updated_items = []
        for cid in data.ids:
            if cid in self._children:
                child = self._children[cid]
                updates = {}
                if data.category: updates["category"] = data.category
                if data.supplier: updates["supplier"] = data.supplier
                if data.status: updates["status"] = data.status
                updated = child.copy(update=updates)
                self._children[cid] = updated
                updated_items.append(updated)
        return updated_items

    def bulk_delete_children(self, ids: List[str]) -> int:
        count = 0
        for cid in ids:
            if cid in self._children:
                del self._children[cid]
                count += 1
        return count

    def delete_child(self, child_id: str) -> bool:
        if child_id in self._children:
            del self._children[child_id]
            return True
        return False

    # ---- Code Change Log -------------------------------------------------

    def get_code_changes(self, entity_id: str, entity_type: str) -> List[CodeChangeLog]:
        return [
            log for log in self._change_logs
            if log.entity_id == entity_id and log.entity_type == entity_type
        ]

    def add_code_change(self, data: CodeChangeLogCreate) -> CodeChangeLog:
        entry = CodeChangeLog(
            id=f"cl-{str(uuid.uuid4())[:8]}",
            entity_type=data.entity_type,
            entity_id=data.entity_id,
            old_code=data.old_code,
            new_code=data.new_code,
            reason=data.reason,
            change_date=data.change_date,
            changed_by=data.changed_by or "system",
            created_at=datetime.utcnow().isoformat(),
        )
        self._change_logs.append(entry)
        return entry

    # ---- Contract Comments -----------------------------------------------

    def get_comments(self, entity_id: str, entity_type: str) -> List[ContractComment]:
        return [
            c for c in self._comments
            if c.entity_id == entity_id and c.entity_type == entity_type
        ]

    def add_comment(self, entity_id: str, entity_type: str, data: ContractCommentCreate, user: str = "system") -> ContractComment:
        comment = ContractComment(
            id=f"cc-{str(uuid.uuid4())[:8]}",
            entity_type=entity_type,
            entity_id=entity_id,
            note=data.note,
            filename=data.filename,
            uploaded_by=data.uploaded_by or user,
            created_at=datetime.utcnow().isoformat(),
        )
        self._comments.append(comment)
        return comment

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
