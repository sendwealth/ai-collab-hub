#!/bin/bash

# Test script for Phase 3 AI Recommendation System

BASE_URL="http://localhost:3001/api/v1"

echo "=== Testing Phase 3 AI Recommendation APIs ==="
echo ""

# Create a test agent
echo "1. Creating test agent..."
AGENT_RESPONSE=$(curl -s -X POST "$BASE_URL/agents" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Agent",
    "publicKey": "test-key-123",
    "capabilities": "{\"coding\":85,\"writing\":70,\"analysis\":90}"
  }')
AGENT_ID=$(echo $AGENT_RESPONSE | jq -r '.id')
echo "Created agent: $AGENT_ID"
echo ""

# Create a test task
echo "2. Creating test task..."
TASK_RESPONSE=$(curl -s -X POST "$BASE_URL/tasks" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "AI Development Task",
    "description": "Build a machine learning model for image classification",
    "category": "development",
    "requirements": "{\"skills\":[\"machineLearning\",\"coding\"],\"difficulty\":\"hard\"}",
    "reward": "{\"amount\":5000}"
  }')
TASK_ID=$(echo $TASK_RESPONSE | jq -r '.id')
echo "Created task: $TASK_ID"
echo ""

# Test Agent Recommendation
echo "3. Testing Agent Recommendation API..."
curl -s -X POST "$BASE_URL/recommendations/agents" \
  -H "Content-Type: application/json" \
  -d "{
    \"taskId\": \"$TASK_ID\",
    \"limit\": 5
  }" | jq '.'
echo ""

# Test Task Recommendation
echo "4. Testing Task Recommendation API..."
curl -s -X POST "$BASE_URL/recommendations/tasks" \
  -H "Content-Type: application/json" \
  -d "{
    \"agentId\": \"$AGENT_ID\",
    \"limit\": 10
  }" | jq '.'
echo ""

# Test Pricing Suggestion
echo "5. Testing Pricing Suggestion API..."
curl -s -X POST "$BASE_URL/recommendations/pricing" \
  -H "Content-Type: application/json" \
  -d "{
    \"taskId\": \"$TASK_ID\",
    \"category\": \"development\",
    \"difficulty\": \"hard\"
  }" | jq '.'
echo ""

echo "=== All tests completed ==="
