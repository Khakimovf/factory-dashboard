from sqlalchemy.orm import Session
from app.models.finance import GLAccount, JournalEntry
from app.models.wms import WMSMaterial
from sqlalchemy.sql import func
import uuid

class FinanceService:
    def __init__(self, db: Session):
        self.db = db

    def record_transaction(self, amount: float, debit_code: str, credit_code: str, description: str, reference_id: str):
        """Creates an automated Journal Entry for internal movements."""
        debit_acc = self.db.query(GLAccount).filter(GLAccount.account_code == debit_code).first()
        credit_acc = self.db.query(GLAccount).filter(GLAccount.account_code == credit_code).first()

        if not debit_acc or not credit_acc:
            if not debit_acc:
                debit_acc = GLAccount(account_code=debit_code, name=f"Auto {debit_code}", type="ASSET")
                self.db.add(debit_acc)
            if not credit_acc:
                credit_acc = GLAccount(account_code=credit_code, name=f"Auto {credit_code}", type="ASSET")
                self.db.add(credit_acc)
            self.db.flush()

        entry = JournalEntry(
            entry_number=f"JE-{uuid.uuid4().hex[:8].upper()}",
            description=description,
            reference_id=reference_id,
            debit_account_id=debit_acc.id,
            credit_account_id=credit_acc.id,
            amount=amount
        )
        
        debit_acc.balance += amount
        credit_acc.balance -= amount
        
        self.db.add(entry)
        self.db.commit()
        return entry

    def calculate_bom_cost(self, sku: str):
        """
        Calculates COGS based on BOM structure and last purchase prices.
        Includes 15% operational overhead.
        """
        from app.models.production_db import BOMStructure
        
        bom = self.db.query(BOMStructure).filter(BOMStructure.finished_good_sku == sku).first()
        if not bom:
            return 0.0

        raw_material_cost = 0.0
        for item in bom.items:
            material = self.db.query(WMSMaterial).filter(WMSMaterial.sku == item.component_sku).first()
            price = material.last_purchase_price if material and material.last_purchase_price else 1.0 
            raw_material_cost += price * item.quantity

        # Operational Overhead (Labor + Energy) - 1.15 multiplier
        total_cost = raw_material_cost * 1.15
        
        return round(total_cost, 2)
