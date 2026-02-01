"""微信小程序相关接口（无需 token）"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.wechat_service import getPhoneNumber

router = APIRouter()


class GetPhoneRequest(BaseModel):
    code: str  # 小程序 getPhoneNumber 回调中的 code


@router.post("/get-phone-number")
def get_phone_number(data: GetPhoneRequest):
    """小程序端 getPhoneNumber 授权后，用 code 换取手机号，用于注册时默认填入"""
    phone, err = getPhoneNumber(data.code)
    if err or not phone:
        raise HTTPException(status_code=400, detail=err or "获取手机号失败")
    return {"success": True, "data": {"phone": phone}}
