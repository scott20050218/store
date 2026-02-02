from fastapi import APIRouter, Depends

from app.core.auth import get_current_user
from app.models.user import User
from app.services.config_service import get_config_value
from app.database import get_db
from sqlalchemy.orm import Session

router = APIRouter()


@router.get("/config")
def get_config(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data = {
        "itemTypes": get_config_value(db, "ITEM_TYPES"),
        "unit": get_config_value(db, "UNIT"),
        "lowStockThreshold": get_config_value(db, "LOW_STOCK_THRESHOLD"),
        "expiryWarningDays": get_config_value(db, "EXPIRY_WARNING_DAYS"),
        "expiry": get_config_value(db, "EXPIRY"),
    }
    return {"success": True, "data": data}
