#!/bin/bash

# AI协作平台 - 性能测试脚本
# 用于测试API响应时间和并发性能

BASE_URL="http://localhost:3000"
ITERATIONS=10

echo "🧪 AI协作平台 - 性能测试"
echo "=========================="
echo ""

# 检查服务是否运行
echo "🔍 检查API服务状态..."
if ! curl -s -f "$BASE_URL/health" > /dev/null; then
    echo "❌ 错误: API服务未运行"
    echo "请先启动服务: cd apps/server && pnpm dev"
    exit 1
fi
echo "✅ API服务正常运行"
echo ""

# 测试1: API响应时间
echo "📊 测试1: API响应时间 (平均值)"
echo "--------------------------------"

test_endpoint() {
    local name=$1
    local endpoint=$2
    local total=0
    
    echo -n "   $name: "
    
    for i in $(seq 1 $ITERATIONS); do
        start=$(python3 -c 'import time; print(int(time.time() * 1000))')
        curl -s -f "$BASE_URL$endpoint" > /dev/null
        end=$(python3 -c 'import time; print(int(time.time() * 1000))')
        duration=$((end - start))
        total=$((total + duration))
    done
    
    avg=$((total / ITERATIONS))
    echo "${avg}ms"
}

test_endpoint "健康检查" "/health"
test_endpoint "Agent列表" "/api/v1/agents"
test_endpoint "Task列表" "/api/v1/tasks"
test_endpoint "Dashboard" "/api/v1/analytics/dashboard"

echo ""

# 测试2: 并发性能 (简单版)
echo "📊 测试2: 并发性能 (10个并发请求)"
echo "------------------------------------"

start=$(python3 -c 'import time; print(int(time.time() * 1000))')

for i in $(seq 1 10); do
    curl -s "$BASE_URL/api/v1/agents" > /dev/null &
done

wait

end=$(python3 -c 'import time; print(int(time.time() * 1000))')
duration=$((end - start))

echo "   10个并发请求完成时间: ${duration}ms"
echo "   平均每个请求: $((duration / 10))ms"

echo ""

# 测试3: 缓存效果
echo "📊 测试3: 缓存效果对比"
echo "------------------------"

echo -n "   第1次请求 (无缓存): "
start=$(python3 -c 'import time; print(int(time.time() * 1000))')
curl -s "$BASE_URL/api/v1/analytics/dashboard" > /dev/null
end=$(python3 -c 'import time; print(int(time.time() * 1000))')
first_request=$((end - start))
echo "${first_request}ms"

echo -n "   第2次请求 (有缓存): "
start=$(python3 -c 'import time; print(int(time.time() * 1000))')
curl -s "$BASE_URL/api/v1/analytics/dashboard" > /dev/null
end=$(python3 -c 'import time; print(int(time.time() * 1000))')
second_request=$((end - start))
echo "${second_request}ms"

improvement=$((100 - (second_request * 100 / first_request)))
echo "   性能提升: ${improvement}%"

echo ""
echo "=========================="
echo "✅ 性能测试完成!"
echo ""
echo "💡 提示:"
echo "   - 响应时间 <100ms: 优秀 ✅"
echo "   - 响应时间 100-200ms: 良好 ⚠️"
echo "   - 响应时间 >200ms: 需优化 ❌"
echo ""
echo "📊 详细性能分析请使用:"
echo "   wrk -t4 -c100 -d30s $BASE_URL/api/v1/agents"
echo "   ab -n 1000 -c 100 $BASE_URL/api/v1/agents"
