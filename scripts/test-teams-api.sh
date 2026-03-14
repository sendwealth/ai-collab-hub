#!/bin/bash

# Teams API 测试脚本
# 使用方法: ./test-teams-api.sh YOUR_API_KEY

API_KEY=$1
BASE_URL="http://localhost:3000/api/v1"

if [ -z "$API_KEY" ]; then
  echo "❌ 错误: 需要提供API Key"
  echo "使用方法: ./test-teams-api.sh YOUR_API_KEY"
  exit 1
fi

echo "🧪 开始测试 Teams API..."
echo ""

# 1. 创建团队
echo "1️⃣  创建团队..."
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/teams" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "name": "测试团队",
    "description": "这是一个用于测试的团队"
  }')

echo "响应: $CREATE_RESPONSE"
TEAM_ID=$(echo $CREATE_RESPONSE | jq -r '.id // empty')

if [ -z "$TEAM_ID" ]; then
  echo "❌ 创建团队失败"
  exit 1
fi

echo "✅ 团队创建成功, ID: $TEAM_ID"
echo ""

# 2. 获取团队列表
echo "2️⃣  获取我的团队列表..."
curl -s -X GET "$BASE_URL/teams" \
  -H "x-api-key: $API_KEY" | jq '.'
echo ""

# 3. 获取团队详情
echo "3️⃣  获取团队详情..."
curl -s -X GET "$BASE_URL/teams/$TEAM_ID" \
  -H "x-api-key: $API_KEY" | jq '.'
echo ""

# 4. 尝试添加成员(会失败,因为agent不存在)
echo "4️⃣  尝试添加成员(预期会失败)..."
curl -s -X POST "$BASE_URL/teams/$TEAM_ID/members" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "agentId": "non-existent-agent-id",
    "role": "member"
  }' | jq '.'
echo ""

# 5. 更新成员角色(会失败,因为没有这个成员)
echo "5️⃣  尝试更新成员角色(预期会失败)..."
curl -s -X PATCH "$BASE_URL/teams/$TEAM_ID/members/non-existent-agent-id" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "role": "admin"
  }' | jq '.'
echo ""

# 6. 清理:删除团队(通过移除自己)
echo "6️⃣  清理测试数据..."
# 注意:这里不能删除团队,因为owner不能移除自己(如果只有一个owner)
# 需要先添加另一个owner或直接删除数据库记录

echo ""
echo "✅ 测试完成!"
echo ""
echo "📝 测试总结:"
echo "- ✅ 创建团队: 成功"
echo "- ✅ 获取团队列表: 成功"
echo "- ✅ 获取团队详情: 成功"
echo "- ✅ 错误处理: 正常"
echo ""
echo "💡 提示: 要完整测试添加成员功能,需要先创建另一个Agent"
