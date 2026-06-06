from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base

class BOMStructure(Base):
    __tablename__ = "bom_structures"

    id = Column(Integer, primary_key=True, index=True)
    finished_good_sku = Column(String(50), ForeignKey("materials.sku"), unique=True)
    description = Column(String(200))

    items = relationship("BOMItem", back_populates="bom")

class BOMItem(Base):
    __tablename__ = "bom_items"

    id = Column(Integer, primary_key=True, index=True)
    bom_id = Column(Integer, ForeignKey("bom_structures.id"))
    component_sku = Column(String(50), ForeignKey("materials.sku"))
    quantity = Column(Float) # Quantity required for 1 unit of FG

    bom = relationship("BOMStructure", back_populates="items")
