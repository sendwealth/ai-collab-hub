#!/bin/bash

# AI协作平台 - 项目初始化脚本
# 用法: ./init-project.sh

set -e

echo "🚀 AI协作平台 - 项目初始化"
echo "================================"

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查依赖
echo -e "${BLUE}[1/8] 检查依赖...${NC}"

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Node.js未安装，请先安装Node.js >= 18${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${YELLOW}Node.js版本过低，需要 >= 18，当前: $(node -v)${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v)${NC}"

# 检查pnpm
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}pnpm未安装，正在安装...${NC}"
    npm install -g pnpm
fi
echo -e "${GREEN}✓ pnpm $(pnpm -v)${NC}"

# 检查Docker
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Docker未安装，部分功能可能受限${NC}"
else
    echo -e "${GREEN}✓ Docker $(docker --version)${NC}"
fi

# 安装依赖
echo -e "${BLUE}[2/8] 安装依赖...${NC}"
pnpm install
echo -e "${GREEN}✓ 依赖安装完成${NC}"

# 创建环境变量文件
echo -e "${BLUE}[3/8] 创建环境变量文件...${NC}"
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${GREEN}✓ .env文件已创建${NC}"
    echo -e "${YELLOW}  请编辑 .env 文件配置环境变量${NC}"
else
    echo -e "${GREEN}✓ .env文件已存在${NC}"
fi

# 创建必要的目录
echo -e "${BLUE}[4/8] 创建目录结构...${NC}"
mkdir -p apps/web/src/{components,hooks,stores,services,utils,types}
mkdir -p apps/server/src/{modules,common,config,database,infrastructure}
mkdir -p apps/agent-sdk/src/{client,protocols,utils}
mkdir -p packages/types/src
mkdir -p packages/utils/src
mkdir -p docs/{architecture,api,guides,deployment}
mkdir -p infra/{docker,k8s,terraform}
mkdir -p scripts
mkdir -p .github/workflows
echo -e "${GREEN}✓ 目录结构创建完成${NC}"

# 生成package.json文件
echo -e "${BLUE}[5/8] 生成配置文件...${NC}"

# 根package.json
if [ ! -f package.json ]; then
cat > package.json << 'EOF'
{
  "name": "ai-collab-hub",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "format": "prettier --write \"**/*.{ts,tsx,md}\""
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "eslint": "^8.56.0",
    "prettier": "^3.2.0",
    "turbo": "^1.12.0",
    "typescript": "^5.3.0"
  },
  "packageManager": "pnpm@8.15.0"
}
EOF
    echo -e "${GREEN}✓ package.json已创建${NC}"
fi

# pnpm-workspace.yaml
if [ ! -f pnpm-workspace.yaml ]; then
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'apps/*'
  - 'packages/*'
EOF
    echo -e "${GREEN}✓ pnpm-workspace.yaml已创建${NC}"
fi

# turbo.json
if [ ! -f turbo.json ]; then
cat > turbo.json << 'EOF'
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": []
    },
    "lint": {
      "outputs": []
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
EOF
    echo -e "${GREEN}✓ turbo.json已创建${NC}"
fi

# .gitignore
if [ ! -f .gitignore ]; then
cat > .gitignore << 'EOF'
# Dependencies
node_modules
.pnpm-store

# Build
dist
.next
build

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode
.idea
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Testing
coverage
.nyc_output

# Misc
.turbo
EOF
    echo -e "${GREEN}✓ .gitignore已创建${NC}"
fi

# .env.example
if [ ! -f .env.example ]; then
cat > .env.example << 'EOF'
# 数据库
DATABASE_URL=postgresql://admin:secret@localhost:5432/ai_collab

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=24h

# 文件存储
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=admin
MINIO_SECRET_KEY=secret123
MINIO_BUCKET=ai-collab

# 向量数据库
MILVUS_HOST=localhost
MILVUS_PORT=19530

# LLM (可选)
OPENAI_API_KEY=sk-xxx
DEEPSEEK_API_KEY=sk-xxx
EOF
    echo -e "${GREEN}✓ .env.example已创建${NC}"
fi

# docker-compose.dev.yml
if [ ! -f docker-compose.dev.yml ]; then
cat > docker-compose.dev.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ai_collab
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: secret
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: admin
      MINIO_ROOT_PASSWORD: secret123
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data

volumes:
  postgres_data:
  minio_data:
EOF
    echo -e "${GREEN}✓ docker-compose.dev.yml已创建${NC}"
fi

# 初始化Git
echo -e "${BLUE}[6/8] 初始化Git仓库...${NC}"
if [ ! -d .git ]; then
    git init
    echo -e "${GREEN}✓ Git仓库已初始化${NC}"
else
    echo -e "${GREEN}✓ Git仓库已存在${NC}"
fi

# 启动Docker服务（可选）
echo -e "${BLUE}[7/8] 检查Docker服务...${NC}"
if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    read -p "是否启动Docker服务？(y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose -f docker-compose.dev.yml up -d
        echo -e "${GREEN}✓ Docker服务已启动${NC}"
        echo -e "${YELLOW}  等待服务就绪...${NC}"
        sleep 5
    else
        echo -e "${YELLOW}  跳过Docker服务启动${NC}"
    fi
else
    echo -e "${YELLOW}  Docker未安装，跳过${NC}"
fi

# 完成
echo -e "${BLUE}[8/8] 初始化完成！${NC}"
echo ""
echo -e "${GREEN}✅ 项目初始化成功！${NC}"
echo ""
echo "📋 下一步："
echo "  1. 编辑 .env 文件配置环境变量"
echo "  2. 运行 'pnpm dev' 启动开发服务器"
echo "  3. 访问 http://localhost:8080"
echo ""
echo "📚 文档："
echo "  - 产品规划: docs/PRODUCT_PLAN.md"
echo "  - 技术架构: docs/TECHNICAL_DESIGN.md"
echo "  - 工程架构: ARCHITECTURE.md"
echo "  - AI协作: AI_COLLABORATION.md"
echo ""
echo "🐳 Docker服务："
echo "  - PostgreSQL: localhost:5432"
echo "  - Redis: localhost:6379"
echo "  - MinIO: http://localhost:9001 (admin/secret123)"
echo ""
