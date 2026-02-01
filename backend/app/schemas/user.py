from pydantic import BaseModel, Field
from typing import Optional


class UserInfoUpdate(BaseModel):
    name: Optional[str] = Field(default=None, description="姓名")
    phone: Optional[str] = Field(default=None, description="11位手机号")
