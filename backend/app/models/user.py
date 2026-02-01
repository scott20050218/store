from sqlalchemy import Column, BigInteger, String, DateTime
from sqlalchemy.sql import func

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(String(64), nullable=True, default="")
    phone = Column(String(11), unique=True, nullable=False, index=True)
    openid = Column(String(128), nullable=True, index=True)
    passcode = Column(String(64), nullable=True)  # 注册时存入，请求 token 时校验
    status = Column(String(16), nullable=False, default="正常")  # 正常/冻结/删除/已注册
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
