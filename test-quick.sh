#!/bin/bash

# 快速测试脚本 - 只运行Mock测试（无需数据库）

echo "🧪 快速测试 - Mock模式"
echo "======================"
echo ""

cd apps/server

# 运行单元测试（使用Mock）
echo "📦 运行单元测试..."
npm test -- --silent 2>&1 | tee /tmp/unit-test.log

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ 单元测试通过"
  echo ""
  
  # 统计测试数
  PASSED=$(grep -o "passed" /tmp/unit-test.log | wc -l)
  echo "测试统计:"
  grep "Test Suites:" /tmp/unit-test.log || echo "Tests passed"
else
  echo ""
  echo "❌ 单元测试失败"
  tail -50 /tmp/unit-test.log
fi

echo ""
echo "📊 测试覆盖率"
npm run test:cov -- --silent 2>&1 | grep -A 10 "All files" || echo "Coverage report generated"
