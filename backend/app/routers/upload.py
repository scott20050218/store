import uuid
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, UploadFile, File

from app.config import settings
from app.core.auth import get_current_user
from app.models.user import User

router = APIRouter()

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}


@router.post("/upload/image")
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        return {"success": False, "message": "不支持的图片格式"}
    date_dir = datetime.now().strftime("%Y%m%d")
    dir_path = Path(settings.upload_dir) / date_dir
    dir_path.mkdir(parents=True, exist_ok=True)
    ext = suffix or ".jpg"
    filename = f"{uuid.uuid4().hex}{ext}"
    file_path = dir_path / filename
    content = await file.read()
    file_path.write_bytes(content)
    url = f"/uploads/{date_dir}/{filename}"
    return {"success": True, "data": {"url": url}}
