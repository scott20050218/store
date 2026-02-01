import json
from typing import Any

from sqlalchemy.orm import Session

from app.models.config import Config

DEFAULT_CONFIG = {
    "ITEM_TYPES": ["大米", "油", "肉", "鸡蛋"],
    "LOW_STOCK_THRESHOLD": 10,
    "EXPIRY_WARNING_DAYS": 7,
    "EXPIRY": [1, 3, 6],
}


def get_config_value(db: Session, key: str) -> Any:
    row = db.query(Config).filter(Config.key == key).first()
    if row is None or row.value is None:
        return DEFAULT_CONFIG.get(key)
    try:
        return json.loads(row.value)
    except (json.JSONDecodeError, TypeError):
        return row.value


def get_expiry_warning_days_threshold(db: Session) -> int:
    """返回用于统计/总览的单一告警阈值（天）。当 EXPIRY_WARNING_DAYS 为逗号分隔或数组时取最大值。"""
    raw = get_config_value(db, "EXPIRY_WARNING_DAYS")
    if raw is None:
        return 7
    if isinstance(raw, list):
        nums = [int(x) for x in raw if isinstance(x, (int, float)) or (isinstance(x, str) and x.strip().replace("-", "").isdigit())]
        return max(nums) if nums else 7
    if isinstance(raw, str):
        parts = [int(x.strip()) for x in raw.split(",") if x.strip().replace("-", "").isdigit()]
        return max(parts) if parts else 7
    try:
        return int(raw) if raw else 7
    except (TypeError, ValueError):
        return 7


def ensure_item_type(db: Session, item_type: str) -> None:
    """若 item_type 不在 config 的 ITEM_TYPES 中，则追加并写回 config 表"""
    if not (item_type and item_type.strip()):
        return
    item_type = item_type.strip()
    current = get_config_value(db, "ITEM_TYPES")
    if not isinstance(current, list):
        current = list(DEFAULT_CONFIG.get("ITEM_TYPES", []))
    if item_type in current:
        return
    current.append(item_type)
    row = db.query(Config).filter(Config.key == "ITEM_TYPES").first()
    if row is None:
        db.add(Config(key="ITEM_TYPES", value=json.dumps(current)))
    else:
        row.value = json.dumps(current)
    db.commit()


def get_auth_config(db: Session) -> dict:
    """Get config returned with token on auth success."""
    return {
        "itemTypes": get_config_value(db, "ITEM_TYPES"),
        "lowStockThreshold": get_config_value(db, "LOW_STOCK_THRESHOLD"),
        "expiryWarningDays": get_config_value(db, "EXPIRY_WARNING_DAYS"),
        "expiry": get_config_value(db, "EXPIRY"),
    }
