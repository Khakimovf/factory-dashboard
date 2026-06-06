from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

class GLAccount(Base):
    __tablename__ = "gl_accounts"

    id = Column(Integer, primary_key=True, index=True)
    account_code = Column(String(20), unique=True, index=True)
    name = Column(String(100))
    type = Column(String(20))  # ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
    balance = Column(Float, default=0.0)

class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id = Column(Integer, primary_key=True, index=True)
    entry_number = Column(String(20), unique=True, index=True)
    date = Column(DateTime(timezone=True), server_default=func.now())
    description = Column(Text)
    reference_id = Column(String(50))  # Link to WMSMovement.id or PO.id
    debit_account_id = Column(Integer, ForeignKey("gl_accounts.id"))
    credit_account_id = Column(Integer, ForeignKey("gl_accounts.id"))
    amount = Column(Float)
    status = Column(String(20), default="POSTED")

    debit_account = relationship("GLAccount", foreign_keys=[debit_account_id])
    credit_account = relationship("GLAccount", foreign_keys=[credit_account_id])
