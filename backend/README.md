# 仓库管理后端 API

基于 Python FastAPI + MySQL/SQLite 的仓库管理后端服务，配合微信小程序使用。

## 技术栈

- Python 3.10+
- FastAPI
- SQLAlchemy 2.0
- MySQL 8.x / SQLite
- JWT 认证（1 小时有效期）

## 快速开始

### 1. 安装依赖

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env`：

| 变量 | 说明 |
|------|------|
| `DATABASE_URL` | MySQL: `mysql+pymysql://user:password@localhost:3306/store` 或 SQLite: `sqlite:///./store.db` |
| `JWT_SECRET` | JWT 密钥 |
| `JWT_ALGORITHM` | 默认 HS256 |
| `UPLOAD_DIR` | 图片存储目录，默认 uploads |

### 3. 数据库迁移

```bash
# MySQL 需先创建数据库
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS store;"

# 执行迁移
alembic upgrade head
```

### 4. 初始化数据

```bash
python scripts/init_data.py
```

在 `scripts/init_data.py` 中可修改预初始化用户列表（name、phone、status=正常）及 config 默认值。

### 5. 启动服务

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- API 文档：http://localhost:8000/docs
- 健康检查：http://localhost:8000/health

---

## 认证流程

1. **注册** `POST /api/auth/register`  
   请求体：`{ "phone": "13800138001", "openid": "xxx", "passcode": "密码" }`  
   条件：phone 在预初始化用户表中且 status=正常，成功后保存 openid、passcode，status 置为已注册。

2. **获取 token** `POST /api/auth/token`  
   请求体：`{ "openid": "xxx", "passcode": "密码" }`  
   条件：openid 与 passcode 与 users 表中一致且 status=已注册。返回 token 和 config，token 有效期 1 小时。

3. **业务接口** 需在请求头携带 `Authorization: Bearer <token>`。

---

## API 接口

| 分类 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 认证 | POST | /api/auth/register | 注册 |
| 认证 | POST | /api/auth/token | 获取 token |
| 库存 | POST | /api/inbound | 入库 |
| 库存 | POST | /api/outbound | 出库（FIFO） |
| 库存 | GET | /api/inventory/stats | 库存统计 |
| 库存 | GET | /api/inventory/overview | 物品总览 |
| 库存 | GET | /api/inventory/outbound-list | 出库列表 |
| 库存 | GET | /api/inventory/statistics-list | 统计列表 |
| 用户 | GET | /api/user/info | 获取用户信息 |
| 用户 | PUT | /api/user/info | 更新用户信息 |
| 配置 | GET | /api/config | 获取配置 |
| 上传 | POST | /api/upload/image | 上传图片 |

详细请求体与响应格式见 `docs/openapi.json` 或 Swagger UI。

---

## 目录结构

```
backend/
├── app/
│   ├── main.py           # FastAPI 入口
│   ├── config.py         # 配置
│   ├── database.py       # 数据库连接
│   ├── models/           # SQLAlchemy 模型
│   ├── schemas/          # Pydantic 请求/响应模型
│   ├── routers/          # API 路由
│   ├── services/         # 业务逻辑
│   └── core/             # 认证等核心
├── docs/
│   ├── openapi.json      # OpenAPI 规范
│   └── index.html        # Redoc 文档
├── migrations/           # Alembic 迁移
├── scripts/
│   ├── init_data.py      # 初始化用户和配置
│   ├── recreate_tables.py # 重建缺失表
│   └── generate_openapi.py # 生成 API 文档
├── uploads/              # 图片存储
├── requirements.txt
├── .env.example
└── README.md
```

---

## 脚本说明

| 脚本 | 说明 |
|------|------|
| `python scripts/init_data.py` | 预初始化 users、config |
| `python scripts/recreate_tables.py` | 重建缺失表（如 users 被删除后） |
| `python scripts/generate_openapi.py` | 导出 OpenAPI 到 docs/ |

---

## 常见问题

**users 表被删除**  
执行 `python scripts/recreate_tables.py` 重建。或 `alembic downgrade base` 再 `alembic upgrade head` 完全重建。

**MySQL 报错 Access denied**  
检查 `.env` 中 `DATABASE_URL` 用户名密码，或改用 `DATABASE_URL=sqlite:///./store.db`。

**API 文档离线查看**  
执行 `python scripts/generate_openapi.py`，在浏览器打开 `docs/index.html`。
