#!/bin/bash

# Phase 3 Verification Script

echo "=== Phase 3 AI Recommendation System Verification ==="
echo ""

# Check backend build
echo "1. Checking backend build..."
cd apps/server
if npm run build > /dev/null 2>&1; then
  echo "✅ Backend builds successfully"
else
  echo "❌ Backend build failed"
  exit 1
fi
cd ../..

# Check database migration
echo ""
echo "2. Checking database migration..."
cd apps/server
if [ -f "prisma/dev.db" ]; then
  echo "✅ Database exists"
else
  echo "❌ Database not found"
  exit 1
fi
cd ../..

# Check recommendation module files
echo ""
echo "3. Checking recommendation module files..."
files=(
  "apps/server/src/modules/recommendations/recommendations.module.ts"
  "apps/server/src/modules/recommendations/recommendations.service.ts"
  "apps/server/src/modules/recommendations/recommendations.controller.ts"
  "apps/server/src/modules/recommendations/dto/recommendations.dto.ts"
)

all_found=true
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ $file"
  else
    echo "❌ $file not found"
    all_found=false
  fi
done

if [ "$all_found" = false ]; then
  exit 1
fi

# Check frontend components
echo ""
echo "4. Checking frontend components..."
components=(
  "apps/web/src/components/Recommendations/AgentRecommendations.tsx"
  "apps/web/src/components/Recommendations/TaskRecommendations.tsx"
  "apps/web/src/components/PricingTool/PricingTool.tsx"
)

all_found=true
for component in "${components[@]}"; do
  if [ -f "$component" ]; then
    echo "✅ $component"
  else
    echo "❌ $component not found"
    all_found=false
  fi
done

if [ "$all_found" = false ]; then
  exit 1
fi

# Check test files
echo ""
echo "5. Checking test files..."
if [ -f "apps/server/test/recommendations.service.spec.ts" ]; then
  echo "✅ Unit tests exist"
else
  echo "❌ Unit tests not found"
  exit 1
fi

# Check documentation
echo ""
echo "6. Checking documentation..."
if [ -f "PHASE3_README.md" ]; then
  echo "✅ Documentation exists"
else
  echo "❌ Documentation not found"
  exit 1
fi

# Check Prisma schema
echo ""
echo "7. Checking Prisma schema for new models..."
if grep -q "AgentCapability" apps/server/prisma/schema.prisma && \
   grep -q "AgentPerformance" apps/server/prisma/schema.prisma && \
   grep -q "RecommendationLog" apps/server/prisma/schema.prisma && \
   grep -q "PriceHistory" apps/server/prisma/schema.prisma && \
   grep -q "MarketTrend" apps/server/prisma/schema.prisma; then
  echo "✅ All Phase 3 database models exist"
else
  echo "❌ Some database models missing"
  exit 1
fi

# Check app.module.ts
echo ""
echo "8. Checking app.module.ts integration..."
if grep -q "RecommendationsModule" apps/server/src/app.module.ts; then
  echo "✅ RecommendationsModule integrated"
else
  echo "❌ RecommendationsModule not integrated"
  exit 1
fi

echo ""
echo "=== ✅ All Verification Checks Passed! ==="
echo ""
echo "Phase 3 is ready for testing!"
echo ""
echo "Next steps:"
echo "1. Start the server: cd apps/server && npm run start:dev"
echo "2. Run test script: ./test-recommendations.sh"
echo "3. Check API documentation: http://localhost:3001/api"
