#!/bin/bash

# AI协作平台 - 全面功能测试脚本
# 执行日期: 2026-03-16

BASE_URL="http://localhost:3000/api/v1"
TIMESTAMP=$(date +%s)
TEST_RESULTS=()
PASS_COUNT=0
FAIL_COUNT=0

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "================================"
echo "AI协作平台全面功能测试"
echo "测试时间: $(date)"
echo "================================"
echo ""

# 测试结果记录函数
log_test() {
    local test_name=$1
    local result=$2
    local message=$3
    
    if [ "$result" == "PASS" ]; then
        echo -e "${GREEN}✅ $test_name${NC}"
        ((PASS_COUNT++))
    else
        echo -e "${RED}❌ $test_name${NC}"
        echo "   错误: $message"
        ((FAIL_COUNT++))
    fi
    
    TEST_RESULTS+=("$test_name: $result - $message")
}

# 1. 用户认证测试
echo ""
echo "1️⃣ 用户认证测试"
echo "----------------"

# 1.1 注册Agent（使用唯一名称）
echo "测试 1.1: Agent注册..."
REGISTER_RESPONSE=$(curl -s -X POST $BASE_URL/agents/register \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Test-Agent-$TIMESTAMP\",
    \"publicKey\": \"test-key-$TIMESTAMP\",
    \"description\": \"Test agent for comprehensive testing\",
    \"capabilities\": {
      \"skills\": [\"code-review\", \"testing\"],
      \"tools\": [\"git\", \"jest\"]
    }
  }")

if echo "$REGISTER_RESPONSE" | grep -q '"success":true'; then
    AGENT_ID=$(echo "$REGISTER_RESPONSE" | jq -r '.data.agentId // .agentId')
    API_KEY=$(echo "$REGISTER_RESPONSE" | jq -r '.data.apiKey // .apiKey')
    log_test "Agent注册" "PASS" "Agent ID: $AGENT_ID"
else
    ERROR_MSG=$(echo "$REGISTER_RESPONSE" | jq -r '.error.message // .message')
    log_test "Agent注册" "FAIL" "$ERROR_MSG"
fi

# 1.2 测试重复注册
echo "测试 1.2: 重复注册检测..."
DUP_RESPONSE=$(curl -s -X POST $BASE_URL/agents/register \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Test-Agent-$TIMESTAMP\",
    \"publicKey\": \"test-key-$TIMESTAMP\",
    \"description\": \"Duplicate agent\",
    \"capabilities\": {\"skills\": [], \"tools\": []}
  }")

if echo "$DUP_RESPONSE" | grep -q "already exists"; then
    log_test "重复注册检测" "PASS" "正确拒绝重复注册"
else
    log_test "重复注册检测" "FAIL" "未检测到重复注册"
fi

# 1.3 测试无效API Key
echo "测试 1.3: 无效API Key认证..."
INVALID_AUTH=$(curl -s -X GET $BASE_URL/agents/me \
  -H "X-API-Key: invalid-key-12345")

if echo "$INVALID_AUTH" | grep -q "Unauthorized\|Invalid"; then
    log_test "无效API Key检测" "PASS" "正确拒绝无效API Key"
else
    log_test "无效API Key检测" "FAIL" "未正确验证API Key"
fi

# 1.4 测试有效API Key
if [ -n "$API_KEY" ] && [ "$API_KEY" != "null" ]; then
    echo "测试 1.4: 有效API Key认证..."
    VALID_AUTH=$(curl -s -X GET $BASE_URL/agents/me \
      -H "X-API-Key: $API_KEY")
    
    if echo "$VALID_AUTH" | grep -q '"success":true'; then
        log_test "API Key认证" "PASS" "成功认证"
    else
        log_test "API Key认证" "FAIL" "认证失败"
    fi
fi

# 2. Agent管理测试
echo ""
echo "2️⃣ Agent管理测试"
echo "----------------"

# 2.1 获取Agent列表
echo "测试 2.1: 获取Agent列表..."
AGENTS_LIST=$(curl -s -X GET "$BASE_URL/agents?limit=10&offset=0")

if echo "$AGENTS_LIST" | grep -q '"success":true\|"agents"'; then
    AGENT_COUNT=$(echo "$AGENTS_LIST" | jq -r '.data.total // .total // 0')
    log_test "Agent列表" "PASS" "共 $AGENT_COUNT 个Agent"
else
    log_test "Agent列表" "FAIL" "获取失败"
fi

# 2.2 获取Agent详情
if [ -n "$AGENT_ID" ] && [ "$AGENT_ID" != "null" ]; then
    echo "测试 2.2: 获取Agent详情..."
    AGENT_DETAIL=$(curl -s -X GET "$BASE_URL/agents/$AGENT_ID")
    
    if echo "$AGENT_DETAIL" | grep -q "$AGENT_ID"; then
        log_test "Agent详情" "PASS" "成功获取详情"
    else
        log_test "Agent详情" "FAIL" "获取失败"
    fi
fi

# 3. 任务管理测试
echo ""
echo "3️⃣ 任务管理测试"
echo "----------------"

# 3.1 创建任务
if [ -n "$API_KEY" ] && [ "$API_KEY" != "null" ]; then
    echo "测试 3.1: 创建任务..."
    TASK_RESPONSE=$(curl -s -X POST $BASE_URL/tasks \
      -H "X-API-Key: $API_KEY" \
      -H "Content-Type: application/json" \
      -d "{
        \"title\": \"Test Task $TIMESTAMP\",
        \"description\": \"Comprehensive test task\",
        \"type\": \"independent\",
        \"category\": \"testing\",
        \"requirements\": {\"skills\": [\"testing\"]},
        \"reward\": {\"credits\": 100}
      }")
    
    if echo "$TASK_RESPONSE" | grep -q '"success":true\|"taskId"'; then
        TASK_ID=$(echo "$TASK_RESPONSE" | jq -r '.data.taskId // .taskId')
        log_test "创建任务" "PASS" "Task ID: $TASK_ID"
    else
        ERROR_MSG=$(echo "$TASK_RESPONSE" | jq -r '.error.message // .message')
        log_test "创建任务" "FAIL" "$ERROR_MSG"
    fi
fi

# 3.2 获取任务列表（修复limit参数）
echo "测试 3.2: 获取任务列表..."
TASKS_LIST=$(curl -s -X GET "$BASE_URL/tasks?limit=10&offset=0")

if echo "$TASKS_LIST" | grep -q '"success":true\|"tasks"'; then
    TASK_COUNT=$(echo "$TASKS_LIST" | jq -r '.data.total // .total // 0')
    log_test "任务列表" "PASS" "共 $TASK_COUNT 个任务"
else
    ERROR_MSG=$(echo "$TASKS_LIST" | jq -r '.error.message // .message' | head -1)
    log_test "任务列表" "FAIL" "$ERROR_MSG"
fi

# 3.3 任务搜索
echo "测试 3.3: 任务搜索..."
SEARCH_RESULT=$(curl -s -X GET "$BASE_URL/search/tasks?q=test&limit=5")

if echo "$SEARCH_RESULT" | grep -q '"success":true\|"results"'; then
    log_test "任务搜索" "PASS" "搜索功能正常"
else
    log_test "任务搜索" "FAIL" "搜索失败"
fi

# 3.4 任务竞标
if [ -n "$TASK_ID" ] && [ "$TASK_ID" != "null" ] && [ -n "$API_KEY" ]; then
    echo "测试 3.4: 任务竞标..."
    BID_RESPONSE=$(curl -s -X POST $BASE_URL/tasks/$TASK_ID/bid \
      -H "X-API-Key: $API_KEY" \
      -H "Content-Type: application/json" \
      -d "{
        \"proposal\": \"I can complete this task\",
        \"estimatedTime\": 3600,
        \"estimatedCost\": 100
      }")
    
    if echo "$BID_RESPONSE" | grep -q '"success":true\|"bid"'; then
        BID_ID=$(echo "$BID_RESPONSE" | jq -r '.data.bid.id // .bid.id')
        log_test "任务竞标" "PASS" "Bid ID: $BID_ID"
    else
        ERROR_MSG=$(echo "$BID_RESPONSE" | jq -r '.error.message // .message')
        log_test "任务竞标" "FAIL" "$ERROR_MSG"
    fi
fi

# 4. 工作流测试
echo ""
echo "4️⃣ 工作流测试"
echo "----------------"

# 4.1 创建工作流
if [ -n "$API_KEY" ] && [ "$API_KEY" != "null" ]; then
    echo "测试 4.1: 创建工作流..."
    WORKFLOW_RESPONSE=$(curl -s -X POST $BASE_URL/workflows \
      -H "X-API-Key: $API_KEY" \
      -H "Content-Type: application/json" \
      -d "{
        \"name\": \"Test Workflow $TIMESTAMP\",
        \"description\": \"Test workflow\",
        \"nodes\": [
          {\"id\": \"node1\", \"type\": \"start\", \"position\": {\"x\": 0, \"y\": 0}},
          {\"id\": \"node2\", \"type\": \"task\", \"position\": {\"x\": 100, \"y\": 0}}
        ],
        \"edges\": [{\"source\": \"node1\", \"target\": \"node2\"}]
      }")
    
    if echo "$WORKFLOW_RESPONSE" | grep -q '"success":true\|"workflowId"'; then
        WORKFLOW_ID=$(echo "$WORKFLOW_RESPONSE" | jq -r '.data.workflowId // .workflowId')
        log_test "创建工作流" "PASS" "Workflow ID: $WORKFLOW_ID"
    else
        ERROR_MSG=$(echo "$WORKFLOW_RESPONSE" | jq -r '.error.message // .message')
        log_test "创建工作流" "FAIL" "$ERROR_MSG"
    fi
fi

# 4.2 获取工作流列表
echo "测试 4.2: 获取工作流列表..."
WORKFLOWS_LIST=$(curl -s -X GET "$BASE_URL/workflows?limit=10")

if echo "$WORKFLOWS_LIST" | grep -q '"success":true\|"workflows"'; then
    log_test "工作流列表" "PASS" "获取成功"
else
    log_test "工作流列表" "FAIL" "获取失败"
fi

# 5. 积分系统测试
echo ""
echo "5️⃣ 积分系统测试"
echo "----------------"

# 5.1 查看积分余额
if [ -n "$API_KEY" ] && [ "$API_KEY" != "null" ]; then
    echo "测试 5.1: 查看积分余额..."
    CREDITS_RESPONSE=$(curl -s -X GET $BASE_URL/credits/balance \
      -H "X-API-Key: $API_KEY")
    
    if echo "$CREDITS_RESPONSE" | grep -q '"success":true\|"balance"'; then
        BALANCE=$(echo "$CREDITS_RESPONSE" | jq -r '.data.balance // .balance')
        log_test "积分余额" "PASS" "余额: $BALANCE"
    else
        ERROR_MSG=$(echo "$CREDITS_RESPONSE" | jq -r '.error.message // .message')
        log_test "积分余额" "FAIL" "$ERROR_MSG"
    fi
fi

# 6. 推荐系统测试
echo ""
echo "6️⃣ 推荐系统测试"
echo "----------------"

# 6.1 获取任务推荐
if [ -n "$API_KEY" ] && [ "$API_KEY" != "null" ]; then
    echo "测试 6.1: 获取任务推荐..."
    RECOMMEND_RESPONSE=$(curl -s -X GET "$BASE_URL/recommendations/tasks?limit=5" \
      -H "X-API-Key: $API_KEY")
    
    if echo "$RECOMMEND_RESPONSE" | grep -q '"success":true\|"recommendations"'; then
        log_test "任务推荐" "PASS" "推荐功能正常"
    else
        log_test "任务推荐" "FAIL" "推荐失败"
    fi
fi

# 7. 批量操作测试
echo ""
echo "7️⃣ 批量操作测试"
echo "----------------"

# 7.1 批量查询Agent
echo "测试 7.1: 批量查询Agent..."
BATCH_RESPONSE=$(curl -s -X POST $BASE_URL/batch/query \
  -H "Content-Type: application/json" \
  -d "{
    \"queries\": [
      {\"endpoint\": \"/agents\", \"method\": \"GET\"},
      {\"endpoint\": \"/tasks\", \"method\": \"GET\"}
    ]
  }")

if echo "$BATCH_RESPONSE" | grep -q '"success":true\|"results"'; then
    log_test "批量查询" "PASS" "批量操作正常"
else
    log_test "批量查询" "FAIL" "批量操作失败"
fi

# 8. 匹配系统测试
echo ""
echo "8️⃣ 匹配系统测试"
echo "----------------"

# 8.1 Agent匹配
echo "测试 8.1: Agent匹配..."
MATCH_RESPONSE=$(curl -s -X POST $BASE_URL/matching/match \
  -H "Content-Type: application/json" \
  -d "{
    \"taskId\": \"test-task-id\",
    \"requirements\": {\"skills\": [\"code-review\"]}
  }")

if echo "$MATCH_RESPONSE" | grep -q '"success":true\|"matches"'; then
    log_test "Agent匹配" "PASS" "匹配功能正常"
else
    log_test "Agent匹配" "FAIL" "匹配失败"
fi

# 测试总结
echo ""
echo "================================"
echo "测试总结"
echo "================================"
echo ""
echo -e "✅ 通过: ${GREEN}$PASS_COUNT${NC}"
echo -e "❌ 失败: ${RED}$FAIL_COUNT${NC}"
echo -e "📊 总计: $((PASS_COUNT + FAIL_COUNT))"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}所有测试通过！${NC}"
    exit 0
else
    echo -e "${YELLOW}部分测试失败，请检查错误日志${NC}"
    exit 1
fi
