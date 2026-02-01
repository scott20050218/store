#!/usr/bin/env python3
"""
重建缺失的表（如 users 被手动删除后）
使用 SQLAlchemy 的 create_all，仅创建不存在的表，不会影响已有数据
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, Base
from app.models import User, InventoryRecord, Config  # noqa: F401 - 确保模型已加载

if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    print("表结构已同步（缺失的表已创建）")
