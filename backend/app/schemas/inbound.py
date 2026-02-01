from pydantic import BaseModel, Field
from typing import Optional


class InboundRequest(BaseModel):
    itemType: str = Field(..., description="物品类型")
    quantity: int = Field(..., gt=0, description="数量")
    expiryDate: str = Field(..., description="过期日期 YYYY-MM-DD")
    inboundDate: str = Field(..., description="入库日期 YYYY-MM-DD")
    productionDate: Optional[str] = Field(default="", description="生产日期")
    tag: Optional[str] = Field(default="", description="标签颜色 hex")
    location: Optional[str] = Field(default="", description="位置")
    photo: Optional[str] = Field(default="", description="图片 URL")
