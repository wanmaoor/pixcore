# Pixcore - AI 电影分镜与多模态生成平台

面向独立创作者的专业 AI 电影分镜创作平台（单机单用户 MVP）。

## 项目简介

Pixcore 是一个一站式的 AI 电影分镜创作平台，支持：
- 电影分镜编排与管理
- 多模态生成（文生图、文生视频、图生视频）
- 版本对比与筛选
- 资产一致性锁定
- 本地存储与项目导入导出

## 技术栈

### 前端
- React 19 + TypeScript
- Tauri 2.0（桌面应用）
- Vite
- Zustand + React Query
- Radix UI + Tailwind CSS
- Vitest + React Testing Library

### 后端
- FastAPI + Python 3.11
- SQLAlchemy + SQLite
- Dramatiq（任务队列）
- Alembic（数据库迁移）

## 快速开始

### 前置要求

- Python 3.11+
- uv（Python 包管理器）
- Node.js 18+
- pnpm
- Rust（Tauri 需要）

### 后端启动

```bash
cd backend

# 安装依赖
uv sync

# 运行数据库迁移
uv run alembic upgrade head

# 启动开发服务器
uv run uvicorn app.main:app --reload
```

访问 http://localhost:8000/docs 查看 API 文档。

### 前端启动

```bash
cd frontend

# 安装依赖
pnpm install

# 启动 Web 开发服务器
pnpm dev

# 或启动 Tauri 桌面应用
pnpm tauri:dev
```

## 项目结构

```
pixcore/
├── backend/              # FastAPI 后端
│   ├── app/
│   │   ├── api/         # API 路由
│   │   ├── models/      # 数据库模型
│   │   ├── schemas/     # Pydantic 模型
│   │   ├── services/    # 业务逻辑
│   │   └── tasks/       # 后台任务
│   ├── alembic/         # 数据库迁移
│   └── tests/           # 测试
│
├── frontend/            # React + Tauri 前端
│   ├── src/
│   │   ├── app/         # 应用入口
│   │   ├── features/    # 功能模块
│   │   ├── components/  # 通用组件
│   │   ├── lib/         # 工具库
│   │   └── types/       # 类型定义
│   └── src-tauri/       # Tauri 配置
│
├── development_doc.md       # 开发文档
├── development_tasks.md     # 任务清单
└── requirements_prototype.md # 需求文档
```

## 开发指南

### 后端开发

```bash
# 运行测试
uv run pytest

# 代码格式化
uv run black .

# Lint
uv run ruff check .

# 创建数据库迁移
uv run alembic revision --autogenerate -m "描述"

# 执行迁移
uv run alembic upgrade head
```

### 前端开发

```bash
# 运行测试
pnpm test

# Lint
pnpm lint

# 格式化
pnpm format

# 构建
pnpm build
```

## 文档

- [需求与原型文档](./requirements_prototype.md)
- [开发文档](./development_doc.md)
- [任务清单](./development_tasks.md)
- [后端 README](./backend/README.md)
- [前端 README](./frontend/README.md)

## License

MIT
