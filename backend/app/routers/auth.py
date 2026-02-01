import secrets

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.core.auth import create_access_token
from app.services.config_service import get_auth_config

router = APIRouter()


class RegisterRequest(BaseModel):
    phone: str
    openid: str
    passcode: str


class TokenRequest(BaseModel):
    openid: str
    passcode: str


@router.post("/register")
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.phone == data.phone).first()
    if user is None:
        raise HTTPException(status_code=401, detail="手机号未在系统中登记")
    if user.status != "正常":
        raise HTTPException(status_code=401, detail="该账号不可注册")
    user.openid = data.openid
    user.passcode = data.passcode
    user.status = "已注册"
    db.commit()
    db.refresh(user)
    token = create_access_token(user.id)
    config = get_auth_config(db)
    return {
        "success": True,
        "data": {"token": token, "config": config},
    }


@router.post("/token")
def get_token(data: TokenRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.openid == data.openid).first()
    if user is None:
        raise HTTPException(status_code=401, detail="未找到用户")
    if user.status != "已注册":
        raise HTTPException(status_code=401, detail="账号状态异常")
    if not user.passcode or not secrets.compare_digest(user.passcode, data.passcode):
        raise HTTPException(status_code=401, detail="passcode 不正确")
    token = create_access_token(user.id)
    config = get_auth_config(db)
    return {
        "success": True,
        "data": {"token": token, "config": config},
    }
