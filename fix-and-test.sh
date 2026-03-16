#!/bin/bash

# E2E测试快速修复脚本
# 用途: 修复Auth模块编译错误，启动服务，执行E2E测试

set -e

PROJECT_ROOT="/Users/rowan/clawd/projects/ai-collab-hub"
SERVER_DIR="$PROJECT_ROOT/apps/server"

echo "🔧 E2E测试快速修复脚本"
echo "======================="
echo ""

# Step 1: 安装缺失依赖
echo "📦 Step 1: 安装缺失依赖..."
cd "$SERVER_DIR"

pnpm add @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt uuid
pnpm add -D @types/passport-jwt @types/bcrypt @types/uuid

echo "✅ 依赖安装完成"
echo ""

# Step 2: 创建User模型
echo "📊 Step 2: 检查User模型..."
USER_MODEL_EXISTS=$(grep -c "model User" prisma/schema.prisma || true)

if [ "$USER_MODEL_EXISTS" -eq 0 ]; then
    echo "添加User模型到schema.prisma..."
    
    cat >> prisma/schema.prisma << 'EOF'

// Human User Model for Web UI authentication
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  name      String
  role      String   @default("user") // user, admin, publisher
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}
EOF
    
    echo "✅ User模型已添加"
else
    echo "✅ User模型已存在"
fi

echo ""

# Step 3: 运行数据库迁移
echo "🔄 Step 3: 运行数据库迁移..."
pnpm prisma generate
pnpm prisma migrate dev --name add_user_model --create-only

echo "✅ 迁移文件已创建"
echo "⚠️  请手动检查迁移文件后运行: pnpm prisma migrate dev"
echo ""

# Step 4: 提示手动修复
echo "📝 Step 4: 需要手动修复的文件"
echo "================================"
echo ""
echo "1. 更新 apps/server/src/modules/auth/auth.service.ts"
echo "   将所有 prisma.agent 改为 prisma.user"
echo "   示例:"
echo "   - prisma.agent.findUnique({ where: { email } })"
echo "   + prisma.user.findUnique({ where: { email } })"
echo ""
echo "2. 更新 bcrypt 导入"
echo "   - import * as bcrypt from 'bcrypt';"
echo "   + import * as bcrypt from 'bcryptjs';"
echo ""
echo "3. 安装JWT配置"
echo "   在 .env 文件中添加:"
echo "   JWT_SECRET=your-secret-key-here"
echo "   JWT_EXPIRES_IN=7d"
echo ""

# Step 5: 创建快速修复指南
cat > "$PROJECT_ROOT/QUICK_FIX_GUIDE.md" << 'EOF'
# 快速修复指南

## 目标
修复Auth模块编译错误，启动后端服务

## 步骤

### 1. 已完成 ✅
- [x] 安装依赖包
- [x] 创建User模型
- [x] 生成Prisma Client

### 2. 待手动完成 ⏸️

#### 2.1 更新 auth.service.ts
```bash
# 文件: apps/server/src/modules/auth/auth.service.ts
# 全局替换:
prisma.agent → prisma.user
'bcrypt' → 'bcryptjs'
```

#### 2.2 添加JWT配置
```bash
# 文件: apps/server/.env
# 添加:
JWT_SECRET="your-secret-key-change-in-production"
JWT_EXPIRES_IN="7d"
```

#### 2.3 运行迁移
```bash
cd apps/server
pnpm prisma migrate dev
```

#### 2.4 启动服务
```bash
cd apps/server
pnpm dev
```

### 3. 验证 ✅
```bash
# 测试API
curl http://localhost:3000/api/v1/health

# 运行测试
cd apps/server
pnpm test:e2e
```

## 预计时间
- 手动修复: 15-30分钟
- 测试验证: 10分钟
- 总计: 30-40分钟

## 完成后
执行完整E2E测试:
```bash
cd /Users/rowan/clawd/projects/ai-collab-hub
bash integration-test.sh
```
EOF

echo "✅ 快速修复指南已创建: QUICK_FIX_GUIDE.md"
echo ""

echo "======================="
echo "✅ 自动修复完成!"
echo ""
echo "📖 下一步:"
echo "   1. 阅读 QUICK_FIX_GUIDE.md"
echo "   2. 完成手动修复步骤"
echo "   3. 运行: cd apps/server && pnpm dev"
echo "   4. 执行E2E测试"
echo ""
echo "⏱️  预计修复时间: 30-40分钟"
