#!/usr/bin/env python3
"""
用户预初始化脚本：向 users 表插入 name、phone、status='正常'
运行前需确保数据库已创建且已执行 alembic upgrade head
"""
import json
import os
import sys

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.database import SessionLocal, engine
from app.models.config import Config
from app.models.user import User


def init_users():
    """预初始化用户：可在此修改要插入的用户列表"""
    db = SessionLocal()
    try:
        users_to_add = [
            {"name": "admin", "phone": "13800000000"},  # 管理员，用于管理用户
            {"name": "张三", "phone": "13800138001"},
            {"name": "李四", "phone": "13800138002"},
            # 按需添加更多用户
        ]
        for u in users_to_add:
            existing = db.query(User).filter(User.phone == u["phone"]).first()
            if not existing:
                user = User(name=u["name"], phone=u["phone"], status="正常")
                db.add(user)
                print(f"已添加用户: {u['name']} {u['phone']}")
            else:
                print(f"用户已存在，跳过: {u['phone']}")
        db.commit()
    finally:
        db.close()


def init_config():
    """初始化 config 表默认配置"""
    db = SessionLocal()
    try:
        defaults = {
            "ITEM_TYPES": json.dumps(["大米", "油", "肉", "鸡蛋"]),
            "UNIT": json.dumps(["袋", "瓶", "箱", "斤", "个"]),
            "LOW_STOCK_THRESHOLD": "10",
            "EXPIRY_WARNING_DAYS": "7",
            "EXPIRY": json.dumps([1, 3, 6]),
        }
        for key, value in defaults.items():
            existing = db.query(Config).filter(Config.key == key).first()
            if not existing:
                cfg = Config(key=key, value=value)
                db.add(cfg)
                print(f"已添加配置: {key}")
        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    print("=== 初始化用户 ===")
    init_users()
    print("\n=== 初始化配置 ===")
    init_config()
    print("\n完成")
