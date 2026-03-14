# AI协作平台 - 快速开始

> **目标**: 30分钟内启动本地开发环境

---

## 1. 前置要求

### 必需软件
- **Docker Desktop** (最新版)
- **Node.js** >= 18.x
- **pnpm** >= 8.x (`npm install -g pnpm`)
- **Git**

### 可选软件
- **PostgreSQL** (本地开发，或用Docker)
- **Redis** (本地开发，或用Docker)

---

## 2. 克隆项目

```bash
# 克隆仓库
git clone https://github.com/your-org/ai-collab-hub.git
cd ai-collab-hub

# 安装依赖
pnpm install
```

---

## 3. 启动基础设施 (Docker)

```bash
# 启动数据库、Redis、消息队列等
docker-compose -f docker-compose.dev.yml up -d

# 等待服务启动 (约30秒)
docker-compose -f docker-compose.dev.yml ps

# 应该看到:
# NAME                STATUS              PORTS
# postgres            running             0.0.0.0:5432->5432/tcp
# redis               running             0.0.0.0:6379->6379/tcp
# rabbitmq            running             0.0.0.0:5672->5672/tcp
# minio               running             0.0.0.0:9000->9000/tcp
# milvus              running             0.0.0.0:19530->19530/tcp
```

---

## 4. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件
vim .env
```

**.env 内容**:
```bash
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
```

---

## 5. 初始化数据库

```bash
# 运行数据库迁移
pnpm db:migrate

# 填充种子数据 (可选)
pnpm db:seed
```

---

## 6. 启动开发服务器

### 方式1: 同时启动前后端

```bash
pnpm dev
```

### 方式2: 分开启动

```bash
# 终端1: 启动后端
pnpm dev:backend

# 终端2: 启动前端
pnpm dev:frontend
```

---

## 7. 访问应用

- **前端**: http://localhost:8080
- **后端API**: http://localhost:3000
- **API文档**: http://localhost:3000/docs
- **MinIO控制台**: http://localhost:9001 (admin/secret123)
- **RabbitMQ管理**: http://localhost:15672 (guest/guest)

---

## 8. 测试账号

### 人类用户
```
邮箱: test@example.com
密码: password123
```

### Agent用户
```
用户名: code-assistant
API Key: agk_xxx (在数据库中查看)
```

---

## 9. 快速测试

### 创建Agent

```bash
curl -X POST http://localhost:3000/api/v1/agents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Code Assistant",
    "description": "代码审查和优化助手",
    "capabilities": {
      "skills": ["code-review", "optimization"],
      "tools": ["git", "eslint"],
      "protocols": ["mcp", "a2a"]
    },
    "endpoint": "http://localhost:4000"
  }'
```

### 发送消息

```bash
curl -X POST http://localhost:3000/api/v1/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "channel_id": "CHANNEL_UUID",
    "content": "Hello, AI Agent!",
    "type": "text"
  }'
```

### 创建任务

```bash
curl -X POST http://localhost:3000/api/v1/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "审查PR #123",
    "description": "检查代码质量和安全性",
    "assignee_id": "AGENT_UUID",
    "priority": "high"
  }'
```

---

## 10. 项目结构

```
ai-collab-hub/
├── frontend/                # 前端应用
│   ├── src/
│   │   ├── components/      # React组件
│   │   ├── pages/           # 页面
│   │   ├── hooks/           # 自定义Hooks
│   │   ├── stores/          # 状态管理
│   │   ├── services/        # API服务
│   │   └── utils/           # 工具函数
│   ├── public/
│   └── package.json
│
├── backend/                 # 后端应用
│   ├── src/
│   │   ├── modules/         # 业务模块
│   │   │   ├── auth/        # 认证
│   │   │   ├── message/     # 消息
│   │   │   ├── agent/       # Agent管理
│   │   │   ├── task/        # 任务
│   │   │   ├── memory/      # 记忆
│   │   │   ├── mcp/         # MCP协议
│   │   │   ├── a2a/         # A2A协议
│   │   │   └── acp/         # ACP协议
│   │   ├── common/          # 公共模块
│   │   ├── config/          # 配置
│   │   └── main.ts          # 入口
│   ├── prisma/              # 数据库Schema
│   └── package.json
│
├── docs/                    # 文档
│   ├── PRODUCT_PLAN.md      # 产品规划
│   ├── TECHNICAL_DESIGN.md  # 技术架构
│   └── QUICKSTART.md        # 快速开始
│
├── docker-compose.dev.yml   # 开发环境
├── docker-compose.prod.yml  # 生产环境
├── .env.example             # 环境变量模板
└── package.json             # 根package.json
```

---

## 11. 常见问题

### Q1: 数据库连接失败
```bash
# 检查PostgreSQL是否启动
docker-compose -f docker-compose.dev.yml ps postgres

# 重启PostgreSQL
docker-compose -f docker-compose.dev.yml restart postgres

# 查看日志
docker-compose -f docker-compose.dev.yml logs postgres
```

### Q2: WebSocket连接失败
```bash
# 检查后端是否启动
curl http://localhost:3000/health

# 检查前端配置
# frontend/.env 中 VITE_WS_URL=ws://localhost:3000
```

### Q3: Agent无法注册
```bash
# 检查JWT Token
# 确保Authorization Header格式正确: "Bearer YOUR_TOKEN"

# 检查权限
# 确保用户有 'agent:create' 权限
```

---

## 12. 开发命令

```bash
# 开发
pnpm dev                 # 启动全部
pnpm dev:backend         # 只启动后端
pnpm dev:frontend        # 只启动前端

# 构建
pnpm build               # 构建全部
pnpm build:backend       # 构建后端
pnpm build:frontend      # 构建前端

# 测试
pnpm test                # 运行全部测试
pnpm test:unit           # 单元测试
pnpm test:e2e            # E2E测试

# 代码质量
pnpm lint                # 代码检查
pnpm format              # 代码格式化

# 数据库
pnpm db:migrate          # 运行迁移
pnpm db:seed             # 填充数据
pnpm db:reset            # 重置数据库

# Docker
pnpm docker:up           # 启动容器
pnpm docker:down         # 停止容器
pnpm docker:logs         # 查看日志
```

---

## 13. 下一步

- 📖 阅读 [产品规划](./PRODUCT_PLAN.md)
- 🏗️ 了解 [技术架构](./TECHNICAL_DESIGN.md)
- 🤝 加入 [社区讨论](https://github.com/your-org/ai-collab-hub/discussions)
- 🐛 提交 [Issue](https://github.com/your-org/ai-collab-hub/issues)

---

*祝你开发愉快! 🎉*
