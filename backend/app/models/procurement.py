from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), index=True)
    tin = Column(String(20), unique=True, index=True)  # STIR
    balance = Column(Float, default=0.0)
    contract_terms = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    purchase_orders = relationship("PurchaseOrder", back_populates="supplier")

class PurchaseRequisition(Base):
    __tablename__ = "purchase_requisitions"

    id = Column(Integer, primary_key=True, index=True)
    pr_number = Column(String(20), unique=True, index=True)
    sku = Column(String(50), ForeignKey("materials.sku"))
    requested_qty = Column(Float)
    status = Column(String(20), default="PENDING")  # PENDING, APPROVED, CONVERTED, REJECTED
    requested_by = Column(String(50))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id = Column(Integer, primary_key=True, index=True)
    po_number = Column(String(20), unique=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    total_amount = Column(Float, default=0.0)
    status = Column(String(20), default="DRAFT")  # DRAFT, SENT, ACKNOWLEDGED, DELIVERED
    qr_code = Column(String(100), unique=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    delivered_at = Column(DateTime(timezone=True), nullable=True)

    supplier = relationship("Supplier", back_populates="purchase_orders")
    items = relationship("PurchaseOrderItem", back_populates="order")

class PurchaseOrderItem(Base):
    __tablename__ = "purchase_order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("purchase_orders.id"))
    sku = Column(String(50), ForeignKey("materials.sku"))
    quantity = Column(Float)
    unit_price = Column(Float)
    line_total = Column(Float)

    order = relationship("PurchaseOrder", back_populates="items")
