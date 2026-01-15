# Pixcore Backend

AI 电影分镜与多模态生成平台的后端服务。

## 技术栈

- FastAPI 0.104+
- SQLAlchemy 2.x
- SQLite
- Dramatiq
- Python 3.11+

## 开发环境设置

### 1. 安装依赖

```bash
uv sync
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，设置必要的配置
```

### 3. 运行数据库迁移

```bash
uv run alembic upgrade head
```

### 4. 启动开发服务器

```bash
uv run uvicorn app.main:app --reload
```

访问 http://localhost:8000/docs 查看 API 文档。

## 项目结构

```
backend/
├── app/
│   ├── api/          # API 路由
│   ├── models/       # SQLAlchemy 模型
│   ├── schemas/      # Pydantic 模型
│   ├── services/     # 业务逻辑
│   ├── tasks/        # Dramatiq 任务
│   └── utils/        # 工具函数
├── alembic/          # 数据库迁移
└── tests/            # 测试
```

## 运行测试

```bash
uv run pytest
```

## 代码格式化

```bash
uv run black .
uv run ruff check .
```
