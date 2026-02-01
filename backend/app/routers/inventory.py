from fastapi import APIRouter, Depends

from app.core.auth import get_current_user
from app.models.user import User
from app.services.inventory_service import (
    get_overview,
    get_outbound_list,
    get_io_stats_by_range,
    get_io_details,
    get_my_inbound,
    get_my_outbound,
)
from app.database import get_db
from sqlalchemy.orm import Session

router = APIRouter()


@router.get("/overview")
def overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data = get_overview(db)
    return {"success": True, "data": {"items": data}}


@router.get("/outbound-list")
def outbound_list(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data = get_outbound_list(db)
    return {"success": True, "data": {"items": data}}


@router.get("/io-stats")
def io_stats(
    startDate: str,
    endDate: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data = get_io_stats_by_range(db, startDate, endDate)
    return {"success": True, "data": {"items": data}}


@router.get("/io-details")
def io_details(
    itemType: str,
    startDate: str,
    endDate: str,
    type: str = "both",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if type not in ("inbound", "outbound", "both"):
        type = "both"
    data = get_io_details(db, itemType, startDate, endDate, type)
    return {"success": True, "data": {"items": data}}


@router.get("/my-inbound")
def my_inbound(
    page: int = 1,
    limit: int = 5,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items, has_more = get_my_inbound(db, current_user.id, page, limit)
    return {"success": True, "data": {"items": items, "hasMore": has_more}}


@router.get("/my-outbound")
def my_outbound(
    page: int = 1,
    limit: int = 5,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items, has_more = get_my_outbound(db, current_user.id, page, limit)
    return {"success": True, "data": {"items": items, "hasMore": has_more}}


