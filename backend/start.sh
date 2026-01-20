#!/bin/bash

# 遇到错误立即退出
set -e

echo "🚀 正在启动 Pixcore 后端项目..."

# 1. 安装/同步依赖
echo "📦 正在检查并安装依赖 (uv sync)..."
uv sync

# 2. 配置 .env 文件
if [ ! -f .env ]; then
    echo "⚙️ 未检测到 .env 文件，正在从 .env.example 复制..."
    cp .env.example .env
else
    echo "✅ .env 文件已存在"
fi

# 3. 运行数据库迁移
echo "🗄️ 正在运行数据库迁移..."
uv run alembic upgrade head

# 4. 启动开发服务器
echo "🔥 正在启动开发服务器..."
echo "👉 API 文档访问地址: http://localhost:8000/docs"
uv run uvicorn app.main:app --reload
