from pydantic import BaseModel, Field


class OutboundRequest(BaseModel):
    id: str | None = Field(None, description="物品记录ID")
    itemType: str = Field(..., description="物品类型")
    quantity: int = Field(..., gt=0, description="出库数量")
    outboundDate: str = Field(..., description="出库日期 YYYY-MM-DD")
