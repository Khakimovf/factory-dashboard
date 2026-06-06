from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException
from app.models.wms import WMSZone, WMSBin, WMSBatch, WMSStockBalance, WMSMovement, WMSMaterial
from app.schemas.wms import GoodsReceiptRequest, GoodsReceiptResponse, PickingAllocationRequest, PickingAllocationResponse, PickTaskItem, PickScanConfirmRequest
from app.services.finance_service import FinanceService
from app.services.procurement_service import ProcurementService
import datetime
import uuid

class WMSService:
    def __init__(self, db: Session):
        self.db = db

    def process_goods_receipt(self, req: GoodsReceiptRequest, operator_id: str) -> GoodsReceiptResponse:
        # 1. Generate Batch ID based on date
        today_str = req.production_date.strftime("%Y%m%d")
        
        # Simple count for batch uniqueness in a real app this would be atomic
        batch_count = self.db.query(WMSBatch).filter(WMSBatch.production_date == req.production_date).count()
        batch_id = f"BATCH-{today_str}-{(batch_count + 1):03d}"

        # 2. Check if Material exists, if not create dummy
        material = self.db.query(WMSMaterial).filter(WMSMaterial.sku == req.sku).first()
        if not material:
            material = WMSMaterial(sku=req.sku, description=f"Auto-generated {req.sku}")
            self.db.add(material)
            self.db.flush()

        # 3. Create the batch
        batch = WMSBatch(
            batch_id=batch_id,
            sku=req.sku,
            production_date=req.production_date,
            shift=req.shift
        )
        self.db.add(batch)

        # 4. Auto-suggest BIN logic
        # Find an ACTIVE receiving/storage bin with sufficient capacity
        # For simplicity, we just find the first available bin that's active
        target_bin = self.db.query(WMSBin).filter(WMSBin.status == "ACTIVE").first()
        
        if not target_bin:
            # Fallback auto-create zone & bin for dev simulation
            zone = self.db.query(WMSZone).first()
            if not zone:
                zone = WMSZone(zone_code="Z-01", description="Main Zone", type="STORAGE")
                self.db.add(zone)
                self.db.flush()
            target_bin = WMSBin(bin_code=f"Z-01-R01-S01-B{int(datetime.datetime.now().timestamp())%1000}", zone_id=zone.id, max_capacity_pcs=5000)
            self.db.add(target_bin)
            self.db.flush()

        # 5. Upsert Stock Balance
        stock = self.db.query(WMSStockBalance).filter(
            WMSStockBalance.sku == req.sku,
            WMSStockBalance.batch_id == batch_id,
            WMSStockBalance.bin_id == target_bin.id
        ).with_for_update().first() # ROW LEVEL LOCK FOR RACE CONDITIONS

        if stock:
            stock.qty_available += req.qty
        else:
            stock = WMSStockBalance(
                sku=req.sku,
                batch_id=batch_id,
                bin_id=target_bin.id,
                qty_available=req.qty
            )
            self.db.add(stock)

        # 6. Audit Logging
        movement = WMSMovement(
            movement_type="RECEIPT",
            sku=req.sku,
            batch_id=batch_id,
            to_bin_id=target_bin.id,
            qty=req.qty,
            operator_id=operator_id
        )
        self.db.add(movement)
        self.db.flush()

        # [INTEGRATION] Automatic Accounting (Debit: Inventory / Credit: Cash/AP)
        finance = FinanceService(self.db)
        # Fetch material again for price
        material = self.db.query(WMSMaterial).filter(WMSMaterial.sku == req.sku).first()
        finance.record_transaction(
            amount=req.qty * (material.last_purchase_price if material and material.last_purchase_price else 10.0),
            debit_code="1100-RAW", # Raw Materials
            credit_code="2100-PAYABLE", # Accounts Payable
            description=f"GR for {req.sku} - {batch_id}",
            reference_id=str(movement.id)
        )
        
        try:
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            raise HTTPException(status_code=500, detail="Database integrity error during receipt")
            
        return GoodsReceiptResponse(
            batch_id=batch_id,
            bin_code=target_bin.bin_code,
            status="SUCCESS",
            message=f"Received {req.qty} PCS into {target_bin.bin_code}"
        )

    def allocate_pick_task(self, req: PickingAllocationRequest, operator_id: str) -> PickingAllocationResponse:
        task_id = f"PT-{int(datetime.datetime.now().timestamp())}"
        task_items = []
        
        for line in req.lines:
            remaining_to_allocate = line.qty
            
            # Find available stock ordered by FIFO (batch created_at)
            stocks = self.db.query(WMSStockBalance).join(WMSBatch).filter(
                WMSStockBalance.sku == line.sku,
                WMSStockBalance.qty_available > 0
            ).order_by(WMSBatch.created_at.asc()).with_for_update().all()
            
            for stock in stocks:
                if remaining_to_allocate <= 0:
                    break
                    
                take_qty = min(stock.qty_available, remaining_to_allocate)
                stock.qty_available -= take_qty
                stock.qty_reserved += take_qty
                remaining_to_allocate -= take_qty
                
                # Fetch bin code for UI
                bin = self.db.query(WMSBin).filter(WMSBin.id == stock.bin_id).first()
                
                task_items.append(PickTaskItem(
                    sku=line.sku,
                    batch_id=stock.batch_id,
                    bin_code=bin.bin_code,
                    required_qty=take_qty
                ))

            if remaining_to_allocate > 0:
                self.db.rollback()
                raise HTTPException(status_code=400, detail=f"Insufficient stock for SKU {line.sku}. Shortfall: {remaining_to_allocate}")

        self.db.commit()
        return PickingAllocationResponse(pick_task_id=task_id, status="ALLOCATED", items=task_items)

    def confirm_pick_scan(self, req: PickScanConfirmRequest, operator_id: str):
        # STELA logic: validate Bin and Batch rigorously
        stock_line = self.db.query(WMSStockBalance).join(WMSBin).filter(
            WMSStockBalance.sku == req.sku,
            WMSStockBalance.batch_id == req.scanned_batch,
            WMSBin.bin_code == req.scanned_bin
        ).with_for_update().first()

        if not stock_line:
            raise HTTPException(status_code=400, detail="Wrong Scan: Incorrect Bin or Batch")

        if stock_line.qty_reserved < req.qty_picked:
            raise HTTPException(status_code=400, detail="Over-pick error: Scanned qty exceeds reserved task qty")

        # Deduct reserved and log pick step
        stock_line.qty_reserved -= req.qty_picked
        # At this point it's moved to a virtual 'in transit' or 'shipping lane' 
        # But for simplicity, we treat it as issued from racking.
        
        movement = WMSMovement(
            movement_type="PICK",
            sku=req.sku,
            batch_id=req.scanned_batch,
            from_bin_id=stock_line.bin_id,
            qty=req.qty_picked,
            reference_doc=req.pick_task_id,
            operator_id=operator_id
        )
        self.db.add(movement)
        self.db.flush()

        # [INTEGRATION] Automatic Accounting (Debit: WIP / Credit: Inventory)
        finance = FinanceService(self.db)
        material = self.db.query(WMSMaterial).filter(WMSMaterial.sku == req.sku).first()
        finance.record_transaction(
            amount=req.qty_picked * (material.last_purchase_price if material and material.last_purchase_price else 10.0),
            debit_code="2000-WIP", # Work in Progress
            credit_code="1100-RAW", # Inventory
            description=f"Issue {req.sku} to Production",
            reference_id=str(movement.id)
        )

        # [INTEGRATION] Automatic Procurement Requisition
        procurement = ProcurementService(self.db)
        procurement.check_and_generate_auto_pr(req.sku)

        self.db.commit()

        return {"status": "PICK_CONFIRMED", "message": "Line pick successful"}
