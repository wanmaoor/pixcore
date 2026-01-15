# Pixcore Frontend

AI 电影分镜与多模态生成平台的前端应用（Tauri + React）。

## 技术栈

- **框架**: React 19 + TypeScript
- **桌面应用**: Tauri 2.0
- **构建工具**: Vite
- **路由**: React Router v7
- **状态管理**: Zustand + React Query
- **UI 库**: Radix UI + Tailwind CSS
- **图标**: Lucide React
- **拖拽**: @dnd-kit
- **表格**: TanStack Table
- **测试**: Vitest + React Testing Library + MSW

## 开发环境设置

### 前置要求

- Node.js >= 18
- pnpm
- Rust（Tauri 需要）

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
# 仅 Web 开发
pnpm dev

# Tauri 桌面应用开发
pnpm tauri:dev
```

### 运行测试

```bash
# 运行测试
pnpm test

# 测试 UI
pnpm test:ui

# 测试覆盖率
pnpm test:coverage
```

### 代码质量

```bash
# Lint
pnpm lint

# 自动修复
pnpm lint:fix

# 格式化
pnpm format
```

### 构建

```bash
# Web 构建
pnpm build

# Tauri 应用构建
pnpm tauri:build
```

## 项目结构

```
src/
├── app/              # 应用入口和全局配置
│   ├── App.tsx
│   └── Providers.tsx
├── features/         # 功能模块（按业务划分）
│   ├── projects/
│   ├── storyboard/
│   ├── assets/
│   └── settings/
├── components/       # 通用组件
│   └── ui/          # UI 基础组件
├── lib/             # 工具库
│   ├── api-client.ts
│   └── utils.ts
├── types/           # TypeScript 类型定义
├── styles/          # 全局样式
└── test/            # 测试配置
```

## 开发规范

- 使用 TypeScript strict 模式
- 遵循 ESLint 规则
- 使用 Prettier 格式化代码
- 组件使用函数式组件 + Hooks
- 状态管理：全局状态用 Zustand，服务端状态用 React Query

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
