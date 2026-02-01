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


def get_auth_config(db: Session) -> dict:
    """Get config returned with token on auth success."""
    return {
        "itemTypes": get_config_value(db, "ITEM_TYPES"),
        "lowStockThreshold": get_config_value(db, "LOW_STOCK_THRESHOLD"),
        "expiryWarningDays": get_config_value(db, "EXPIRY_WARNING_DAYS"),
        "expiry": get_config_value(db, "EXPIRY"),
    }
