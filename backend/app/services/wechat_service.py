"""微信小程序服务：code2session、getPhoneNumber"""
import time
import httpx

from app.config import settings

WECHAT_BASE = "https://api.weixin.qq.com"
WECHAT_CODE2SESSION = f"{WECHAT_BASE}/sns/jscode2session"
WECHAT_TOKEN = f"{WECHAT_BASE}/cgi-bin/token"
WECHAT_GET_PHONE = f"{WECHAT_BASE}/wxa/business/getuserphonenumber"

# access_token 缓存（有效期 7200 秒，提前 5 分钟刷新）
_token_cache: tuple[str, float] | None = None


def _get_access_token() -> tuple[str | None, str | None]:
    """获取 access_token（用于调用 getPhoneNumber 等接口）"""
    global _token_cache
    if not settings.wechat_appid or not settings.wechat_secret:
        return None, "未配置 WECHAT_APPID 或 WECHAT_SECRET"
    now = time.time()
    if _token_cache and _token_cache[1] > now:
        return _token_cache[0], None
    params = {
        "grant_type": "client_credential",
        "appid": settings.wechat_appid,
        "secret": settings.wechat_secret,
    }
    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.get(WECHAT_TOKEN, params=params)
            data = resp.json()
    except Exception as e:
        return None, str(e)
    errcode = data.get("errcode")
    if errcode:
        return None, data.get("errmsg", "获取 access_token 失败")
    token = data.get("access_token")
    expires = data.get("expires_in", 7200) - 300  # 提前 5 分钟刷新
    _token_cache = (token, now + expires)
    return token, None


def getPhoneNumber(code: str) -> tuple[str | None, str | None]:
    """
    小程序端 getPhoneNumber 授权后，服务端用 code 换取手机号
    Returns: (phoneNumber, error_message)
    """
    access_token, err = _get_access_token()
    if err or not access_token:
        return None, err or "获取 access_token 失败"
    url = f"{WECHAT_GET_PHONE}?access_token={access_token}"
    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.post(url, json={"code": code})
            data = resp.json()
    except Exception as e:
        return None, str(e)
    errcode = data.get("errcode", 0)
    if errcode != 0:
        return None, data.get("errmsg", "获取手机号失败")
    phone_info = data.get("phone_info") or {}
    # purePhoneNumber 为 11 位国内手机号
    phone = phone_info.get("purePhoneNumber") or phone_info.get("phoneNumber", "").replace(" ", "")
    return phone or None, None


def code2session(code: str) -> tuple[str | None, str | None]:
    """
    用 wx.login 获得的 code 换取 openid
    Returns: (openid, error_message)
    """
    if not settings.wechat_appid or not settings.wechat_secret:
        return None, "未配置 WECHAT_APPID 或 WECHAT_SECRET"
    params = {
        "appid": settings.wechat_appid,
        "secret": settings.wechat_secret,
        "js_code": code,
        "grant_type": "authorization_code",
    }
    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.get(WECHAT_CODE2SESSION, params=params)
            data = resp.json()
    except Exception as e:
        return None, str(e)
    errcode = data.get("errcode", 0)
    if errcode != 0:
        return None, data.get("errmsg", "code 无效或已过期")
    return data.get("openid"), None
