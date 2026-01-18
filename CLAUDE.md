# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pixcore 是一个 AI 电影分镜与多模态生成平台，面向独立创作者的专业分镜创作工具（单机单用户 MVP）。支持电影分镜编排、多模态生成（文生图、文生视频、图生视频）、版本对比筛选、资产一致性锁定，以及本地存储与项目导入导出。

## 技术栈

**前端**: React 19 + TypeScript + Tauri 2.0 + Vite + Zustand + React Query + Radix UI + Tailwind CSS

**后端**: FastAPI + Python 3.11 + SQLAlchemy + SQLite + Dramatiq + Alembic

## 常用开发命令

### 后端开发

```bash
cd backend

# 安装依赖
uv sync

# 运行数据库迁移
uv run alembic upgrade head

# 创建数据库迁移
uv run alembic revision --autogenerate -m "描述"

# 启动开发服务器
uv run uvicorn app.main:app --reload

# 运行测试
uv run pytest

# 代码格式化和 lint
uv run black .
uv run ruff check .
```

API 文档访问: http://localhost:8000/docs

### 前端开发

```bash
cd frontend

# 安装依赖（必须使用 pnpm，Node 版本 24.10.0）
pnpm install

# 启动 Web 开发服务器
pnpm dev

# 启动 Tauri 桌面应用开发模式
pnpm tauri:dev

# 运行测试
pnpm test
pnpm test:ui
pnpm test:coverage

# Lint 和格式化
pnpm lint
pnpm lint:fix
pnpm format

# 构建
pnpm build              # Web 构建
pnpm tauri:build        # Tauri 应用构建
```

## 核心架构

### 数据模型层次结构

系统采用四层数据结构：

1. **Project（项目）**: 顶层容器，包含全局配置（分辨率、FPS、默认模型）和一致性锁定开关（lock_character, lock_style, lock_world, lock_key_object）
2. **Scene（场景）**: 镜头的逻辑分组
3. **Shot（镜头）**: 单个分镜，包含电影分镜字段（shot_type, camera_move, duration, composition, lens）、提示词、资产引用（asset_refs）
4. **Version（版本）**: 每个镜头的 AI 生成结果（图片/视频），支持版本栈和主版本标记（is_primary）

### 资产系统

**Asset（资产）**: 跨镜头复用的元素，分为四类：
- character（角色）
- scene（场景）
- style（风格）
- key_object（核心物品）

**删除保护机制**: 删除资产前必须检查 `Shot.asset_refs` 字段。如果存在引用，只能标记 `is_archived=True`（软删除），不能物理删除。

### 任务队列系统

使用 Dramatiq 处理异步 AI 生成任务：
1. 前端提交生成请求，后端返回 task_id
2. 任务入队并通过 WebSocket 推送实时进度
3. 完成后自动创建 Version 记录
4. 前端更新版本栈展示

### 本地存储方案

- 数据库: SQLite（嵌入式，无需用户安装）
- 媒体文件: 本地文件系统（默认 `~/PixcoreStorage`）
- 视频缩略图: 前端 Canvas 截图后上传（避免后端集成 ffmpeg）
- API Key: 加密存储在 Settings 表或 OS Keychain

## 重要约定

### 数据格式严格对齐

前端 Mock 数据和接口定义**必须严格参照** `backend/app/schemas/` 中的 Pydantic 模型。关键字段：

- **Project**: `lock_character`, `lock_style`, `lock_world`, `lock_key_object`
- **Shot**: `asset_refs` (JSON 数组，包含 asset_id 与快照信息)
- **Asset**: `is_archived` (软删除标记)
- **Version**: `is_primary` (主版本标记)

### 目录结构约定

**前端**:
- `src/app/`: 应用入口、路由、全局 Provider
- `src/features/`: 按业务模块划分（projects, storyboard, assets, settings, generation）
- `src/components/ui/`: 基于 Radix UI 的通用 UI 组件
- `src/lib/`: 工具库（api-client, tauri, utils）
- `src/types/`: TypeScript 类型定义

**后端**:
- `app/api/`: RESTful 路由层
- `app/models/`: SQLAlchemy ORM 模型
- `app/schemas/`: Pydantic 请求/响应模型
- `app/services/`: 业务逻辑层（含资产引用检查、Token 估算）
- `app/tasks/`: Dramatiq 后台任务
- `alembic/`: 数据库迁移

### 状态管理策略

- **全局状态**: Zustand（项目、分镜、资产）
- **服务端状态**: React Query（API 同步与缓存）
- **本地状态**: React Hooks (useState/useReducer)

### UI 规范

- 图标库: `lucide-react`
- 尺寸规范:
  - 默认/正文/按钮: `w-4 h-4` (16px)
  - 导航/顶部栏/输入框: `w-5 h-5` (20px)
  - 大型展示/空状态: `w-6 h-6` (24px) 或更大

## 安全与权限

1. **API Key 管理**: 生产环境不存 `.env`，使用 OS Keychain 或加密 SQLite 字段
2. **Tauri 权限**: macOS 下读写 `~/PixcoreStorage` 可能受限，需引导用户授权或选择非沙盒目录
3. **密钥注入**: 前端不持有 Key，请求时后端从安全存储读取并注入

## 国际化

- 使用 i18next + react-i18next
- 支持中英文切换
- 默认语言: 中文
- **全部用中文回复用户**

## 参考文档

- `development_doc.md`: 详细的系统设计、状态机、API 设计、任务拆分
- `requirements_prototype.md`: 产品需求与 UI/UX 目标
- `GEMINI.md`: Gemini AI 的项目背景文档
