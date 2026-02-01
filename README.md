# 仓库管理系统

基于 Python FastAPI 后端 + 微信小程序的仓库管理系统，支持入库、出库、库存统计、用户管理等功能。

## 项目结构

```
store/
├── backend/          # Python FastAPI 后端
│   ├── app/          # 应用代码
│   ├── migrations/   # Alembic 数据库迁移
│   ├── scripts/      # 初始化与工具脚本
│   └── docs/         # API 文档
├── management/       # 微信小程序前端
│   ├── pages/        # 页面
│   ├── components/   # 组件
│   └── utils/        # 工具函数
└── README.md
```

## 技术栈

| 模块 | 技术 |
|------|------|
| 后端 | Python 3.10+, FastAPI, SQLAlchemy 2.0, MySQL/SQLite, JWT |
| 前端 | 微信小程序 (WXML, WXSS, JS) |
| 认证 | 微信 wx.login + 自定义 passcode，Token 有效期 1 小时 |

## 功能概览

- **登录/注册**：微信授权手机号 + passcode
- **入库**：按物品类型、数量、到期日等入库
- **出库**：FIFO 出库
- **统计**：按时间范围查看出入库统计，可点击查看明细
- **我的**：个人信息、修改密码、我的入库/出库记录
- **管理用户**：admin 用户可新增、编辑用户及状态（正常/冻结/删除/已注册）

---

## 快速开始

### 1. 后端

```bash
cd backend

# 虚拟环境
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# 配置
cp .env.example .env
# 编辑 .env 设置 DATABASE_URL、JWT_SECRET、WECHAT_APPID、WECHAT_SECRET

# 数据库（MySQL）
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS store CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
alembic upgrade head
python scripts/init_data.py

# 启动
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- API 文档：http://localhost:8000/docs  
- 健康检查：http://localhost:8000/health  

### 2. 小程序

1. 使用 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html) 打开 `management` 目录  
2. 在 `utils/api.js` 中配置 `BASE_URL`（本地开发可用 `http://localhost:8000`）  
3. 本地开发时，在开发者工具「详情」→「本地设置」中勾选「不校验合法域名」  
4. 真机/正式环境需在小程序后台配置服务器域名，并确保 `BASE_URL` 为 https  

---

## 环境变量 (backend/.env)

| 变量 | 说明 |
|------|------|
| `DATABASE_URL` | `mysql+pymysql://user:password@host:3306/store` 或 `sqlite:///./store.db` |
| `JWT_SECRET` | JWT 密钥 |
| `JWT_ALGORITHM` | 默认 HS256 |
| `UPLOAD_DIR` | 图片存储目录，默认 uploads |
| `WECHAT_APPID` | 小程序 AppID |
| `WECHAT_SECRET` | 小程序 AppSecret |

---

## API 接口概览

| 分类 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 认证 | POST | /api/auth/register | 注册（openid） |
| 认证 | POST | /api/auth/register/wechat | 注册（微信 code） |
| 认证 | POST | /api/auth/token | 获取 token |
| 认证 | POST | /api/auth/token/wechat | 获取 token（微信 code） |
| 微信 | POST | /api/wechat/get-phone-number | 通过 code 获取手机号 |
| 库存 | POST | /api/inbound | 入库 |
| 库存 | POST | /api/outbound | 出库（FIFO） |
| 库存 | GET | /api/inventory/overview | 物品总览 |
| 库存 | GET | /api/inventory/outbound-list | 出库列表 |
| 库存 | GET | /api/inventory/io-stats | 出入库统计（按时间范围） |
| 库存 | GET | /api/inventory/io-details | 出入库明细 |
| 库存 | GET | /api/inventory/my-inbound | 我的入库（分页） |
| 库存 | GET | /api/inventory/my-outbound | 我的出库（分页） |
| 用户 | GET | /api/user/info | 获取用户信息 |
| 用户 | PUT | /api/user/passcode | 修改密码 |
| 用户 | GET | /api/user/admin/list | 管理用户列表（admin） |
| 用户 | POST | /api/user/admin | 新增用户（admin） |
| 用户 | PUT | /api/user/admin/{id} | 修改用户（admin） |
| 配置 | GET | /api/config | 获取配置 |
| 上传 | POST | /api/upload/image | 上传图片 |

详细接口见 `backend/docs/openapi.json` 或 Swagger UI `/docs`。

---

## 认证流程

1. 用户通过微信 `wx.login` 获取 `code`  
2. 注册：`POST /api/auth/register/wechat` 传入 `phone`、`code`、`passcode`  
   - 条件：手机号在预初始化用户表中且 status=正常  
   - 成功后 status 变为「已注册」  
3. 登录：`POST /api/auth/token/wechat` 传入 `code`、`passcode`  
   - 条件：openid 与 passcode 匹配且 status=已注册  
4. 业务接口需携带 `Authorization: Bearer <token>`  

---

## 脚本说明 (backend/scripts)

| 脚本 | 说明 |
|------|------|
| `python scripts/init_data.py` | 预初始化 users、config（含 admin 用户） |
| `python scripts/recreate_tables.py` | 重建缺失表 |
| `python scripts/generate_openapi.py` | 导出 OpenAPI 到 docs/ |

---

## 常见问题

**MySQL 报错 Access denied**  
检查 `.env` 中 `DATABASE_URL` 用户名密码，或改用 `DATABASE_URL=sqlite:///./store.db`。

**小程序 request 合法域名校验出错**  
本地开发勾选「不校验合法域名」；正式环境在小程序后台配置服务器域名。

**admin 管理用户不可见**  
需以 name 为 `admin` 的用户登录，且该用户已在 `init_data.py` 中预初始化（phone: 13800000000）。
