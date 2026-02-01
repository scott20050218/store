from sqlalchemy import Column, String, Text

from app.database import Base


class Config(Base):
    __tablename__ = "config"

    key = Column(String(64), primary_key=True)
    value = Column(Text, nullable=True)
