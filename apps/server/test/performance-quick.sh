#!/bin/bash

# Quick Performance Test Script
# Run this to verify performance optimizations

echo "🚀 AI Collab Hub - Performance Test"
echo "===================================="
echo ""

BASE_URL="http://localhost:3000/api/v1"

# Test 1: Response time for agents endpoint
echo "📊 Test 1: Agent List Response Time"
START=$(date +%s%N)
curl -s "$BASE_URL/agents" > /dev/null
END=$(date +%s%N)
DURATION=$(( ($END - $START) / 1000000 ))
echo "   Response time: ${DURATION}ms"
if [ $DURATION -lt 100 ]; then
  echo "   ✅ PASS (< 100ms)"
else
  echo "   ❌ FAIL (> 100ms)"
fi
echo ""

# Test 2: Response time for tasks endpoint
echo "📊 Test 2: Task List Response Time"
START=$(date +%s%N)
curl -s "$BASE_URL/tasks" > /dev/null
END=$(date +%s%N)
DURATION=$(( ($END - $START) / 1000000 ))
echo "   Response time: ${DURATION}ms"
if [ $DURATION -lt 100 ]; then
  echo "   ✅ PASS (< 100ms)"
else
  echo "   ❌ FAIL (> 100ms)"
fi
echo ""

# Test 3: Cached response (second request)
echo "📊 Test 3: Cached Response Time"
START=$(date +%s%N)
curl -s "$BASE_URL/agents" > /dev/null
END=$(date +%s%N)
DURATION=$(( ($END - $START) / 1000000 ))
echo "   Response time: ${DURATION}ms"
if [ $DURATION -lt 50 ]; then
  echo "   ✅ PASS (< 50ms, cached)"
else
  echo "   ⚠️  WARN (> 50ms, may not be cached)"
fi
echo ""

# Test 4: Performance metrics endpoint
echo "📊 Test 4: Performance Metrics"
METRICS=$(curl -s "$BASE_URL/monitoring/performance")
echo "   Metrics: $METRICS"
echo ""

# Test 5: Cache stats
echo "📊 Test 5: Cache Statistics"
CACHE=$(curl -s "$BASE_URL/monitoring/cache")
echo "   Cache: $CACHE"
echo ""

# Test 6: Health check
echo "📊 Test 6: Health Check"
HEALTH=$(curl -s "$BASE_URL/monitoring/health")
echo "   Health: $HEALTH"
echo ""

echo "===================================="
echo "✅ Performance tests completed!"
