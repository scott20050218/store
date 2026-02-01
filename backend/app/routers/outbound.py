from fastapi import APIRouter, Depends

from app.core.auth import get_current_user
from app.models.user import User
from app.schemas.outbound import OutboundRequest
from app.services.inventory_service import outbound_fifo
from app.database import get_db
from sqlalchemy.orm import Session

router = APIRouter()


@router.post("/outbound")
def outbound(
    data: OutboundRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    success, message = outbound_fifo(db, data.itemType, data.quantity)
    if success:
        return {"success": True}
    return {"success": False, "message": message}
