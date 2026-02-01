"""登录历史：每次登录尝试记录 user_id、openid、ip、时间、是否成功"""
from sqlalchemy import Column, BigInteger, Boolean, DateTime, ForeignKey, String
from sqlalchemy.sql import func

from app.database import Base


class LoginHistory(Base):
    __tablename__ = "login_history"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=True, index=True)
    openid = Column(String(128), nullable=True, index=True)
    ip = Column(String(45), nullable=True)
    login_time = Column(DateTime, server_default=func.now(), nullable=False)
    success = Column(Boolean, nullable=False)
