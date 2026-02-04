# -*- coding: utf-8 -*-
import re
from fastapi import APIRouter, Depends, HTTPException

from app.core.auth import get_current_user
from app.models.user import User
from app.schemas.user import PasscodeUpdate, AdminUserCreate, AdminUserUpdate
from app.database import get_db
from sqlalchemy.orm import Session

router = APIRouter()

_STATUS_VALUES = frozenset(("正常", "冻结", "删除", "已注册"))

# 超级用户：用户名为 admin 或 李丽君
_ADMIN_NAMES = frozenset(("admin", "李丽君"))


def require_admin(current_user: User) -> None:
    if current_user.name not in _ADMIN_NAMES:
        raise HTTPException(status_code=403, detail="仅管理员可操作")


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


@router.get("/admin/list")
def admin_list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_admin(current_user)
    users = db.query(User).order_by(User.id).all()
    return {
        "success": True,
        "data": {
            "items": [
                {
                    "id": u.id,
                    "name": u.name or "",
                    "phone": u.phone or "",
                    "status": u.status or "正常",
                }
                for u in users
            ]
        },
    }


@router.post("/admin")
def admin_create_user(
    data: AdminUserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_admin(current_user)
    if data.status not in _STATUS_VALUES:
        raise HTTPException(status_code=400, detail=f"状态必须为: {', '.join(_STATUS_VALUES)}")
    if not re.match(r"^1[3-9]\d{9}$", data.phone):
        raise HTTPException(status_code=400, detail="手机号格式错误")
    existing = db.query(User).filter(User.phone == data.phone).first()
    if existing:
        raise HTTPException(status_code=400, detail="该手机号已存在")
    user = User(name=data.name, phone=data.phone, status=data.status)
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"success": True, "data": {"id": user.id}}


@router.put("/admin/{user_id}")
def admin_update_user(
    user_id: int,
    data: AdminUserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_admin(current_user)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    if data.status is not None and data.status not in _STATUS_VALUES:
        raise HTTPException(status_code=400, detail=f"状态必须为: {', '.join(_STATUS_VALUES)}")
    if data.name is not None:
        user.name = data.name
    if data.phone is not None:
        if not re.match(r"^1[3-9]\d{9}$", data.phone):
            raise HTTPException(status_code=400, detail="手机号格式错误")
        other = db.query(User).filter(User.phone == data.phone, User.id != user_id).first()
        if other:
            raise HTTPException(status_code=400, detail="该手机号已被其他用户使用")
        user.phone = data.phone
    if data.status is not None:
        user.status = data.status
    db.commit()
    return {"success": True}
