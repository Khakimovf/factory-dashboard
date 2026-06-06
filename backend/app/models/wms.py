from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, CheckConstraint, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

class WMSZone(Base):
    __tablename__ = "wms_zones"

    id = Column(Integer, primary_key=True, index=True)
    zone_code = Column(String(10), unique=True, index=True)
    description = Column(String(100))
    type = Column(String(20))  # STORAGE, RECEIVING, SHIPPING

    bins = relationship("WMSBin", back_populates="zone")

class WMSBin(Base):
    __tablename__ = "wms_bins"

    id = Column(Integer, primary_key=True, index=True)
    bin_code = Column(String(20), unique=True, index=True) # Z-01-R01-S01-B01
    zone_id = Column(Integer, ForeignKey("wms_zones.id"))
    max_capacity_pcs = Column(Integer)
    status = Column(String(20), default="ACTIVE")

    zone = relationship("WMSZone", back_populates="bins")
    stock_balances = relationship("WMSStockBalance", back_populates="bin")

class WMSMaterial(Base):
    __tablename__ = "materials"

    sku = Column(String(50), primary_key=True, index=True)
    description = Column(String(200))
    default_bin_id = Column(Integer, ForeignKey("wms_bins.id"), nullable=True)
    safety_stock = Column(Integer, default=0)
    last_purchase_price = Column(Float, default=0.0)

class WMSBatch(Base):
    __tablename__ = "wms_batches"

    batch_id = Column(String(50), primary_key=True, index=True)
    sku = Column(String(50), ForeignKey("materials.sku"))
    production_date = Column(Date)
    shift = Column(String(1)) # A, B, C
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    qc_status = Column(String(20), default="PASSED")

class WMSStockBalance(Base):
    __tablename__ = "wms_stock_balances"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String(50), ForeignKey("materials.sku"), index=True)
    batch_id = Column(String(50), ForeignKey("wms_batches.batch_id"), index=True)
    bin_id = Column(Integer, ForeignKey("wms_bins.id"), index=True)
    qty_available = Column(Integer, default=0)
    qty_reserved = Column(Integer, default=0)
    qty_blocked = Column(Integer, default=0)

    __table_args__ = (
        CheckConstraint('qty_available >= 0', name='check_qty_avail_positive'),
        CheckConstraint('qty_reserved >= 0', name='check_qty_rsv_positive'),
        CheckConstraint('qty_blocked >= 0', name='check_qty_blk_positive'),
    )

    bin = relationship("WMSBin", back_populates="stock_balances")

class WMSMovement(Base):
    __tablename__ = "wms_movements"

    id = Column(Integer, primary_key=True, index=True)
    movement_type = Column(String(20)) # RECEIPT, PICK, GI, TRANSFER
    sku = Column(String(50), ForeignKey("materials.sku"))
    batch_id = Column(String(50))
    from_bin_id = Column(Integer, nullable=True)
    to_bin_id = Column(Integer, nullable=True)
    qty = Column(Integer)
    reference_doc = Column(String(50), nullable=True) # e.g. SO-2026-001
    operator_id = Column(String(50))
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
