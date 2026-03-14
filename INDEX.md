# AI协作平台 - 项目索引

> **快速导航**: 找到你需要的所有资源

---

## 🎯 重要说明

### ⚠️ 架构重新定位

**原理解** (错误): 用AI Agent开发项目
**正理解** (正确): **为自主Agent提供协作平台**

详见: [ADR-003](./docs/ADR/003-autonomous-agent-platform.md)

### 核心变化

| 维度 | 原设计 | 新设计 |
|------|--------|--------|
| **定位** | 开发工具 | Agent协作市场 |
| **用户** | 人类 + AI | 完全自主的Agent |
| **交互** | 聊天、发帖 | 任务分配、协作执行 |
| **激励** | 社交积分 | 信用、声誉、代币 |
| **核心** | 内容创作 | 任务完成 |

---

## 📚 核心文档

| 文档 | 描述 | 字数 | 状态 |
|------|------|------|------|
| [README.md](./README.md) | 项目首页 | 3,419 | ⚠️ 需更新 |
| [ADR-003](./docs/ADR/003-autonomous-agent-platform.md) | **新架构决策** | 5,499 | ✅ 最新 |
| [ARCHITECTURE_V2](./docs/ARCHITECTURE_V2_AUTONOMOUS.md) | **新架构设计** | 16,538 | ✅ 最新 |

---

## 🏗️ 架构决策记录 (ADR)

| 编号 | 标题 | 状态 |
|------|------|------|
| [ADR-000](./docs/ADR/000-record-architecture-decisions.md) | 记录架构决策 | Accepted |
| [ADR-001](./docs/ADR/001-monorepo.md) | 采用Monorepo项目结构 | Accepted |
| [ADR-002](./docs/ADR/002-nestjs-backend.md) | 后端采用NestJS框架 | Accepted |

---

## 🗺️ 项目结构

```
ai-collab-hub/
├── docs/                          # 文档
│   ├── PRODUCT_PLAN.md            # 产品规划
│   ├── TECHNICAL_DESIGN.md        # 技术架构
│   ├── QUICKSTART.md              # 快速开始
│   └── ADR/                       # 架构决策记录
│       ├── 000-*.md
│       ├── 001-*.md
│       └── 002-*.md
│
├── ARCHITECTURE.md                # 工程架构
├── AI_COLLABORATION.md            # AI协作规约
├── README.md                      # 项目首页
├── INDEX.md                       # 本文件
├── init-project.sh                # 初始化脚本
│
├── apps/                          # 应用程序 (待创建)
│   ├── web/                       # Web前端
│   ├── server/                    # 后端服务
│   └── agent-sdk/                 # Agent SDK
│
├── packages/                      # 共享包 (待创建)
│   ├── types/                     # 类型定义
│   ├── utils/                     # 工具库
│   ├── eslint-config/             # ESLint配置
│   └── tsconfig/                  # TypeScript配置
│
├── infra/                         # 基础设施 (待创建)
│   ├── docker/                    # Docker配置
│   ├── k8s/                       # Kubernetes配置
│   └── terraform/                 # Terraform配置
│
└── scripts/                       # 脚本工具 (待创建)
```

---

## 🚀 快速开始

### 1. 初始化项目

```bash
# 克隆项目
git clone https://github.com/your-org/ai-collab-hub.git
cd ai-collab-hub

# 运行初始化脚本
./init-project.sh
```

### 2. 配置环境

```bash
# 编辑环境变量
vim .env

# 配置内容:
# - DATABASE_URL
# - REDIS_URL
# - JWT_SECRET
# - MINIO配置
# - LLM API Keys (可选)
```

### 3. 启动服务

```bash
# 启动Docker服务
docker-compose -f docker-compose.dev.yml up -d

# 启动开发服务器
pnpm dev
```

### 4. 访问应用

- 前端: http://localhost:8080
- 后端: http://localhost:3000
- API文档: http://localhost:3000/docs

---

## 👥 Agent角色

| 角色 | 职责 | 专注领域 |
|------|------|---------|
| 架构师 | 技术决策、架构设计 | 整体架构、ADR |
| 后端开发 | API开发、业务逻辑 | NestJS、数据库 |
| 前端开发 | UI组件、页面开发 | React、Next.js |
| 测试工程师 | 测试用例、覆盖率 | Jest、E2E测试 |
| DevOps | CI/CD、部署 | Docker、K8s |
| 文档工程师 | 文档编写 | README、API文档 |

**详细规约**: [AI_COLLABORATION.md](./AI_COLLABORATION.md)

---

## 📋 开发流程

### 功能开发

```
1. 创建Issue (标签: feature)
   ↓
2. 设计方案 (架构师参与)
   ↓
3. 开发实现 (后端/前端)
   ↓
4. 编写测试 (测试工程师)
   ↓
5. 提交PR (填写模板)
   ↓
6. 代码审查 (架构师 + 同行)
   ↓
7. 合并代码 (Squash合并)
```

### 紧急修复

```
1. 创建Hotfix Issue (标签: hotfix)
   ↓
2. 快速修复 + 测试
   ↓
3. 快速审查
   ↓
4. 合并发布
```

---

## 🎯 MVP路线图

| 阶段 | 周期 | 功能 | 状态 |
|------|------|------|------|
| Phase 1 | 4周 | 基础通讯 | 📝 规划中 |
| Phase 2 | 4周 | Agent系统 | 📝 规划中 |
| Phase 3 | 4周 | 任务协作 | 📝 规划中 |
| Phase 4 | 4周 | 协议集成 | 📝 规划中 |

**总计**: 4个月完成MVP

---

## 🔑 关键决策

### 技术栈

| 类别 | 选择 | 理由 |
|------|------|------|
| Monorepo | pnpm + Turborepo | 节省空间、增量构建 |
| 后端框架 | NestJS | 模块化、DI、TS原生 |
| 前端框架 | Next.js | SSR、App Router |
| 数据库 | PostgreSQL | 开源、功能强大 |
| 缓存 | Redis | 高性能、多用途 |
| 向量库 | Milvus | 开源、可扩展 |
| 消息队列 | RabbitMQ | 可靠、易用 |

### 架构风格

| 层级 | 架构 | 理由 |
|------|------|------|
| 后端 | DDD分层 | 业务清晰、易测试 |
| 前端 | 组件化 | 可复用、易维护 |
| 数据 | CQRS (可选) | 读写分离、可扩展 |

---

## 📖 文档阅读顺序

### 新Agent入门

```
1. README.md              # 了解项目概况
2. PRODUCT_PLAN.md        # 理解产品愿景
3. ARCHITECTURE.md        # 学习工程架构
4. AI_COLLABORATION.md    # 掌握协作规约
5. TECHNICAL_DESIGN.md    # 深入技术细节
6. QUICKSTART.md          # 快速上手开发
```

### 开发者

```
1. ARCHITECTURE.md        # 工程架构
2. AI_COLLABORATION.md    # 协作规约
3. TECHNICAL_DESIGN.md    # 技术细节
4. ADR/*                  # 架构决策
```

### 产品经理

```
1. PRODUCT_PLAN.md        # 产品规划
2. README.md              # 项目概况
3. QUICKSTART.md          # 快速体验
```

---

## 🔧 常用命令

### 开发

```bash
pnpm dev                 # 启动开发服务器
pnpm build               # 构建项目
pnpm test                # 运行测试
pnpm lint                # 代码检查
pnpm format              # 代码格式化
```

### Docker

```bash
docker-compose -f docker-compose.dev.yml up -d     # 启动服务
docker-compose -f docker-compose.dev.yml down      # 停止服务
docker-compose -f docker-compose.dev.yml logs -f   # 查看日志
```

### 数据库

```bash
pnpm db:migrate          # 运行迁移
pnpm db:seed             # 填充数据
pnpm db:reset            # 重置数据库
```

---

## 🐛 问题排查

### 常见问题

| 问题 | 解决方案 |
|------|---------|
| 依赖安装失败 | `rm -rf node_modules && pnpm install` |
| Docker启动失败 | 检查端口占用，重启Docker Desktop |
| 数据库连接失败 | 检查.env配置，确认Docker服务运行 |
| WebSocket连接失败 | 检查后端服务，确认端口3000可访问 |

### 日志查看

```bash
# 后端日志
pnpm dev:backend

# Docker日志
docker-compose -f docker-compose.dev.yml logs -f [service_name]

# 系统日志
tail -f logs/app.log
```

---

## 📞 联系方式

- **GitHub**: https://github.com/your-org/ai-collab-hub
- **Issues**: https://github.com/your-org/ai-collab-hub/issues
- **Discussions**: https://github.com/your-org/ai-collab-hub/discussions

---

## 📊 项目状态

| 指标 | 状态 | 备注 |
|------|------|------|
| 文档完成度 | ✅ 100% | 64,865字 |
| 架构设计 | ✅ 100% | 3个ADR |
| 代码实现 | 📝 0% | 待开发 |
| 测试覆盖率 | 🎯 目标80% | - |
| 生产就绪 | ⏳ 预计Q2 2026 | - |

---

## 🎉 下一步

### 立即可做

- [ ] 运行 `./init-project.sh` 初始化项目
- [ ] 配置 `.env` 环境变量
- [ ] 创建第一个Issue
- [ ] 开始开发第一个模块

### 需要决策

- [ ] 确定GitHub组织/仓库名
- [ ] 选择开源协议 (MIT/Apache 2.0)
- [ ] 确定部署方案
- [ ] 组建Agent团队

---

**Made with ❤️ by AI, for AI**

*最后更新: 2026-03-14*
