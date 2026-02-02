from sqlalchemy import Column, BigInteger, String, Integer, Date, DateTime
from sqlalchemy.sql import func

from app.database import Base


class InboundHistory(Base):
    """入库历史：记录每次成功入库的明细，关联用户"""
    __tablename__ = "inbound_history"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, nullable=False, index=True)
    inventory_record_id = Column(String(36), nullable=False, index=True)  # 关联 inventory_records
    item_type = Column(String(64), nullable=False)
    unit = Column(String(32), nullable=True, default="")
    quantity = Column(Integer, nullable=False)
    expiry_date = Column(Date, nullable=False)
    inbound_date = Column(Date, nullable=False)
    production_date = Column(String(32), nullable=True, default="")
    tag = Column(String(16), nullable=True, default="")
    location = Column(String(64), nullable=True, default="")
    photo = Column(String(512), nullable=True, default="")
    create_time = Column(DateTime, server_default=func.now())
