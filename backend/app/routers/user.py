import re
from fastapi import APIRouter, Depends

from app.core.auth import get_current_user
from app.models.user import User
from app.schemas.user import UserInfoUpdate
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


@router.put("/info")
def update_user_info(
    data: UserInfoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 已注册用户不允许修改手机号
    if current_user.status == "已注册" and data.phone is not None:
        if data.phone != current_user.phone:
            return {"success": False, "message": "已注册用户不允许修改手机号"}
    if data.phone is not None:
        if data.phone and not re.match(r"^1[3-9]\d{9}$", data.phone):
            return {"success": False, "message": "手机号格式错误"}
    if data.name is not None:
        current_user.name = data.name
    if data.phone is not None and current_user.status != "已注册":
        current_user.phone = data.phone
    db.commit()
    return {"success": True}
