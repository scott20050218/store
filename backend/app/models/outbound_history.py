from sqlalchemy import Column, BigInteger, String, Integer, Date, DateTime
from sqlalchemy.sql import func

from app.database import Base


class OutboundHistory(Base):
    """出库历史：记录每次成功出库的明细，关联用户"""
    __tablename__ = "outbound_history"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, nullable=False, index=True)
    item_type = Column(String(64), nullable=False, index=True)
    quantity = Column(Integer, nullable=False)
    outbound_date = Column(Date, nullable=False)
    tag = Column(String(16), nullable=True, default="")
    location = Column(String(64), nullable=True, default="")
    create_time = Column(DateTime, server_default=func.now())
