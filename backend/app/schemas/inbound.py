from pydantic import BaseModel, Field
from typing import Optional


class InboundRequest(BaseModel):
    itemType: str = Field(..., description="物品类型")
    unit: Optional[str] = Field(default="", description="单位")
    quantity: int = Field(..., gt=0, description="数量")
    expiryDate: str = Field(..., description="过期日期 YYYY-MM-DD")
    inboundDate: str = Field(..., description="入库日期 YYYY-MM-DD")
    productionDate: Optional[str] = Field(default="", description="生产日期")
    expiryWarningDays: Optional[int] = Field(default=None, description="到期前提醒天数，为空则该记录不参与告警")
    tag: Optional[str] = Field(default="", description="标签颜色 hex")
    location: Optional[str] = Field(default="", description="位置")
    photo: Optional[str] = Field(default="", description="图片 URL")
