#!/bin/bash
# AI协作平台 - 快速启动脚本

echo "🚀 启动AI协作平台..."

# 进入项目目录
cd ~/clawd/projects/ai-collab-hub

# 检查依赖
if [ ! -d "node_modules" ]; then
  echo "📦 安装依赖..."
  pnpm install
fi

# 启动后端
echo "🔧 启动后端服务器..."
cd apps/server
if [ ! -d "dist" ]; then
  echo "   编译后端..."
  pnpm build
fi

# 在后台启动后端
node dist/main.js > /tmp/server.log 2>&1 &
SERVER_PID=$!
echo "   后端已启动 (PID: $SERVER_PID)"
echo "   日志: /tmp/server.log"

# 等待后端启动
sleep 3

# 启动前端
echo "🎨 启动前端应用..."
cd ../web
pnpm dev > /tmp/web.log 2>&1 &
WEB_PID=$!
echo "   前端已启动 (PID: $WEB_PID)"
echo "   日志: /tmp/web.log"

# 等待前端启动
sleep 5

# 显示状态
echo ""
echo "✅ 系统启动完成！"
echo ""
echo "📍 访问地址:"
echo "   后端API: http://localhost:3000/api/v1"
echo "   前端Web: http://localhost:3001 (或3002/3003)"
echo ""
echo "📋 管理命令:"
echo "   查看后端日志: tail -f /tmp/server.log"
echo "   查看前端日志: tail -f /tmp/web.log"
echo "   停止所有服务: kill $SERVER_PID $WEB_PID"
echo ""
echo "🎉 开始使用吧！"
