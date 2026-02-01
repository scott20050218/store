from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.config import settings
from app.routers import auth, inbound, outbound, inventory, user, config, upload, wechat

# Create uploads directory
Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)

app = FastAPI(
    title="仓库管理 API",
    version="1.0.0",
    description="仓库管理后端接口，包含认证、入库、出库、库存查询、用户信息、配置、图片上传等。业务接口需携带 `Authorization: Bearer <token>`。",
)

# Mount static files for uploaded images
app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(inbound.router, prefix="/api", tags=["inbound"])
app.include_router(outbound.router, prefix="/api", tags=["outbound"])
app.include_router(inventory.router, prefix="/api/inventory", tags=["inventory"])
app.include_router(user.router, prefix="/api/user", tags=["user"])
app.include_router(config.router, prefix="/api", tags=["config"])
app.include_router(upload.router, prefix="/api", tags=["upload"])
app.include_router(wechat.router, prefix="/api/wechat", tags=["wechat"])


@app.get("/health")
def health():
    return {"status": "ok"}
