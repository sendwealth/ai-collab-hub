#!/bin/bash

# AI协作平台 - 完整测试套件

echo "🧪 AI协作平台 - 测试套件"
echo "========================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试计数器
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 测试函数
run_test() {
  local test_name=$1
  local test_command=$2

  echo "Running: $test_name"
  TOTAL_TESTS=$((TOTAL_TESTS + 1))

  if eval $test_command > /tmp/test_output.log 2>&1; then
    echo -e "${GREEN}✓ PASSED${NC}: $test_name"
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    echo -e "${RED}✗ FAILED${NC}: $test_name"
    cat /tmp/test_output.log
    FAILED_TESTS=$((FAILED_TESTS + 1))
  fi
  echo ""
}

# 1. 单元测试
echo "📦 1. 单元测试"
echo "--------------"

# Agent Service Tests
run_test "Agent Service - Register" "cd apps/server && npm test -- --testNamePattern='should register a new agent successfully' --silent"
run_test "Agent Service - Duplicate Name" "cd apps/server && npm test -- --testNamePattern='should throw ConflictException if agent name already exists' --silent"
run_test "Agent Service - Get Me" "cd apps/server && npm test -- --testNamePattern='should return agent information' --silent"
run_test "Agent Service - Update Status" "cd apps/server && npm test -- --testNamePattern='should update agent status successfully' --silent"
run_test "Agent Service - Discover" "cd apps/server && npm test -- --testNamePattern='should return agents filtered by skill' --silent"
run_test "Agent Service - Validate API Key" "cd apps/server && npm test -- --testNamePattern='should return agent for valid API key' --silent"

# Task Service Tests
run_test "Task Service - Create" "cd apps/server && npm test -- --testNamePattern='should create a task successfully' --silent"
run_test "Task Service - Get Tasks" "cd apps/server && npm test -- --testNamePattern='should return tasks with filters' --silent"
run_test "Task Service - Bid" "cd apps/server && npm test -- --testNamePattern='should create a bid successfully' --silent"
run_test "Task Service - Accept Bid" "cd apps/server && npm test -- --testNamePattern='should accept a bid and assign task' --silent"
run_test "Task Service - Submit" "cd apps/server && npm test -- --testNamePattern='should submit task result successfully' --silent"
run_test "Task Service - Complete" "cd apps/server && npm test -- --testNamePattern='should complete task with rating' --silent"

# 2. E2E测试
echo ""
echo "🌐 2. E2E测试"
echo "-------------"

run_test "E2E - Agent Registration" "cd apps/server && npm run test:e2e -- --testNamePattern='should register a new agent' --silent"
run_test "E2E - Agent Info" "cd apps/server && npm run test:e2e -- --testNamePattern='should return agent info' --silent"
run_test "E2E - Task Creation" "cd apps/server && npm run test:e2e -- --testNamePattern='should create a task' --silent"
run_test "E2E - Task Bidding" "cd apps/server && npm run test:e2e -- --testNamePattern='should create a bid' --silent"
run_test "E2E - Task Completion" "cd apps/server && npm run test:e2e -- --testNamePattern='should complete task with rating' --silent"
run_test "E2E - Full Flow" "cd apps/server && npm run test:e2e -- --testNamePattern='should complete full task lifecycle' --silent"

# 3. API测试
echo ""
echo "🔌 3. API测试"
echo "-------------"

BASE_URL="http://localhost:3000/api/v1"

# 检查服务器是否运行
if ! curl -s $BASE_URL/agents > /dev/null 2>&1; then
  echo -e "${YELLOW}⚠️  服务器未运行，跳过API测试${NC}"
  echo "启动服务器: cd apps/server && pnpm dev"
else
  # Agent注册测试
  REGISTER_RESPONSE=$(curl -s -X POST $BASE_URL/agents/register \
    -H "Content-Type: application/json" \
    -d '{
      "name": "API Test Agent",
      "publicKey": "api-test-key",
      "capabilities": {"skills": ["api-testing"]}
    }')

  if echo "$REGISTER_RESPONSE" | grep -q "agentId"; then
    echo -e "${GREEN}✓ PASSED${NC}: API - Agent Registration"
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    echo -e "${RED}✗ FAILED${NC}: API - Agent Registration"
    FAILED_TESTS=$((FAILED_TESTS + 1))
  fi
  TOTAL_TESTS=$((TOTAL_TESTS + 1))

  API_KEY=$(echo "$REGISTER_RESPONSE" | jq -r '.apiKey')

  # 获取Agent信息
  ME_RESPONSE=$(curl -s -X GET $BASE_URL/agents/me \
    -H "X-API-Key: $API_KEY")

  if echo "$ME_RESPONSE" | grep -q "id"; then
    echo -e "${GREEN}✓ PASSED${NC}: API - Get Agent Info"
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    echo -e "${RED}✗ FAILED${NC}: API - Get Agent Info"
    FAILED_TESTS=$((FAILED_TESTS + 1))
  fi
  TOTAL_TESTS=$((TOTAL_TESTS + 1))

  # 创建任务
  TASK_RESPONSE=$(curl -s -X POST $BASE_URL/tasks \
    -H "X-API-Key: $API_KEY" \
    -H "Content-Type: application/json" \
    -d '{"title": "API Test Task"}')

  if echo "$TASK_RESPONSE" | grep -q "taskId"; then
    echo -e "${GREEN}✓ PASSED${NC}: API - Create Task"
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    echo -e "${RED}✗ FAILED${NC}: API - Create Task"
    FAILED_TESTS=$((FAILED_TESTS + 1))
  fi
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
fi

# 4. 测试覆盖率
echo ""
echo "📊 4. 测试覆盖率"
echo "-----------------"

if cd apps/server && npm run test:cov > /tmp/coverage.log 2>&1; then
  echo -e "${GREEN}✓ 测试覆盖率报告已生成${NC}"
  cat /tmp/coverage.log | grep -A 5 "All files"
else
  echo -e "${YELLOW}⚠️  测试覆盖率报告生成失败${NC}"
fi

# 5. 测试总结
echo ""
echo "📋 测试总结"
echo "============"
echo -e "总测试数: $TOTAL_TESTS"
echo -e "${GREEN}通过: $PASSED_TESTS${NC}"
echo -e "${RED}失败: $FAILED_TESTS${NC}"
echo -e "通过率: $(awk "BEGIN {printf \"%.1f\", ($PASSED_TESTS/$TOTAL_TESTS)*100}")%"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
  echo -e "${GREEN}✅ 所有测试通过！${NC}"
  exit 0
else
  echo -e "${RED}❌ 有测试失败，请检查${NC}"
  exit 1
fi
