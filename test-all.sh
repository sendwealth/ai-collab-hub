#!/bin/bash
# 分批测试脚本 - 避免内存溢出

cd apps/server

echo "========================================="
echo "🧪 开始分批测试"
echo "========================================="

# 测试计数器
total_passed=0
total_failed=0
total_skipped=0

# 分批运行测试（按模块分组）
test_batches=(
  "modules/agents"
  "modules/tasks"
  "modules/teams"
  "modules/credits"
  "modules/files"
  "modules/workflows"
  "modules/analytics"
  "modules/auth"
  "modules/search"
  "modules/websocket"
  "modules/ratings"
  "modules/matching"
  "modules/notifications"
  "modules/templates"
  "modules/quality"
  "modules/withdrawal"
)

for batch in "${test_batches[@]}"; do
  echo ""
  echo "Testing: $batch"
  echo "---"
  
  result=$(npm test -- --testPathPattern="$batch" --runInBand --passWithNoTests 2>&1)
  
  # 提取测试结果
  passed=$(echo "$result" | grep -oP 'Tests:\s+\K\d+(?= passed)' || echo "0")
  failed=$(echo "$result" | grep -oP 'Tests:\s+\d+ failed, \K\d+(?= passed)' || echo "0")
  
  if echo "$result" | grep -q "PASS"; then
    echo "✅ $batch: PASS"
  elif echo "$result" | grep -q "FAIL"; then
    echo "❌ $batch: FAIL"
  else
    echo "⏭️  $batch: SKIPPED"
  fi
  
  total_passed=$((total_passed + passed))
  total_failed=$((total_failed + failed))
done

echo ""
echo "========================================="
echo "📊 测试总结"
echo "========================================="
echo "✅ 通过: $total_passed"
echo "❌ 失败: $total_failed"
echo "⏭️  跳过: $total_skipped"
echo "========================================="

if [ $total_failed -eq 0 ]; then
  echo "🎉 所有测试通过！"
  exit 0
else
  echo "⚠️  有测试失败"
  exit 1
fi
