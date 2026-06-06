from sqlalchemy.orm import Session
from app.models.procurement import Supplier, PurchaseRequisition, PurchaseOrder, PurchaseOrderItem
from app.models.wms import WMSMaterial, WMSStockBalance
import uuid
import datetime

class ProcurementService:
    def __init__(self, db: Session):
        self.db = db

    def check_and_generate_auto_pr(self, sku: str):
        """Checks if available stock is below safety stock and generates a PR."""
        material = self.db.query(WMSMaterial).filter(WMSMaterial.sku == sku).first()
        if not material or not material.safety_stock:
            return None

        # Calculate total available stock across all bins
        total_avail = self.db.query(WMSStockBalance).filter(WMSStockBalance.sku == sku).with_entities(WMSStockBalance.qty_available).all()
        current_sum = sum(q[0] for q in total_avail)

        if current_sum < material.safety_stock:
            # Check if a pending PR already exists to avoid duplication
            existing_pr = self.db.query(PurchaseRequisition).filter(
                PurchaseRequisition.sku == sku, 
                PurchaseRequisition.status == "PENDING"
            ).first()
            
            if not existing_pr:
                reorder_qty = material.safety_stock * 2  # Simple reorder logic
                new_pr = PurchaseRequisition(
                    pr_number=f"PR-{uuid.uuid4().hex[:6].upper()}",
                    sku=sku,
                    requested_qty=reorder_qty,
                    requested_by="SYSTEM_AUTO",
                    status="PENDING"
                )
                self.db.add(new_pr)
                self.db.commit()
                return new_pr
        return None

    def process_po_receipt(self, po_qr_code: str, target_bin_id: int, operator_id: str):
        """
        Handles TSD scanning of a PO QR code.
        Updates specific warehouse bins and sets status to 'Unrestricted' (implicit in qty_available).
        """
        from app.services.finance_service import FinanceService
        
        po = self.db.query(PurchaseOrder).filter(PurchaseOrder.qr_code == po_qr_code).first()
        if not po:
            return {"status": "ERROR", "message": "Invalid PO QR Code"}
        
        if po.status == "DELIVERED":
            return {"status": "ERROR", "message": "PO already delivered"}

        # 1. Update PO Status
        po.status = "DELIVERED"
        po.delivered_at = datetime.datetime.now()

        total_value = 0
        
        # 2. Update Inventory and Prices
        for item in po.items:
            # Update price on material
            material = self.db.query(WMSMaterial).filter(WMSMaterial.sku == item.sku).first()
            if material:
                material.last_purchase_price = item.unit_price
            
            # Update Stock Balance (Address-level storage)
            stock = self.db.query(WMSStockBalance).filter(
                WMSStockBalance.sku == item.sku,
                WMSStockBalance.bin_id == target_bin_id
            ).first()
            
            if stock:
                stock.qty_available += item.quantity
            else:
                new_stock = WMSStockBalance(
                    sku=item.sku,
                    bin_id=target_bin_id,
                    qty_available=item.quantity,
                    qty_reserved=0,
                    qty_blocked=0
                )
                self.db.add(new_stock)
            
            total_value += item.quantity * item.unit_price

        # 3. Automatic Finance Interaction (Debit: Inventory / Credit: AP)
        finance = FinanceService(self.db)
        finance.record_transaction(
            amount=total_value,
            debit_code="1100-RAW",
            credit_code="2100-PAYABLE",
            description=f"Automated GR for PO: {po.po_number}",
            reference_id=str(po.po_number)
        )
        
        self.db.commit()
        return {"status": "SUCCESS", "message": f"PO {po.po_number} received into bin {target_bin_id}."}
