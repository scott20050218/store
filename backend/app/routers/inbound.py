from datetime import date

from fastapi import APIRouter, Depends

from app.core.auth import get_current_user
from app.models.user import User
from app.schemas.inbound import InboundRequest
from app.services.inventory_service import add_inbound
from app.services.config_service import ensure_item_type, ensure_unit
from app.database import get_db
from sqlalchemy.orm import Session

router = APIRouter()


@router.post("/inbound")
def inbound(
    data: InboundRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        date.fromisoformat(data.expiryDate)
        date.fromisoformat(data.inboundDate)
    except ValueError:
        return {"success": False, "message": "日期格式错误，请使用 YYYY-MM-DD"}
    try:
        record_id = add_inbound(
            db=db,
            user_id=current_user.id,
            item_type=data.itemType,
            quantity=data.quantity,
            expiry_date=data.expiryDate,
            inbound_date=data.inboundDate,
            production_date=data.productionDate or "",
            expiry_warning_days=data.expiryWarningDays,
            unit=data.unit or "",
            tag=data.tag or "",
            location=data.location or "",
            photo=data.photo or "",
        )
        ensure_item_type(db, data.itemType)
        if data.unit and data.unit.strip():
            ensure_unit(db, data.unit.strip())
        return {"success": True, "data": {"id": record_id}}
    except ValueError as e:
        return {"success": False, "message": str(e)}
