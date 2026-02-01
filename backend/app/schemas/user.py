from pydantic import BaseModel, Field
from typing import Optional


class PasscodeUpdate(BaseModel):
    passcode: str = Field(..., min_length=1, description="新密码")


class AdminUserCreate(BaseModel):
    name: str = Field(..., min_length=1, description="姓名")
    phone: str = Field(..., min_length=11, max_length=11, description="11位手机号")
    status: str = Field(default="正常", description="状态：正常/冻结/删除")


class AdminUserUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, description="姓名")
    phone: Optional[str] = Field(default=None, min_length=11, max_length=11, description="11位手机号")
    status: Optional[str] = Field(default=None, description="状态：正常/冻结/删除/已注册")
