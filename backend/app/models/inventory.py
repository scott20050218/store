from sqlalchemy import Column, String, Integer, Date, DateTime, Text
from sqlalchemy.sql import func

from app.database import Base


class InventoryRecord(Base):
    __tablename__ = "inventory_records"

    id = Column(String(36), primary_key=True)
    item_type = Column(String(64), nullable=False, index=True)
    unit = Column(String(32), nullable=True, default="")
    quantity = Column(Integer, nullable=False)
    expiry_date = Column(Date, nullable=False)
    inbound_date = Column(Date, nullable=False)
    production_date = Column(String(32), nullable=True, default="")
    tag = Column(String(16), nullable=True, default="")
    location = Column(String(64), nullable=True, default="")
    photo = Column(String(512), nullable=True, default="")
    expiry_warning_days = Column(Integer, nullable=True, default=None)
    create_time = Column(DateTime, server_default=func.now())
