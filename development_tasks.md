# Pixcore MVP 开发任务清单（可执行）

> 目标：单机单用户 MVP，覆盖分镜管理、多模态生成、版本管理、资产一致性锁定、本地存储与导入导出。
> **修订**：包含 API Key 设置、资产软删除、前端视频抽帧任务。

---

## 0. 项目准备

### 0.1 仓库与环境
- [ ] 初始化前后端与桌面端工程结构
  - [ ] 前端：Tauri + Vite + React + TypeScript（pnpm）
  - [ ] 后端：FastAPI + uv 项目初始化
  - [ ] 配置 monorepo 结构（前后端独立目录）
- [ ] 前端代码规范
  - [ ] ESLint + Prettier 配置
  - [ ] Husky Git Hooks
  - [ ] TypeScript strict mode
- [ ] 后端代码规范
  - [ ] black + ruff 配置
  - [ ] mypy 类型检查
- [ ] 测试框架
  - [ ] 前端：Vitest + React Testing Library + MSW
  - [ ] 后端：pytest + pytest-asyncio
- [ ] 建立 `.gitignore` 规则
- [ ] **开发环境** `.env` 机制（生产环境使用设置模块）

**验收**
- 前端本地启动显示基础页面
- 后端 API 服务可启动（返回 Hello World）
- Tauri 可构建运行
- 测试命令可执行

### 0.2 基础配置与常量
- [ ] 配置 `STORAGE_ROOT` 等常量
- [ ] 定义模型消耗估算表（Time/Credit）

---

## 1. 数据层与存储

### 1.1 SQLite 数据库模型
- [ ] 定义表结构（含 `is_archived` 字段，`Settings` 表）
- [ ] 初始化 Alembic 迁移

**验收**
- 迁移可执行，包含 Asset 软删除字段

### 1.2 本地文件存储
- [ ] 路径生成与原子落盘
- [ ] **权限检查**：Tauri 启动时检查读写权限

---

## 2. 后端 API（FastAPI + uv）

### 2.1 基础设施
- [ ] uv 项目初始化（pyproject.toml）
- [ ] FastAPI 应用入口（main.py）
- [ ] Uvicorn 配置
- [ ] SQLAlchemy + Alembic 配置
- [ ] Dramatiq 任务队列配置（StubBroker）
- [ ] 日志系统（loguru）
- [ ] 全局异常处理
- [ ] CORS 配置（允许 Tauri 前端）

**验收**
- `uv run uvicorn app.main:app --reload` 可启动
- Swagger UI 可访问（http://localhost:8000/docs）

### 2.2 数据库模型与迁移
- [ ] SQLAlchemy 模型定义
  - [ ] Project 模型（含一致性锁定字段）
  - [ ] Scene 模型
  - [ ] Shot 模型（含 asset_refs JSON 字段）
  - [ ] Asset 模型（含 is_archived 字段）
  - [ ] Version 模型（含 is_primary 字段）
  - [ ] Settings 模型（KV 存储）
- [ ] Alembic 初始迁移
- [ ] 数据库种子数据（开发用）

**验收**
- `alembic upgrade head` 成功执行
- 包含 Asset 软删除字段、Settings 表

### 2.3 API 接口开发
- [ ] 设置接口
  - [ ] `GET/PUT /api/settings` - API Key 与存储路径
  - [ ] API Key 加密存储实现
- [ ] 项目管理接口
  - [ ] `GET/POST /api/projects`
  - [ ] `GET/PUT/DELETE /api/projects/{id}`
  - [ ] `POST /api/projects/{id}/export`
  - [ ] `POST /api/projects/import`
- [ ] Scene/Shot 管理接口
  - [ ] Scene CRUD
  - [ ] Shot CRUD
  - [ ] 拖拽排序接口
- [ ] 资产管理接口
  - [ ] Asset CRUD
  - [ ] 删除保护逻辑（引用检查）
  - [ ] `GET /api/assets/{id}/references`
- [ ] 版本管理接口
  - [ ] 版本列表
  - [ ] 设置主版本
  - [ ] 版本删除
- [ ] 生成任务接口
  - [ ] `POST /api/generation/text-to-image`
  - [ ] `POST /api/generation/text-to-video`
  - [ ] `POST /api/generation/image-to-video`
  - [ ] `GET /api/generation/tasks/{id}`
  - [ ] WebSocket 进度推送
- [ ] 媒体文件服务
  - [ ] 静态文件服务
  - [ ] 缩略图上传接口

**验收**
- 所有接口在 Swagger UI 可测试
- 能保存和读取 API Key（加密存储）
- 删除被引用资产时自动转为归档

### 2.4 业务逻辑层
- [ ] 资产引用检查服务
- [ ] Token/费用估算服务
- [ ] 文件存储服务（路径管理、缩略图生成）
- [ ] API Key 加密/解密服务
- [ ] 版本自动清理服务（保留 N 个版本）

### 2.5 任务系统
- [ ] Dramatiq actors
  - [ ] 文生图任务
  - [ ] 文生视频任务
  - [ ] 图生视频任务
- [ ] 任务状态回调
- [ ] 任务失败重试逻辑
- [ ] 前端视频抽帧上传接收

**验收**
- 生成视频后，版本列表能正确显示首帧缩略图

### 2.6 测试
- [ ] pytest 配置
- [ ] API 端点测试
- [ ] 服务层单元测试
- [ ] 资产删除保护测试
- [ ] 任务队列集成测试

---

## 3. 任务系统与生成

### 3.1 任务调度
- [ ] 任务入队（注入 API Key）
- [ ] 状态查询与回调

### 3.2 视频处理（MVP）
- [ ] **前端实现**：视频加载后 Canvas 抽帧并上传 Cover
- [ ] 后端接收 Cover 并保存

**验收**
- 生成视频后，版本列表能正确显示首帧缩略图

---

## 4. 前端 UI

### 4.1 全局与设置
- [ ] **首次启动引导**：设置存储路径与 API Key
- [ ] 设置页面实现

### 4.2 核心工作流
- [ ] 项目工作台（三栏布局）
- [ ] 分镜表视图（表格编辑）
- [ ] 资产库页面（支持归档状态显示）

---

## 5. 打包与发布
- [ ] Tauri 打包配置（macOS/Windows）
- [ ] 验证安装包权限与签名

---

## 6. 测试与验收
- [ ] **关键路径测试**：未配 Key 提示 -> 配 Key -> 生成 -> 视频抽帧 -> 资产引用 -> 删除资产保留引用
