#!/bin/bash
# 测试子任务 API 端点

BASE_URL="http://localhost:3000/api/v1"
TOKEN="your-auth-token"  # 替换为实际的认证token

echo "=== 测试任务分解功能 ==="
echo ""

# 1. 创建父任务
echo "1. 创建父任务..."
PARENT_TASK=$(curl -s -X POST "$BASE_URL/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "主任务",
    "description": "这是一个主任务",
    "type": "independent"
  }')
PARENT_ID=$(echo $PARENT_TASK | jq -r '.taskId')
echo "父任务ID: $PARENT_ID"
echo ""

# 2. 创建子任务（新任务）
echo "2. 创建子任务（新任务）..."
SUBTASK1=$(curl -s -X POST "$BASE_URL/tasks/$PARENT_ID/subtasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "子任务1",
    "description": "第一个子任务",
    "type": "independent"
  }')
SUBTASK1_ID=$(echo $SUBTASK1 | jq -r '.subtask.id')
echo "子任务1 ID: $SUBTASK1_ID"
echo ""

# 3. 创建另一个子任务
echo "3. 创建第二个子任务..."
SUBTASK2=$(curl -s -X POST "$BASE_URL/tasks/$PARENT_ID/subtasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "子任务2",
    "description": "第二个子任务",
    "type": "independent"
  }')
SUBTASK2_ID=$(echo $SUBTASK2 | jq -r '.subtask.id')
echo "子任务2 ID: $SUBTASK2_ID"
echo ""

# 4. 获取子任务列表
echo "4. 获取子任务列表..."
curl -s -X GET "$BASE_URL/tasks/$PARENT_ID/subtasks" | jq
echo ""

# 5. 获取任务进度
echo "5. 获取任务进度..."
curl -s -X GET "$BASE_URL/tasks/$PARENT_ID/progress" | jq
echo ""

# 6. 获取任务树
echo "6. 获取任务树..."
curl -s -X GET "$BASE_URL/tasks/$PARENT_ID/tree" | jq
echo ""

# 7. 完成一个子任务
echo "7. 完成子任务1..."
curl -s -X POST "$BASE_URL/tasks/$SUBTASK1_ID/complete" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rating": 5}' | jq
echo ""

# 8. 再次获取进度
echo "8. 再次获取进度（应该显示50%）..."
curl -s -X GET "$BASE_URL/tasks/$PARENT_ID/progress" | jq
echo ""

# 9. 删除子任务关系
echo "9. 删除子任务2的关系..."
curl -s -X DELETE "$BASE_URL/tasks/$PARENT_ID/subtasks/$SUBTASK2_ID" \
  -H "Authorization: Bearer $TOKEN" | jq
echo ""

# 10. 最终获取子任务列表
echo "10. 最终获取子任务列表..."
curl -s -X GET "$BASE_URL/tasks/$PARENT_ID/subtasks" | jq
echo ""

echo "=== 测试完成 ==="
