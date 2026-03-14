#!/bin/bash
# 系统状态检查脚本

echo "🔍 AI协作平台 - 系统状态检查"
echo "================================"
echo ""

# 检查后端
echo "📡 检查后端API..."
BACKEND_RESPONSE=$(curl -s http://localhost:3000/api/v1 2>&1)
if echo "$BACKEND_RESPONSE" | grep -q "Welcome"; then
  echo "   ✅ 后端运行正常"
  echo "   📍 URL: http://localhost:3000/api/v1"
else
  echo "   ❌ 后端未运行"
  echo "   💡 启动命令: cd apps/server && node dist/main.js"
fi

echo ""

# 检查前端
echo "🌐 检查前端应用..."
FRONTEND_PORT=$(lsof -ti:3001 2>/dev/null || lsof -ti:3002 2>/dev/null || lsof -ti:3003 2>/dev/null)
if [ ! -z "$FRONTEND_PORT" ]; then
  echo "   ✅ 前端运行正常 (端口: $FRONTEND_PORT)"
  echo "   📍 URL: http://localhost:$FRONTEND_PORT"
else
  echo "   ❌ 前端未运行"
  echo "   💡 启动命令: cd apps/web && pnpm dev"
fi

echo ""

# 检查数据库
echo "💾 检查数据库..."
DB_FILE="$HOME/clawd/projects/ai-collab-hub/apps/server/prisma/dev.db"
if [ -f "$DB_FILE" ]; then
  DB_SIZE=$(ls -lh "$DB_FILE" | awk '{print $5}')
  echo "   ✅ 数据库正常"
  echo "   📍 文件: $DB_FILE"
  echo "   📊 大小: $DB_SIZE"
else
  echo "   ❌ 数据库不存在"
  echo "   💡 初始化命令: cd apps/server && pnpm prisma migrate dev"
fi

echo ""

# 检查编译状态
echo "🔧 检查编译状态..."
cd ~/clawd/projects/ai-collab-hub/apps/server
JS_COUNT=$(find dist -name "*.js" 2>/dev/null | wc -l | tr -d ' ')
if [ "$JS_COUNT" -gt 0 ]; then
  echo "   ✅ 后端已编译"
  echo "   📁 JS文件数: $JS_COUNT"
else
  echo "   ❌ 后端未编译"
  echo "   💡 编译命令: cd apps/server && pnpm build"
fi

echo ""

# 检查依赖
echo "📦 检查依赖..."
cd ~/clawd/projects/ai-collab-hub
if [ -d "node_modules" ]; then
  echo "   ✅ 根依赖已安装"
else
  echo "   ❌ 根依赖未安装"
  echo "   💡 安装命令: pnpm install"
fi

cd apps/server
if [ -d "node_modules" ]; then
  echo "   ✅ 后端依赖已安装"
else
  echo "   ❌ 后端依赖未安装"
  echo "   💡 安装命令: cd apps/server && pnpm install"
fi

cd ../web
if [ -d "node_modules" ]; then
  echo "   ✅ 前端依赖已安装"
else
  echo "   ❌ 前端依赖未安装"
  echo "   💡 安装命令: cd apps/web && pnpm install"
fi

echo ""

# 检查API端点
echo "🔌 检查关键API端点..."
ENDPOINTS=(
  "/api/v1"
  "/api/v1/agents"
  "/api/v1/tasks"
)

for endpoint in "${ENDPOINTS[@]}"; do
  RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000$endpoint 2>/dev/null)
  if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "401" ]; then
    echo "   ✅ $endpoint (HTTP $RESPONSE)"
  else
    echo "   ❌ $endpoint (HTTP $RESPONSE)"
  fi
done

echo ""
echo "================================"
echo "✅ 状态检查完成"
