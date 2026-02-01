import secrets

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db


def get_client_ip(request: Request) -> str | None:
    """从请求中取客户端 IP（兼容代理 X-Forwarded-For / X-Real-IP）"""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.headers.get("x-real-ip"):
        return request.headers.get("x-real-ip")
    if request.client:
        return request.client.host
    return None
from app.models.user import User
from app.models.login_history import LoginHistory
from app.models.register_history import RegisterHistory
from app.core.auth import create_access_token
from app.services.config_service import get_auth_config
from app.services.wechat_service import code2session

router = APIRouter()


class RegisterRequest(BaseModel):
    phone: str
    openid: str
    passcode: str


class RegisterWithCodeRequest(BaseModel):
    """小程序注册：wx.login 的 code + 手机号 + 密码，后端用 code 换 openid"""
    phone: str
    code: str
    passcode: str


class TokenRequest(BaseModel):
    openid: str
    passcode: str


class TokenWithCodeRequest(BaseModel):
    """小程序登录：每次使用 wx.login 获得 code + 密码，后端用 code 换 openid 再发 token"""
    code: str
    passcode: str


@router.post("/register")
def register(data: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    ip = get_client_ip(request)
    user = db.query(User).filter(User.phone == data.phone).first()
    if user is None:
        db.add(RegisterHistory(openid=data.openid, ip=ip, phone=data.phone, success=False, user_id=None))
        db.commit()
        raise HTTPException(status_code=401, detail="手机号未在系统中登记")
    if user.status != "正常":
        db.add(RegisterHistory(openid=data.openid, ip=ip, phone=data.phone, success=False, user_id=None))
        db.commit()
        raise HTTPException(status_code=401, detail="该账号不可注册")
    user.openid = data.openid
    user.passcode = data.passcode
    user.status = "已注册"
    db.commit()
    db.refresh(user)
    db.add(RegisterHistory(openid=data.openid, ip=ip, phone=data.phone, success=True, user_id=user.id))
    db.commit()
    token = create_access_token(user.id)
    config = get_auth_config(db)
    return {
        "success": True,
        "data": {"token": token, "config": config},
    }


@router.post("/register/wechat")
def register_with_code(data: RegisterWithCodeRequest, request: Request, db: Session = Depends(get_db)):
    """小程序注册：必须先用 wx.login 获得 code，与手机号、密码一并提交"""
    ip = get_client_ip(request)
    openid, err = code2session(data.code)
    if err or not openid:
        db.add(RegisterHistory(openid=None, ip=ip, phone=data.phone, success=False, user_id=None))
        db.commit()
        raise HTTPException(status_code=400, detail=err or "code 无效或已过期")
    # 已用本微信注册过的用户，提示勿重复注册
    already = db.query(User).filter(User.openid == openid, User.status == "已注册").first()
    if already:
        db.add(RegisterHistory(openid=openid, ip=ip, phone=data.phone, success=False, user_id=already.id))
        db.commit()
        raise HTTPException(status_code=400, detail="已经注册成功了，请不要重复注册")
    user = db.query(User).filter(User.phone == data.phone).first()
    if user is None:
        db.add(RegisterHistory(openid=openid, ip=ip, phone=data.phone, success=False, user_id=None))
        db.commit()
        raise HTTPException(status_code=401, detail="手机号未在系统中登记")
    if user.status != "正常":
        db.add(RegisterHistory(openid=openid, ip=ip, phone=data.phone, success=False, user_id=None))
        db.commit()
        raise HTTPException(status_code=401, detail="该账号不可注册")
    user.openid = openid
    user.passcode = data.passcode
    user.status = "已注册"
    db.commit()
    db.refresh(user)
    db.add(RegisterHistory(openid=openid, ip=ip, phone=data.phone, success=True, user_id=user.id))
    db.commit()
    token = create_access_token(user.id)
    config = get_auth_config(db)
    return {
        "success": True,
        "data": {"token": token, "config": config},
    }


@router.post("/token")
def get_token(data: TokenRequest, request: Request, db: Session = Depends(get_db)):
    ip = get_client_ip(request)
    user = db.query(User).filter(User.openid == data.openid).first()
    if user is None:
        db.add(LoginHistory(openid=data.openid, ip=ip, user_id=None, success=False))
        db.commit()
        raise HTTPException(status_code=401, detail="未找到用户")
    if user.status != "已注册":
        db.add(LoginHistory(openid=data.openid, ip=ip, user_id=user.id, success=False))
        db.commit()
        raise HTTPException(status_code=401, detail="账号状态异常")
    if not user.passcode or not secrets.compare_digest(user.passcode, data.passcode):
        db.add(LoginHistory(openid=data.openid, ip=ip, user_id=user.id, success=False))
        db.commit()
        raise HTTPException(status_code=401, detail="passcode 不正确")
    db.add(LoginHistory(openid=data.openid, ip=ip, user_id=user.id, success=True))
    db.commit()
    token = create_access_token(user.id)
    config = get_auth_config(db)
    return {
        "success": True,
        "data": {"token": token, "config": config},
    }


@router.post("/token/wechat")
def get_token_with_code(data: TokenWithCodeRequest, request: Request, db: Session = Depends(get_db)):
    """小程序登录：每次使用时通过 wx.login 获得 code，与密码一并提交"""
    ip = get_client_ip(request)
    openid, err = code2session(data.code)
    if err or not openid:
        db.add(LoginHistory(openid=openid, ip=ip, user_id=None, success=False))
        db.commit()
        raise HTTPException(status_code=400, detail=err or "code 无效或已过期")
    user = db.query(User).filter(User.openid == openid).first()
    if user is None:
        db.add(LoginHistory(openid=openid, ip=ip, user_id=None, success=False))
        db.commit()
        raise HTTPException(status_code=401, detail="未找到用户，请先注册")
    if user.status != "已注册":
        db.add(LoginHistory(openid=openid, ip=ip, user_id=user.id, success=False))
        db.commit()
        raise HTTPException(status_code=401, detail="账号状态异常")
    if not user.passcode or not secrets.compare_digest(user.passcode, data.passcode):
        db.add(LoginHistory(openid=openid, ip=ip, user_id=user.id, success=False))
        db.commit()
        raise HTTPException(status_code=401, detail="密码不正确")
    db.add(LoginHistory(openid=openid, ip=ip, user_id=user.id, success=True))
    db.commit()
    token = create_access_token(user.id)
    config = get_auth_config(db)
    return {
        "success": True,
        "data": {"token": token, "config": config},
    }
