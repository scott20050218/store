"""注册历史：每次注册尝试记录 openid、ip、时间、手机号、是否成功，成功时记录 user_id"""
from sqlalchemy import Column, BigInteger, String, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func

from app.database import Base


class RegisterHistory(Base):
    __tablename__ = "register_history"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    openid = Column(String(128), nullable=True, index=True)
    ip = Column(String(45), nullable=True)
    phone = Column(String(11), nullable=False, index=True)
    register_time = Column(DateTime, server_default=func.now(), nullable=False)
    success = Column(Boolean, nullable=False)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=True, index=True)
