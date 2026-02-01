// api.js - 小程序通过后端 API 通信，数据不保存在本地
//
// 合法域名说明（否则会报「request 合法域名校验出错」、注册/登录失败）：
// 1. 本地开发：在微信开发者工具「详情」→「本地设置」→ 勾选「不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书」，即可请求 localhost。
// 2. 真机/正式：此处改为已在小程序后台「开发管理」→「开发设置」→「服务器域名」中配置的 https 域名（如 https://你的后端域名.com），并确保后端已部署到该域名。
// const BASE_URL = 'http://localhost:8000'
const BASE_URL = "https://hw.lihengrui.cn";
const TOKEN_KEY = "token";

function getToken() {
  return wx.getStorageSync(TOKEN_KEY) || "";
}

function setToken(token) {
  wx.setStorageSync(TOKEN_KEY, token);
}

function clearToken() {
  wx.removeStorageSync(TOKEN_KEY);
}

function request(options) {
  const { method = "GET", path, data } = options;
  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;
  const token = getToken();

  return new Promise((resolve, reject) => {
    wx.request({
      url,
      method,
      data,
      header: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      success(res) {
        if (res.statusCode === 401) {
          clearToken();
          reject(new Error("未登录或登录已过期"));
          return;
        }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data || { success: true });
        } else {
          const msg =
            (res.data && res.data.detail) ||
            res.data?.message ||
            `请求失败 ${res.statusCode}`;
          reject(
            new Error(typeof msg === "string" ? msg : JSON.stringify(msg))
          );
        }
      },
      fail(err) {
        reject(err || new Error("网络请求失败"));
      },
    });
  });
}

// 配置
function getConfig() {
  return request({ method: "GET", path: "/api/config" }).then(
    (res) => res.data || {}
  );
}

// 获取手机号（小程序 getPhoneNumber 授权后的 code）
function getPhoneNumber(code) {
  return request({
    method: "POST",
    path: "/api/wechat/get-phone-number",
    data: { code },
  }).then((res) => {
    if (res.success && res.data && res.data.phone) {
      return res.data.phone;
    }
    return Promise.reject(new Error(res.message || "获取手机号失败"));
  });
}

// 注册（使用 wx.login 的 code）
function registerWithCode(phone, code, passcode) {
  return request({
    method: "POST",
    path: "/api/auth/register/wechat",
    data: { phone, code, passcode },
  }).then((res) => {
    if (res.success && res.data && res.data.token) {
      setToken(res.data.token);
      return res.data;
    }
    return Promise.reject(new Error(res.message || "注册失败"));
  });
}

// 登录（每次使用 wx.login 获得 code）
function loginWithCode(code, passcode) {
  return request({
    method: "POST",
    path: "/api/auth/token/wechat",
    data: { code, passcode },
  }).then((res) => {
    if (res.success && res.data && res.data.token) {
      setToken(res.data.token);
      return res.data;
    }
    return Promise.reject(new Error(res.message || "登录失败"));
  });
}

// 入库
function postInbound(body) {
  return request({ method: "POST", path: "/api/inbound", data: body });
}

// 出库
function postOutbound(body) {
  return request({ method: "POST", path: "/api/outbound", data: body });
}

// 物品总览
function getInventoryOverview() {
  return request({ method: "GET", path: "/api/inventory/overview" }).then(
    (res) => (res.success && res.data && res.data.items ? res.data.items : [])
  );
}

// 出库列表
function getOutboundList() {
  return request({ method: "GET", path: "/api/inventory/outbound-list" }).then(
    (res) => (res.success && res.data && res.data.items ? res.data.items : [])
  );
}

// 出入库统计（按时间范围）
function getInventoryIOStats(startDate, endDate) {
  return request({
    method: "GET",
    path: "/api/inventory/io-stats",
    data: { startDate, endDate },
  }).then((res) =>
    res.success && res.data && res.data.items ? res.data.items : []
  );
}

// 出入库明细（按物品、时间范围）。detailType: inbound|outbound|both
function getInventoryIODetails(itemType, startDate, endDate, detailType) {
  return request({
    method: "GET",
    path: "/api/inventory/io-details",
    data: { itemType, startDate, endDate, type: detailType || "both" },
  }).then((res) =>
    res.success && res.data && res.data.items ? res.data.items : []
  );
}

// 用户信息
function getUserInfo() {
  return request({ method: "GET", path: "/api/user/info" }).then((res) =>
    res.success && res.data ? res.data : { name: "", phone: "" }
  );
}

function putPasscode(passcode) {
  return request({
    method: "PUT",
    path: "/api/user/passcode",
    data: { passcode },
  });
}

// 管理员：用户列表
function getAdminUserList() {
  return request({ method: "GET", path: "/api/user/admin/list" }).then((res) =>
    res.success && res.data && res.data.items ? res.data.items : []
  );
}

// 管理员：新增用户
function postAdminUser(body) {
  return request({ method: "POST", path: "/api/user/admin", data: body });
}

// 管理员：修改用户
function putAdminUser(userId, body) {
  return request({
    method: "PUT",
    path: `/api/user/admin/${userId}`,
    data: body,
  });
}

function getMyInbound(page, limit) {
  return request({
    method: "GET",
    path: "/api/inventory/my-inbound",
    data: { page: page || 1, limit: limit || 5 },
  }).then((res) =>
    res.success && res.data
      ? { items: res.data.items || [], hasMore: res.data.hasMore || false }
      : { items: [], hasMore: false }
  );
}

function getMyOutbound(page, limit) {
  return request({
    method: "GET",
    path: "/api/inventory/my-outbound",
    data: { page: page || 1, limit: limit || 5 },
  }).then((res) =>
    res.success && res.data
      ? { items: res.data.items || [], hasMore: res.data.hasMore || false }
      : { items: [], hasMore: false }
  );
}

// 上传图片
function uploadImage(filePath) {
  const token = getToken();
  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: `${BASE_URL}/api/upload/image`,
      filePath,
      name: "file",
      header: token ? { Authorization: `Bearer ${token}` } : {},
      success(res) {
        if (res.statusCode === 401) {
          clearToken();
          reject(new Error("未登录或登录已过期"));
          return;
        }
        let data;
        try {
          data = typeof res.data === "string" ? JSON.parse(res.data) : res.data;
        } catch (_) {
          reject(new Error("响应解析失败"));
          return;
        }
        if (data.success && data.data && data.data.url) {
          resolve(data.data.url);
        } else {
          reject(new Error(data.message || "上传失败"));
        }
      },
      fail(err) {
        reject(err || new Error("上传失败"));
      },
    });
  });
}

module.exports = {
  BASE_URL,
  getToken,
  setToken,
  clearToken,
  request,
  getConfig,
  getPhoneNumber,
  registerWithCode,
  loginWithCode,
  postInbound,
  postOutbound,
  getInventoryOverview,
  getOutboundList,
  getInventoryIOStats,
  getInventoryIODetails,
  getUserInfo,
  putPasscode,
  getAdminUserList,
  postAdminUser,
  putAdminUser,
  getMyInbound,
  getMyOutbound,
  uploadImage,
};
