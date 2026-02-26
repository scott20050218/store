from datetime import date, datetime
from typing import List
from uuid import uuid4

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.inventory import InventoryRecord
from app.models.inbound_history import InboundHistory
from app.models.outbound_history import OutboundHistory
from app.models.user import User
def add_inbound(
    db: Session,
    user_id: int,
    item_type: str,
    quantity: int,
    expiry_date: str,
    inbound_date: str,
    production_date: str = "",
    expiry_warning_days: int | None = None,
    unit: str = "",
    tag: str = "",
    location: str = "",
    photo: str = "",
) -> str:
    record = InventoryRecord(
        id=str(uuid4()),
        item_type=item_type,
        unit=unit or "",
        quantity=quantity,
        expiry_date=date.fromisoformat(expiry_date),
        inbound_date=date.fromisoformat(inbound_date),
        production_date=production_date or "",
        expiry_warning_days=expiry_warning_days,
        tag=tag or "",
        location=location or "",
        photo=photo or "",
    )
    db.add(record)
    db.flush()  # 获取 record.id
    history = InboundHistory(
        user_id=user_id,
        inventory_record_id=record.id,
        item_type=item_type,
        unit=unit or "",
        quantity=quantity,
        expiry_date=date.fromisoformat(expiry_date),
        inbound_date=date.fromisoformat(inbound_date),
        production_date=production_date or "",
        tag=tag or "",
        location=location or "",
        photo=photo or "",
    )
    db.add(history)
    db.commit()
    return record.id


def outbound_by_id(
    db: Session, user_id: int, record_id: str, quantity: int, outbound_date: str
) -> tuple[bool, str]:
    """Outbound by specific record ID. Returns (success, message)."""
    record = db.query(InventoryRecord).filter(InventoryRecord.id == record_id).first()
    if not record:
        return False, "该物品记录不存在"
    if record.quantity < quantity:
        return False, f"库存不足，当前库存: {record.quantity}"
    remaining = quantity
    unit = record.unit or ""
    tag = record.tag or ""
    location = record.location or ""
    if record.quantity <= remaining:
        remaining -= record.quantity
        db.delete(record)
    else:
        record.quantity -= remaining
        remaining = 0
    history = OutboundHistory(
        user_id=user_id,
        item_type=record.item_type,
        quantity=quantity,
        outbound_date=date.fromisoformat(outbound_date),
        unit=unit,
        tag=tag,
        location=location,
    )
    db.add(history)
    db.commit()
    return True, "出库成功"


def outbound_fifo(
    db: Session, user_id: int, item_type: str, quantity: int, outbound_date: str
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
    first_unit = ""
    first_tag = ""
    first_location = ""
    for r in records:
        if not first_unit and r.unit:
            first_unit = r.unit
        if not first_tag and r.tag:
            first_tag = r.tag
        if not first_location and r.location:
            first_location = r.location
        if remaining <= 0:
            break
        if r.quantity <= remaining:
            remaining -= r.quantity
            db.delete(r)
        else:
            r.quantity -= remaining
            remaining = 0
    history = OutboundHistory(
        user_id=user_id,
        item_type=item_type,
        quantity=quantity,
        outbound_date=date.fromisoformat(outbound_date),
        unit=first_unit or "",
        tag=first_tag or "",
        location=first_location or "",
    )
    db.add(history)
    db.commit()
    return True, "出库成功"


def get_all_records(db: Session) -> List[InventoryRecord]:
    return (
        db.query(InventoryRecord)
        .order_by(InventoryRecord.inbound_date.asc(), InventoryRecord.create_time.asc())
        .all()
    )


def get_overview(db: Session) -> List[dict]:
    """每条记录含物品、标签、位置、数量、入库时间、到期日期、照片、到期告警，按 daysRemaining 排序。仅当记录设置了 expiry_warning_days 时才告警。包含所有记录，不因无到期日期而过滤"""
    records = get_all_records(db)
    today = date.today()
    today_ts = datetime.combine(today, datetime.min.time())
    result = []
    for r in records:
        if r.expiry_date:
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
            expiry_warning = (
                r.expiry_warning_days is not None
                and days_remaining <= r.expiry_warning_days
            )
            expiry_date_str = r.expiry_date.isoformat()
        else:
            days_remaining = 999999
            progress_percent = 100
            expiry_warning = False
            expiry_date_str = ""
        result.append(
            {
                "id": r.id,
                "itemType": r.item_type,
                "unit": r.unit or "",
                "tag": r.tag or "",
                "location": r.location or "",
                "quantity": r.quantity,
                "inboundDate": r.inbound_date.isoformat() if r.inbound_date else "",
                "expiryDate": expiry_date_str,
                "daysRemaining": days_remaining,
                "progressPercent": round(progress_percent, 2),
                "expiryWarning": expiry_warning,
                "photo": r.photo or "",
            }
        )
    result.sort(key=lambda x: x["daysRemaining"])
    return result


def get_outbound_list(db: Session) -> List[dict]:
    """物品+标签+数量+单位"""
    records = get_all_records(db)
    return [
        {
            "id": r.id,
            "itemType": r.item_type,
            "tag": r.tag or "",
            "quantity": r.quantity,
            "unit": r.unit or "",
        }
        for r in records
    ]


def get_io_stats_by_range(db: Session, start_date: str, end_date: str) -> List[dict]:
    """按时间范围聚合出入库统计，按物品类型"""
    start = date.fromisoformat(start_date)
    end = date.fromisoformat(end_date)
    inbound_rows = (
        db.query(InboundHistory.item_type, func.sum(InboundHistory.quantity).label("total"))
        .filter(InboundHistory.inbound_date >= start, InboundHistory.inbound_date <= end)
        .group_by(InboundHistory.item_type)
        .all()
    )
    outbound_rows = (
        db.query(OutboundHistory.item_type, func.sum(OutboundHistory.quantity).label("total"))
        .filter(OutboundHistory.outbound_date >= start, OutboundHistory.outbound_date <= end)
        .group_by(OutboundHistory.item_type)
        .all()
    )
    inbound_by_type = {r.item_type: int(r.total or 0) for r in inbound_rows}
    outbound_by_type = {r.item_type: int(r.total or 0) for r in outbound_rows}
    all_types = set(inbound_by_type.keys()) | set(outbound_by_type.keys())
    result = []
    for item_type in sorted(all_types):
        inbound_qty = inbound_by_type.get(item_type, 0)
        outbound_qty = outbound_by_type.get(item_type, 0)
        result.append({
            "itemType": item_type,
            "inboundQty": inbound_qty,
            "outboundQty": outbound_qty,
            "netChange": inbound_qty - outbound_qty,
        })
    return result


def get_io_details(
    db: Session, item_type: str, start_date: str, end_date: str, detail_type: str
) -> List[dict]:
    """按物品、时间范围获取入库/出库明细。detail_type: inbound|outbound|both"""
    start = date.fromisoformat(start_date)
    end = date.fromisoformat(end_date)
    result = []
    if detail_type in ("inbound", "both"):
        rows = (
            db.query(InboundHistory, User.name)
            .join(User, InboundHistory.user_id == User.id)
            .filter(
                InboundHistory.item_type == item_type,
                InboundHistory.inbound_date >= start,
                InboundHistory.inbound_date <= end,
            )
            .order_by(InboundHistory.create_time.desc())
            .all()
        )
        for r, user_name in rows:
            result.append({
                "type": "inbound",
                "date": r.inbound_date.isoformat(),
                "quantity": r.quantity,
                "unit": r.unit or "",
                "location": r.location or "",
                "expiryDate": r.expiry_date.isoformat() if r.expiry_date else "",
                "tag": r.tag or "",
                "itemType": r.item_type,
                "userName": user_name or "",
            })
    if detail_type in ("outbound", "both"):
        rows = (
            db.query(OutboundHistory, User.name)
            .join(User, OutboundHistory.user_id == User.id)
            .filter(
                OutboundHistory.item_type == item_type,
                OutboundHistory.outbound_date >= start,
                OutboundHistory.outbound_date <= end,
            )
            .order_by( OutboundHistory.create_time.desc())
            .all()
        )
        for r, user_name in rows:
            result.append({
                "type": "outbound",
                "date": r.outbound_date.isoformat(),
                "quantity": r.quantity,
                "unit": r.unit or "",
                "location": r.location or "",
                "expiryDate": "",
                "tag": r.tag or "",
                "itemType": r.item_type,
                "userName": user_name or "",
            })
    if detail_type == "both":
        result.sort(key=lambda x: (x["date"], x["type"]), reverse=True)
    return result


def get_my_inbound(
    db: Session, user_id: int, page: int = 1, limit: int = 5
) -> tuple[List[dict], bool]:
    """当前用户的入库记录，分页。返回 (items, has_more)"""
    offset = (page - 1) * limit
    rows = (
        db.query(InboundHistory)
        .filter(InboundHistory.user_id == user_id)
        .order_by(InboundHistory.create_time.desc())
        .offset(offset)
        .limit(limit + 1)
        .all()
    )
    has_more = len(rows) > limit
    items = rows[:limit]
    return [
        {
            "id": r.id,
            "itemType": r.item_type,
            "quantity": r.quantity,
            "unit": r.unit or "",
            "inboundDate": r.inbound_date.isoformat() if r.inbound_date else "",
            "expiryDate": r.expiry_date.isoformat() if r.expiry_date else "",
            "location": r.location or "",
            "tag": r.tag or "",
            "createTime": r.create_time.isoformat() if r.create_time else "",
        }
        for r in items
    ], has_more


def get_my_outbound(
    db: Session, user_id: int, page: int = 1, limit: int = 5
) -> tuple[List[dict], bool]:
    """当前用户的出库记录，分页。返回 (items, has_more)"""
    offset = (page - 1) * limit
    rows = (
        db.query(OutboundHistory)
        .filter(OutboundHistory.user_id == user_id)
        .order_by(OutboundHistory.create_time.desc())
        .offset(offset)
        .limit(limit + 1)
        .all()
    )
    has_more = len(rows) > limit
    items = rows[:limit]
    return [
        {
            "id": r.id,
            "itemType": r.item_type,
            "quantity": r.quantity,
            "unit": r.unit or "",
            "outboundDate": r.outbound_date.isoformat() if r.outbound_date else "",
            "location": r.location or "",
            "tag": r.tag or "",
            "createTime": r.create_time.isoformat() if r.create_time else "",
        }
        for r in items
    ], has_more
