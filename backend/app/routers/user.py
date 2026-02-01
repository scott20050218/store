from fastapi import APIRouter, Depends

from app.core.auth import get_current_user
from app.models.user import User
from app.schemas.user import PasscodeUpdate
from app.database import get_db
from sqlalchemy.orm import Session

router = APIRouter()


@router.get("/info")
def get_user_info(
    current_user: User = Depends(get_current_user),
):
    return {
        "success": True,
        "data": {"name": current_user.name or "", "phone": current_user.phone or ""},
    }


@router.put("/passcode")
def update_passcode(
    data: PasscodeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current_user.passcode = data.passcode
    db.commit()
    return {"success": True}
