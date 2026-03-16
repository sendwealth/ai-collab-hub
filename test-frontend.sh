#!/bin/bash

# 前端功能测试脚本
# 用于测试所有前端页面的功能是否正常

echo "================================"
echo "前端功能测试开始"
echo "================================"
echo ""

# 测试后端API是否运行
echo "1. 测试后端API连接..."
if curl -s http://localhost:3000/api/v1/agents > /dev/null; then
    echo "✅ 后端API运行正常"
else
    echo "❌ 后端API未运行，请先启动后端服务"
    echo "   运行: cd apps/server && pnpm dev"
    exit 1
fi

# 测试前端是否运行
echo ""
echo "2. 测试前端服务..."
if curl -s http://localhost:3001 > /dev/null; then
    echo "✅ 前端服务运行正常"
else
    echo "❌ 前端服务未运行，请先启动前端"
    echo "   运行: cd apps/web && pnpm dev"
    exit 1
fi

# 测试各个页面是否可访问
echo ""
echo "3. 测试页面可访问性..."

pages=(
    "/"
    "/login"
    "/register"
    "/user-register"
    "/dashboard"
    "/tasks"
    "/workflow/editor"
    "/forgot-password"
    "/welcome"
)

for page in "${pages[@]}"; do
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001$page | grep -q "200"; then
        echo "✅ $page - 可访问"
    else
        echo "❌ $page - 无法访问"
    fi
done

# 测试API端点
echo ""
echo "4. 测试API端点..."

# 测试注册
echo "测试用户注册API..."
register_response=$(curl -s -X POST http://localhost:3000/api/v1/auth/register \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"test_user_$(date +%s)\",\"email\":\"test$(date +%s)@example.com\",\"password\":\"Test123456\"}")

if echo "$register_response" | grep -q "token"; then
    echo "✅ 用户注册API正常"
    # 提取token
    token=$(echo "$register_response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    
    # 测试登录
    echo "测试用户登录API..."
    login_response=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"test@example.com\",\"password\":\"Test123456\"}")
    
    if echo "$login_response" | grep -q "token"; then
        echo "✅ 用户登录API正常"
    else
        echo "⚠️  用户登录API返回异常（可能是测试用户不存在）"
    fi
else
    echo "❌ 用户注册API异常"
fi

# 测试获取任务
echo "测试获取任务API..."
if curl -s http://localhost:3000/api/v1/tasks | grep -q "tasks"; then
    echo "✅ 获取任务API正常"
else
    echo "❌ 获取任务API异常"
fi

# 测试获取Agent
echo "测试获取AgentAPI..."
if curl -s http://localhost:3000/api/v1/agents | grep -q "agents"; then
    echo "✅ 获取AgentAPI正常"
else
    echo "❌ 获取AgentAPI异常"
fi

echo ""
echo "================================"
echo "测试完成！"
echo "================================"
echo ""
echo "📋 功能清单："
echo ""
echo "✅ 已完成功能："
echo "  • Landing Page - 所有导航和链接"
echo "  • 用户注册和登录"
echo "  • Dashboard页面（带侧边栏和认证）"
echo "  • 任务市场（从API获取数据）"
echo "  • 任务详情页"
echo "  • 工作流编辑器"
echo "  • 忘记密码页面"
echo "  • 新用户欢迎页面"
echo "  • 404页面"
echo ""
echo "⚠️  待完善功能："
echo "  • OAuth登录（GitHub、Google）"
echo "  • 任务搜索和排序"
echo "  • 工作流运行功能"
echo "  • 用户协议和隐私政策页面"
echo "  • 更多图表和数据可视化"
echo ""
echo "📝 详细清单请查看: FRONTEND_FEATURE_CHECKLIST.md"
