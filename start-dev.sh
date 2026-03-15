#!/bin/bash

# AI协作平台 - 快速启动脚本
# 用于启动开发环境的PostgreSQL和Redis服务

set -e

echo "🚀 AI协作平台 - 开发环境启动"
echo "================================"

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ 错误: Docker未安装"
    echo "请先安装Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

# 检查Docker Compose是否安装
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ 错误: Docker Compose未安装"
    echo "请先安装Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker环境检查通过"

# 启动PostgreSQL和Redis
echo ""
echo "📦 启动PostgreSQL和Redis服务..."
docker-compose -f docker-compose.dev.yml up -d postgres redis

# 等待服务就绪
echo ""
echo "⏳ 等待服务启动..."
sleep 5

# 检查PostgreSQL健康状态
echo ""
echo "🔍 检查PostgreSQL状态..."
if docker exec ai-collab-postgres pg_isready -U aicollab &> /dev/null; then
    echo "✅ PostgreSQL已就绪"
else
    echo "⚠️  PostgreSQL可能还未完全启动，请稍候..."
fi

# 检查Redis健康状态
echo ""
echo "🔍 检查Redis状态..."
if docker exec ai-collab-redis redis-cli ping | grep -q "PONG"; then
    echo "✅ Redis已就绪"
else
    echo "⚠️  Redis可能还未完全启动，请稍候..."
fi

# 创建.env文件（如果不存在）
if [ ! -f "apps/server/.env" ]; then
    echo ""
    echo "📝 创建.env配置文件..."
    cp apps/server/.env.example apps/server/.env
    echo "✅ .env文件已创建"
fi

# 运行数据库迁移
echo ""
echo "📊 运行数据库迁移..."
cd apps/server
if pnpm prisma migrate deploy; then
    echo "✅ 数据库迁移完成"
else
    echo "⚠️  数据库迁移失败，请检查配置"
    echo "提示: 确保PostgreSQL已启动且.env配置正确"
fi

# 返回项目根目录
cd ../..

# 显示服务信息
echo ""
echo "================================"
echo "✅ 开发环境已启动!"
echo ""
echo "📍 服务地址:"
echo "   PostgreSQL: localhost:5432"
echo "   Redis:      localhost:6379"
echo "   API:        http://localhost:3000 (运行 pnpm dev 后)"
echo ""
echo "📊 查看服务状态:"
echo "   docker-compose -f docker-compose.dev.yml ps"
echo ""
echo "🛑 停止服务:"
echo "   docker-compose -f docker-compose.dev.yml down"
echo ""
echo "📝 查看日志:"
echo "   docker-compose -f docker-compose.dev.yml logs -f"
echo ""
echo "🚀 启动API服务:"
echo "   cd apps/server && pnpm dev"
echo "================================"
