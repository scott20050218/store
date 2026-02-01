from pydantic import BaseModel, Field


class PasscodeUpdate(BaseModel):
    passcode: str = Field(..., min_length=1, description="新密码")
