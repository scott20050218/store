from fastapi import APIRouter, Depends

from app.core.auth import get_current_user
from app.models.user import User
from app.services.inventory_service import (
    get_stats,
    get_overview,
    get_outbound_list,
    get_statistics_list,
)
from app.database import get_db
from sqlalchemy.orm import Session

router = APIRouter()


@router.get("/stats")
def stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data = get_stats(db)
    return {"success": True, "data": {"items": data}}


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


@router.get("/statistics-list")
def statistics_list(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data = get_statistics_list(db)
    return {"success": True, "data": {"items": data}}
