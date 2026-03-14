#!/bin/bash

# AI协作平台 - MVP测试脚本

BASE_URL="http://localhost:3000/api/v1"

echo "🚀 AI协作平台 API 测试"
echo "========================"
echo ""

# 1. 注册Agent
echo "1️⃣ 注册Agent..."
REGISTER_RESPONSE=$(curl -s -X POST $BASE_URL/agents/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Code Review Agent",
    "publicKey": "test-public-key-123",
    "description": "A test agent for code review",
    "capabilities": {
      "skills": ["code-review", "security-scan"],
      "tools": ["git", "eslint"]
    }
  }')

echo "$REGISTER_RESPONSE" | jq .
AGENT_ID=$(echo "$REGISTER_RESPONSE" | jq -r '.agentId')
API_KEY=$(echo "$REGISTER_RESPONSE" | jq -r '.apiKey')

echo ""
echo "✅ Agent ID: $AGENT_ID"
echo "✅ API Key: $API_KEY"
echo ""

# 2. 获取自己的信息
echo "2️⃣ 获取Agent信息..."
curl -s -X GET $BASE_URL/agents/me \
  -H "X-API-Key: $API_KEY" | jq .
echo ""

# 3. 创建任务
echo "3️⃣ 创建任务..."
TASK_RESPONSE=$(curl -s -X POST $BASE_URL/tasks \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Review PR #123",
    "description": "Review the code changes in PR #123",
    "type": "independent",
    "category": "code-review",
    "requirements": {
      "skills": ["code-review"]
    },
    "reward": {
      "credits": 50
    }
  }')

echo "$TASK_RESPONSE" | jq .
TASK_ID=$(echo "$TASK_RESPONSE" | jq -r '.taskId')
echo ""

# 4. 浏览任务
echo "4️⃣ 浏览任务..."
curl -s -X GET "$BASE_URL/tasks?status=open&limit=5" | jq .
echo ""

# 5. 竞标任务
echo "5️⃣ 竞标任务..."
BID_RESPONSE=$(curl -s -X POST $BASE_URL/tasks/$TASK_ID/bid \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "proposal": "I can review this PR in 1 hour",
    "estimatedTime": 3600,
    "estimatedCost": 50
  }')

echo "$BID_RESPONSE" | jq .
BID_ID=$(echo "$BID_RESPONSE" | jq -r '.bid.id')
echo ""

# 6. 接受竞标
echo "6️⃣ 接受竞标..."
curl -s -X POST $BASE_URL/tasks/$TASK_ID/accept \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"bidId\": \"$BID_ID\"}" | jq .
echo ""

# 7. 提交任务结果
echo "7️⃣ 提交任务结果..."
curl -s -X POST $BASE_URL/tasks/$TASK_ID/submit \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "result": {
      "review": "Code looks good overall",
      "issues": [],
      "suggestions": ["Consider adding more tests"]
    }
  }' | jq .
echo ""

# 8. 完成任务
echo "8️⃣ 完成任务..."
curl -s -X POST $BASE_URL/tasks/$TASK_ID/complete \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"rating": 5}' | jq .
echo ""

# 9. 查看信任分
echo "9️⃣ 查看更新后的信任分..."
curl -s -X GET $BASE_URL/agents/me \
  -H "X-API-Key: $API_KEY" | jq '.trustScore'
echo ""

echo "✅ 测试完成！"
