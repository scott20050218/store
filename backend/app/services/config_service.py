import json
from typing import Any

from sqlalchemy.orm import Session

from app.models.config import Config

DEFAULT_CONFIG = {
    "ITEM_TYPES": ["大米", "油", "肉", "鸡蛋"],
    "UNIT": [],
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


def ensure_unit(db: Session, unit: str) -> None:
    """若 unit 不在 config 的 UNIT 中，则追加并写回 config 表"""
    if not (unit and unit.strip()):
        return
    unit = unit.strip()
    current = get_config_value(db, "UNIT")
    if not isinstance(current, list):
        current = list(DEFAULT_CONFIG.get("UNIT", []))
    if unit in current:
        return
    current.append(unit)
    row = db.query(Config).filter(Config.key == "UNIT").first()
    if row is None:
        db.add(Config(key="UNIT", value=json.dumps(current)))
    else:
        row.value = json.dumps(current)
    db.commit()


def get_auth_config(db: Session) -> dict:
    """Get config returned with token on auth success."""
    return {
        "itemTypes": get_config_value(db, "ITEM_TYPES"),
        "unit": get_config_value(db, "UNIT"),
        "lowStockThreshold": get_config_value(db, "LOW_STOCK_THRESHOLD"),
        "expiryWarningDays": get_config_value(db, "EXPIRY_WARNING_DAYS"),
        "expiry": get_config_value(db, "EXPIRY"),
    }
