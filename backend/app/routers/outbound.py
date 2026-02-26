from fastapi import APIRouter, Depends

from app.core.auth import get_current_user
from app.models.user import User
from app.schemas.outbound import OutboundRequest
from app.services.inventory_service import outbound_fifo, outbound_by_id
from app.database import get_db
from sqlalchemy.orm import Session

router = APIRouter()


@router.post("/outbound")
def outbound(
    data: OutboundRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if data.id:
        # 使用指定物品ID出库
        success, message = outbound_by_id(
            db, current_user.id, data.id, data.quantity, data.outboundDate
        )
    else:
        # 使用FIFO出库
        success, message = outbound_fifo(
            db, current_user.id, data.itemType, data.quantity, data.outboundDate
        )
    if success:
        return {"success": True}
    return {"success": False, "message": message}
