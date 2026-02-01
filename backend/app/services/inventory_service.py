from datetime import date, datetime
from typing import List
from uuid import uuid4

from sqlalchemy.orm import Session

from app.models.inventory import InventoryRecord
from app.services.config_service import get_config_value


def add_inbound(
    db: Session,
    item_type: str,
    quantity: int,
    expiry_date: str,
    inbound_date: str,
    production_date: str = "",
    tag: str = "",
    location: str = "",
    photo: str = "",
) -> str:
    record = InventoryRecord(
        id=str(uuid4()),
        item_type=item_type,
        quantity=quantity,
        expiry_date=date.fromisoformat(expiry_date),
        inbound_date=date.fromisoformat(inbound_date),
        production_date=production_date or "",
        tag=tag or "",
        location=location or "",
        photo=photo or "",
    )
    db.add(record)
    db.commit()
    return record.id


def outbound_fifo(
    db: Session, item_type: str, quantity: int
) -> tuple[bool, str]:
    """FIFO outbound. Returns (success, message)."""
    records = (
        db.query(InventoryRecord)
        .filter(InventoryRecord.item_type == item_type)
        .order_by(InventoryRecord.inbound_date.asc(), InventoryRecord.create_time.asc())
        .all()
    )
    if not records:
        return False, "该物品库存为空"
    total = sum(r.quantity for r in records)
    if total < quantity:
        return False, f"库存不足，当前库存: {total}"
    remaining = quantity
    for r in records:
        if remaining <= 0:
            break
        if r.quantity <= remaining:
            remaining -= r.quantity
            db.delete(r)
        else:
            r.quantity -= remaining
            remaining = 0
    db.commit()
    return True, "出库成功"


def get_all_records(db: Session) -> List[InventoryRecord]:
    return (
        db.query(InventoryRecord)
        .order_by(InventoryRecord.inbound_date.asc(), InventoryRecord.create_time.asc())
        .all()
    )


def get_stats(db: Session) -> List[dict]:
    """按物品类型聚合：总量、低库存、即将过期、最近过期日"""
    records = get_all_records(db)
    low_threshold = get_config_value(db, "LOW_STOCK_THRESHOLD") or 10
    expiry_days = get_config_value(db, "EXPIRY_WARNING_DAYS") or 7
    today = date.today()
    by_type = {}
    for r in records:
        if r.item_type not in by_type:
            by_type[r.item_type] = {
                "type": r.item_type,
                "totalQuantity": 0,
                "items": [],
                "nearestExpiryDate": None,
            }
        by_type[r.item_type]["totalQuantity"] += r.quantity
        by_type[r.item_type]["items"].append(r)
        if r.expiry_date:
            if (
                by_type[r.item_type]["nearestExpiryDate"] is None
                or r.expiry_date < by_type[r.item_type]["nearestExpiryDate"]
            ):
                by_type[r.item_type]["nearestExpiryDate"] = r.expiry_date.isoformat()
    result = []
    for item_type, data in by_type.items():
        total = data["totalQuantity"]
        nearest = data["nearestExpiryDate"]
        days_until = None
        if nearest:
            d = date.fromisoformat(nearest)
            days_until = (d - today).days
        has_expiry_warning = days_until is not None and days_until <= expiry_days
        result.append(
            {
                "type": item_type,
                "totalQuantity": total,
                "isLowStock": total > 0 and total < low_threshold,
                "isEmpty": total == 0,
                "hasExpiryWarning": has_expiry_warning,
                "nearestExpiryDate": nearest,
            }
        )
    return result


def get_overview(db: Session) -> List[dict]:
    """每条记录含 daysRemaining、progressPercent，按 daysRemaining 排序"""
    records = get_all_records(db)
    today = date.today()
    today_ts = datetime.combine(today, datetime.min.time())
    result = []
    for r in records:
        if not r.expiry_date:
            continue
        expiry_ts = datetime.combine(r.expiry_date, datetime.min.time())
        inbound_ts = (
            datetime.combine(r.inbound_date, datetime.min.time())
            if r.inbound_date
            else expiry_ts
        )
        days_remaining = (expiry_ts - today_ts).days
        total_shelf_days = max(
            1, (expiry_ts - inbound_ts).days if inbound_ts else 365
        )
        progress_percent = max(
            0, min(100, (days_remaining / total_shelf_days) * 100)
        )
        result.append(
            {
                "id": r.id,
                "itemType": r.item_type,
                "quantity": r.quantity,
                "expiryDate": r.expiry_date.isoformat(),
                "daysRemaining": days_remaining,
                "progressPercent": round(progress_percent, 2),
            }
        )
    result.sort(key=lambda x: x["daysRemaining"])
    return result


def get_outbound_list(db: Session) -> List[dict]:
    """物品+标签+数量"""
    records = get_all_records(db)
    return [
        {
            "id": r.id,
            "itemType": r.item_type,
            "tag": r.tag or "",
            "quantity": r.quantity,
        }
        for r in records
    ]


def get_statistics_list(db: Session) -> List[dict]:
    """物品+标签+数量+过期日期，按物品名排序"""
    records = get_all_records(db)
    result = [
        {
            "id": r.id,
            "itemType": r.item_type,
            "tag": r.tag or "",
            "quantity": r.quantity,
            "expiryDate": r.expiry_date.isoformat() if r.expiry_date else "",
        }
        for r in records
    ]
    result.sort(key=lambda x: (x["itemType"] or "", x["expiryDate"]))
    return result
