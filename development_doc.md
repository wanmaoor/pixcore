# 开发文档（系统设计 / 数据结构 / 任务拆分）

> 本文档用于研发实现，不与需求/原型混合。内容包含系统架构、数据结构、状态机、接口草案、任务拆分与风险。
> **修订记录**：基于需求评审，增加了 API Key 管理、资产删除保护、前端抽帧等实现细节。

---

## 1. 系统架构

### 1.1 架构概览
- 前端：Web SPA（工作台、分镜表、资产管理）
- 桌面端：Tauri（负责应用壳、更新、进程管理、**密钥存储**）
- 后端：API 服务（业务逻辑 + 任务编排）
- 任务系统：本地队列（Dramatiq，文生图/文生视频/图生视频）
- 存储：
  - 元数据存储（轻量：SQLite）
  - 媒体存储（图片/视频/缩略图，存用户本机）

### 1.1.1 前端技术栈（React）

**核心框架**
- React 18 + TypeScript
- 构建工具：Vite（快速开发 + Tauri 官方推荐）
- 包管理：pnpm（节省磁盘空间，适合桌面应用）

**状态管理**
- Zustand：全局状态（项目/分镜/资产）
- React Query (TanStack Query)：服务端状态同步与缓存
- 本地状态：React Hooks (useState/useReducer)

**路由**
- React Router v6

**UI 基础**
- Radix UI：无样式基础组件（Dialog/Dropdown/Tabs 等）
- Tailwind CSS：工具类样式，完全可控 Apple 风格
- 图标：Lucide React（简洁现代）

**核心功能库**
- 拖拽：@dnd-kit/core + @dnd-kit/sortable（分镜排序）
- 表格：TanStack Table（电影分镜表视图）
- 视频播放：video.js 或 react-player
- Canvas 操作：fabric.js（遮罩绘制）
- 虚拟滚动：@tanstack/react-virtual（大量分镜性能优化）
- 动画：framer-motion（平滑过渡）

**工具库**
- 日期处理：date-fns
- 表单：react-hook-form + zod（验证）
- 工具函数：lodash-es（按需引入）
- 国际化：i18next + react-i18next（中英文切换，默认中文）

**开发工具**
- ESLint + Prettier
- Husky（Git Hooks）
- TypeScript strict mode

### 1.2 后端技术栈（FastAPI）

**核心框架**
- FastAPI 0.104+：现代异步 Web 框架
- Uvicorn：ASGI 服务器
- Pydantic 2.x：数据验证与序列化

**数据库**
- SQLAlchemy 2.x：ORM
- Alembic：数据库迁移
- aiosqlite：SQLite 异步驱动（可选）

**任务队列**
- Dramatiq：轻量任务队列
- StubBroker/RedisBroker：本地内存或 Redis broker

**文件处理**
- Pillow：图片处理（缩略图）
- aiofiles：异步文件操作

**工具库**
- python-dotenv：环境变量
- loguru：优雅日志
- cryptography：API Key 加密
- httpx：HTTP 客户端（调用 AI 服务）

**开发工具**
- black：代码格式化
- ruff：极速 linter
- mypy：类型检查
- pytest + pytest-asyncio：测试

**核心优势**
- 类型安全：Pydantic 自动校验
- 异步支持：高并发任务处理
- 自动文档：Swagger UI 开箱即用
- WebSocket：实时推送生成进度

### 1.3 模块划分
- 项目服务：项目管理
- 分镜服务：Scene/Shot 管理与电影分镜字段
- 资产服务：角色/场景/风格/核心物品（**含引用检查**）
- 生成服务：任务创建与状态回调（**含 Token 估算**）
- 版本服务：版本栈、对比、主版本
- **设置服务**：API Key 管理、存储路径配置

### 1.2.1 轻量化存储方案（现阶段）
- 数据库：SQLite（内嵌，无需用户安装）
- ORM：SQLAlchemy + Alembic（迁移支持）
- 队列：Dramatiq + StubBroker（内存）或 RedisBroker（可选）

### 1.4 任务流
1) 前端提交生成请求（附带 API Key，由后端解密或代理）
2) 后端入队并返回 task_id
3) 任务完成回调，生成版本记录
4) 前端通过 WebSocket 实时接收进度更新
5) 前端更新版本栈

### 1.5 本地存储形态（方案 A）
- 部署形态：后端与存储都运行在用户电脑
- 媒体落盘：本机文件系统目录
- **路径权限**：启动时校验读写权限，macOS 下需引导用户授权或选择非沙盒目录

**配置项**
- `STORAGE_ROOT`：媒体根目录（默认 `~/PixcoreStorage`）
- `THUMB_SIZE`：缩略图尺寸
- `MAX_VERSIONS_PER_SHOT`：默认保留版本数

### 1.6 视频关键帧提取策略（MVP）
- **方案**：**前端 Canvas 截图**
- 流程：
  1. 视频生成成功，返回 URL
  2. 前端 `<video>` 加载，`loadeddata` 事件触发后使用 `canvas.drawImage` 截取首帧
  3. 前端将截图 Blob 上传回后端保存为 `thumb.jpg`
- 优势：无需后端集成 `ffmpeg`，减小打包体积

---

## 2. 数据结构（数据库模型）

### 2.1 Project
- id (PK)
- name
- type (story/animation/short)
- resolution (w,h)
- fps
- default_model
- default_params (JSON)
- default_negative_prompt
- lock_character (bool)
- lock_style (bool)
- lock_world (bool)
- lock_key_object (bool)
- created_at / updated_at

### 2.2 Scene
- id (PK)
- project_id (FK)
- name
- order
- created_at / updated_at

### 2.3 Shot
- id (PK)
- scene_id (FK)
- order
- shot_type
- camera_move
- duration
- composition
- lens
- story_desc
- visual_desc
- prompt
- negative_prompt
- asset_refs (JSON) -- **注意：需包含 asset_id 与快照信息**
- status (enum)
- created_at / updated_at

### 2.4 Version
- id (PK)
- shot_id (FK)
- type (image/video)
- url
- thumb_url
- params (JSON)
- created_at
- is_primary (bool)

### 2.5 Asset
- id (PK)
- project_id (FK)
- type (character/scene/style/key_object)
- name
- description
- reference_images (JSON)
- meta (JSON)
- created_at / updated_at
- **is_archived** (bool) -- **新增：软删除标记**

### 2.6 Settings (新增，KV 存储或独立表)
- key (PK)
- value (加密存储)
- **用于存储 Provider API Keys**

---

## 3. 状态机
- 生成任务：queued → running → success / failed
- 资产状态：active → archived (软删除)

---

## 4. API 设计（RESTful）

### 4.1 路由结构

#### 项目管理
- `GET /api/projects` - 获取项目列表
- `POST /api/projects` - 创建项目
- `GET /api/projects/{id}` - 获取项目详情
- `PUT /api/projects/{id}` - 更新项目
- `DELETE /api/projects/{id}` - 删除项目
- `POST /api/projects/{id}/export` - 导出项目
- `POST /api/projects/import` - 导入项目

#### Scene 管理
- `GET /api/projects/{pid}/scenes` - 获取场景列表
- `POST /api/projects/{pid}/scenes` - 创建场景
- `PUT /api/scenes/{id}` - 更新场景
- `DELETE /api/scenes/{id}` - 删除场景
- `PUT /api/scenes/{id}/reorder` - 拖拽排序

#### Shot 管理
- `GET /api/scenes/{sid}/shots` - 获取分镜列表
- `POST /api/scenes/{sid}/shots` - 创建分镜
- `PUT /api/shots/{id}` - 更新分镜
- `DELETE /api/shots/{id}` - 删除分镜
- `PUT /api/shots/batch-reorder` - 批量排序

#### 版本管理
- `GET /api/shots/{id}/versions` - 获取版本列表
- `POST /api/shots/{id}/versions/{vid}/set-primary` - 设置主版本
- `DELETE /api/versions/{id}` - 删除版本

#### 资产管理
- `GET /api/projects/{pid}/assets` - 获取资产列表
- `POST /api/projects/{pid}/assets` - 创建资产
- `PUT /api/assets/{id}` - 更新资产
- `DELETE /api/assets/{id}` - 删除资产（带引用检查）
- `GET /api/assets/{id}/references` - 查询引用关系

#### 生成任务
- `POST /api/generation/text-to-image` - 文生图
- `POST /api/generation/text-to-video` - 文生视频
- `POST /api/generation/image-to-video` - 图生视频
- `GET /api/generation/tasks/{id}` - 查询任务状态
- `POST /api/generation/tasks/{id}/cancel` - 取消任务
- `WS /ws/tasks/{id}` - WebSocket 实时进度推送

#### 设置
- `GET /api/settings` - 读取配置
- `PUT /api/settings/api-keys` - 更新 API Key
- `PUT /api/settings/storage-path` - 更新存储路径

#### 媒体文件
- `GET /api/media/{path}` - 静态文件服务
- `POST /api/media/upload-thumbnail` - 上传视频缩略图

### 4.2 请求/响应模型示例（Pydantic）

```python
# 请求模型
class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    type: Literal["story", "animation", "short"] = "story"
    resolution: tuple[int, int] = (1920, 1080)
    fps: int = Field(default=24, ge=1, le=60)

class ShotCreate(BaseModel):
    scene_id: int
    prompt: str
    negative_prompt: Optional[str] = None
    asset_refs: list[dict] = []

# 响应模型
class ShotResponse(BaseModel):
    id: int
    scene_id: int
    order: int
    prompt: str
    status: Literal["pending", "generating", "completed", "failed"]
    created_at: datetime

    class Config:
        from_attributes = True
```

### 4.3 资产删除逻辑
- `DELETE /assets/{id}` 逻辑：
  1. 查询 `Shot.asset_refs` 是否包含该 asset_id
  2. 若无引用：物理删除
  3. 若有引用：标记 `is_archived=True`，返回提示信息
  4. 前端列表隐藏归档资产，但历史分镜仍可显示

---

## 5. 关键实现细节（最佳实践补充）

### 5.1 密钥管理 (Security)
- **存储**：API Key 不存 `.env`（开发环境除外），生产环境存入 OS Keychain 或加密 SQLite 字段。
- **使用**：前端不持有 Key，请求时后端从安全存储读取注入请求。

### 5.2 费用与耗时预估
- **策略**：后端维护一份静态 `ModelConfig` 表，包含各模型预计耗时与 Token/Credit 消耗倍率。
- **展示**：生成前显示 “预计耗时 15s | 消耗 ~2 Credits”。

### 5.3 资产删除保护
- 删除 Asset 前，先查询 `Shot` 表中 `asset_refs` 是否包含该 ID。
- 存在引用则提示用户：“该资产主要用于 N 个镜头，只能归档不能删除。”

### 5.4 UI 规范
- **图标库**: `lucide-react`
- **尺寸规范**:
  - 默认/正文/按钮: `w-4 h-4` (16px)
  - 导航/顶部栏/输入框: `w-5 h-5` (20px)
  - 大型展示/空状态: `w-6 h-6` (24px) 或更大

---

## 6. 任务拆分（研发执行清单）

### 6.1 前端

#### 6.1.1 目录结构建议
```
src/
├── app/                    # 应用入口
│   ├── App.tsx
│   ├── router.tsx         # 路由配置
│   └── providers.tsx      # 全局 Provider（React Query、Zustand）
├── features/              # 功能模块（按业务划分）
│   ├── projects/          # 项目管理
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── stores/        # Zustand store
│   │   └── api.ts         # React Query hooks
│   ├── storyboard/        # 分镜工作台
│   │   ├── components/
│   │   │   ├── ShotList.tsx
│   │   │   ├── PreviewArea.tsx
│   │   │   ├── EditPanel.tsx
│   │   │   └── VersionStack.tsx
│   │   ├── hooks/
│   │   └── stores/
│   ├── assets/            # 资产管理
│   ├── generation/        # 生成任务
│   └── settings/          # 设置
├── components/            # 通用组件
│   ├── ui/               # UI 基础组件（基于 Radix）
│   ├── VideoPlayer/
│   ├── DraggableList/
│   └── CanvasEditor/     # 遮罩绘制
├── lib/                   # 工具库
│   ├── api-client.ts     # API 请求封装
│   ├── tauri.ts          # Tauri API 封装
│   └── utils.ts
├── types/                 # TypeScript 类型定义
└── styles/               # 全局样式
```

#### 6.1.2 核心任务清单

**基础设施**
- [ ] Tauri + Vite + React 项目初始化
- [ ] TypeScript 配置（strict mode）
- [ ] Tailwind CSS + Radix UI 配置
- [ ] React Router 路由配置
- [ ] Zustand store 架构设计
- [ ] React Query 配置（API client、错误处理）
- [ ] Tauri IPC 通信封装
- [ ] i18n 国际化配置（支持中英文切换，默认中文）

**页面与功能模块**
- [ ] 项目总览页（Project Hub）
  - [ ] 项目卡片列表
  - [ ] 新建项目弹窗（react-hook-form + zod）
  - [ ] 项目搜索与筛选

- [ ] 分镜工作台（Storyboard Workspace）
  - [ ] 三栏布局（分镜列表 + 预览 + 编辑）
  - [ ] Scene/Shot 拖拽排序（dnd-kit）
  - [ ] 分镜列表虚拟滚动（@tanstack/react-virtual）
  - [ ] 版本栈水平滚动展示
  - [ ] 版本对比视图（2/3/4 格）
  - [ ] 视频播放器（逐帧控制）
  - [ ] 提示词编辑器（支持变量）
  - [ ] 资产引用标签化

- [ ] 电影分镜表视图
  - [ ] TanStack Table 表格
  - [ ] 单元格内联编辑
  - [ ] 批量操作

- [ ] 资产管理页
  - [ ] 资产卡片流
  - [ ] 资产类型切换（Tab）
  - [ ] 资产详情面板
  - [ ] 删除保护提示

- [ ] 设置页
  - [ ] API Key 配置（安全存储）
  - [ ] 存储路径设置
  - [ ] 模型配置

**核心组件**
- [ ] **视频抽帧组件**：Canvas 截图逻辑
- [ ] 遮罩绘制编辑器（fabric.js）
- [ ] 拖拽排序列表（dnd-kit）
- [ ] 版本对比网格
- [ ] 生成进度指示器
- [ ] 费用预估提示

**状态管理**
- [ ] 项目 store（当前项目、配置）
- [ ] 分镜 store（Scene/Shot、选中状态）
- [ ] 资产 store（资产列表、引用关系）
- [ ] 生成任务 store（队列、进度）
- [ ] React Query mutations（CRUD 操作）

**Tauri 集成**
- [ ] 文件系统权限处理
- [ ] 媒体文件路径管理
- [ ] Keychain 集成（API Key）
- [ ] 应用更新机制

### 6.2 后端

#### 6.2.1 目录结构
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI 应用入口
│   ├── config.py            # 配置管理
│   ├── database.py          # SQLAlchemy 配置
│   ├── dependencies.py      # FastAPI 依赖注入
│   ├── api/                 # 路由层
│   │   ├── __init__.py
│   │   ├── projects.py      # 项目路由
│   │   ├── scenes.py        # 场景路由
│   │   ├── shots.py         # 分镜路由
│   │   ├── assets.py        # 资产路由
│   │   ├── versions.py      # 版本路由
│   │   ├── generation.py    # 生成任务路由
│   │   └── settings.py      # 设置路由
│   ├── models/              # SQLAlchemy 模型
│   │   ├── __init__.py
│   │   ├── project.py
│   │   ├── scene.py
│   │   ├── shot.py
│   │   ├── asset.py
│   │   ├── version.py
│   │   └── settings.py
│   ├── schemas/             # Pydantic 模型
│   │   ├── __init__.py
│   │   ├── project.py
│   │   ├── scene.py
│   │   ├── shot.py
│   │   ├── asset.py
│   │   ├── version.py
│   │   └── generation.py
│   ├── services/            # 业务逻辑层
│   │   ├── __init__.py
│   │   ├── project_service.py
│   │   ├── asset_service.py   # 含引用检查逻辑
│   │   ├── generation_service.py  # Token 估算
│   │   └── storage_service.py
│   ├── tasks/               # Dramatiq 任务
│   │   ├── __init__.py
│   │   └── generation_tasks.py
│   └── utils/
│       ├── __init__.py
│       ├── crypto.py        # API Key 加密
│       └── validators.py
├── alembic/                 # 数据库迁移
│   ├── versions/
│   └── env.py
├── tests/
│   ├── test_api/
│   ├── test_services/
│   └── conftest.py
├── pyproject.toml           # uv 项目配置
├── uv.lock
├── .env.example
└── README.md
```

#### 6.2.2 核心任务清单

**基础设施**
- [ ] uv 项目初始化（pyproject.toml）
- [ ] FastAPI + Uvicorn 配置
- [ ] SQLAlchemy + Alembic 配置
- [ ] Dramatiq 任务队列配置
- [ ] 日志系统（loguru）
- [ ] 全局异常处理
- [ ] CORS 配置（允许 Tauri 前端）

**数据库模型**
- [ ] Project 模型（含一致性锁定字段）
- [ ] Scene 模型
- [ ] Shot 模型（含 asset_refs JSON 字段）
- [ ] Asset 模型（含 is_archived 字段）
- [ ] Version 模型（含 is_primary 字段）
- [ ] Settings 模型（KV 存储）
- [ ] Alembic 初始迁移

**API 接口**
- [ ] 项目管理接口（CRUD + 导入导出）
- [ ] Scene/Shot 管理接口（含排序）
- [ ] 资产管理接口（含删除保护逻辑）
- [ ] 版本管理接口（主版本切换）
- [ ] 生成任务接口（文生图/文生视频/图生视频）
- [ ] WebSocket 进度推送
- [ ] 设置接口（API Key 加密存储）
- [ ] 媒体文件服务（静态文件 + 缩略图上传）

**业务逻辑**
- [ ] 资产引用检查服务
- [ ] Token/费用估算服务
- [ ] 文件存储服务（路径管理、缩略图生成）
- [ ] API Key 加密/解密服务
- [ ] 版本自动清理服务（保留 N 个版本）

**任务系统**
- [ ] 文生图任务（Dramatiq actor）
- [ ] 文生视频任务
- [ ] 图生视频任务
- [ ] 任务状态回调
- [ ] 任务失败重试逻辑

**测试**
- [ ] pytest 配置
- [ ] API 端点测试
- [ ] 服务层单元测试
- [ ] 资产删除保护测试
- [ ] 任务队列集成测试

### 6.3 任务系统
- 队列管理、任务回调、失败重试

---

## 7. 风险与注意事项
- **Tauri 权限**：macOS 下读写 `~/PixcoreStorage` 可能受阻，需做权限引导。
- **API Key**：用户未配置 Key 时生成任务直接报错，需引导跳转设置页。
