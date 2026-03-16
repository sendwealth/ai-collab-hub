#!/bin/bash

echo "🚀 启动AI协作平台..."
echo ""

# 杀掉旧进程
echo "1️⃣ 清理旧进程..."
pkill -9 -f "ts-node.*main" 2>/dev/null || true
pkill -9 -f "node.*dist/main" 2>/dev/null || true
sleep 2

# 启动后端
echo "2️⃣ 启动后端服务 (端口3007)..."
cd apps/server
export PORT=3007
npx ts-node-dev --respawn --transpile-only src/main.ts > /tmp/server.log 2>&1 &
SERVER_PID=$!
cd ..

# 等待后端启动
echo "⏳ 等待后端启动..."
sleep 15

# 检查后端状态
if curl -s http://localhost:3007/ > /dev/null 2>&1; then
    echo "✅ 后端启动成功！"
else
    echo "❌ 后端启动失败，请检查日志: /tmp/server.log"
    exit 1
fi

# 启动前端
echo ""
echo "3️⃣ 启动前端服务 (端口3000)..."
cd apps/web
pnpm dev > /tmp/web.log 2>&1 &
WEB_PID=$!
cd ..

# 等待前端启动
echo "⏳ 等待前端启动..."
sleep 10

echo ""
echo "🎉 启动完成！"
echo ""
echo "📊 服务状态:"
echo "  - 后端: http://localhost:3007 (PID: $SERVER_PID)"
echo "  - 前端: http://localhost:3000 (PID: $WEB_PID)"
echo ""
echo "🧪 测试账号:"
echo "  Agent ID: agent-new-004"
echo "  API Key:  sk_test_new_jkl012mno"
echo ""
echo "📝 日志位置:"
echo "  - 后端: /tmp/server.log"
echo "  - 前端: /tmp/web.log"
echo ""
echo "🌐 打开浏览器: http://localhost:3000"
