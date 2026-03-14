# 工程架构设计

> **原则**: 最佳实践、AI协作友好、可维护性优先

---

## 1. 架构原则

### 1.1 核心原则

```yaml
1. 模块化 (Modularity):
   - 单一职责
   - 高内聚低耦合
   - 明确的模块边界

2. 分层架构 (Layered Architecture):
   - 表现层 (Presentation)
   - 应用层 (Application)
   - 领域层 (Domain)
   - 基础设施层 (Infrastructure)

3. 约定优于配置 (Convention over Configuration):
   - 统一的目录结构
   - 标准的命名规范
   - 默认行为可预测

4. 防腐层 (Anti-Corruption Layer):
   - 外部依赖隔离
   - 领域模型保护
   - 适配器模式

5. 渐进式复杂度 (Progressive Complexity):
   - 简单场景简单实现
   - 复杂场景按需扩展
   - 避免过度设计
```

### 1.2 AI协作友好设计

```yaml
1. 文档驱动:
   - 每个模块必须有README
   - API必须有注释
   - 关键决策记录ADR (Architecture Decision Records)

2. 类型安全:
   - TypeScript严格模式
   - 避免any类型
   - 接口优于实现

3. 单元测试优先:
   - 每个模块必须有测试
   - 测试覆盖率 > 80%
   - TDD优先

4. 代码生成友好:
   - 标准化的代码结构
   - 模板化的组件/模块
   - CLI脚手架工具

5. 错误处理标准化:
   - 统一错误码
   - 标准错误格式
   - 错误追踪ID
```

---

## 2. 目录结构

### 2.1 Monorepo结构

```
ai-collab-hub/
├── apps/                          # 应用程序
│   ├── web/                       # Web前端
│   │   ├── src/
│   │   │   ├── app/               # Next.js App Router
│   │   │   ├── components/        # 组件
│   │   │   │   ├── ui/            # 基础UI组件
│   │   │   │   ├── business/      # 业务组件
│   │   │   │   └── layout/        # 布局组件
│   │   │   ├── hooks/             # 自定义Hooks
│   │   │   ├── stores/            # 状态管理
│   │   │   ├── services/          # API服务
│   │   │   ├── utils/             # 工具函数
│   │   │   └── types/             # 类型定义
│   │   ├── public/
│   │   ├── tests/
│   │   ├── next.config.js
│   │   ├── tailwind.config.js
│   │   └── package.json
│   │
│   ├── server/                    # 后端服务
│   │   ├── src/
│   │   │   ├── modules/           # 业务模块
│   │   │   │   ├── auth/          # 认证模块
│   │   │   │   ├── message/       # 消息模块
│   │   │   │   ├── agent/         # Agent模块
│   │   │   │   ├── task/          # 任务模块
│   │   │   │   ├── memory/        # 记忆模块
│   │   │   │   ├── mcp/           # MCP协议
│   │   │   │   ├── a2a/           # A2A协议
│   │   │   │   └── acp/           # ACP协议
│   │   │   ├── common/            # 公共模块
│   │   │   │   ├── decorators/    # 装饰器
│   │   │   │   ├── filters/       # 过滤器
│   │   │   │   ├── guards/        # 守卫
│   │   │   │   ├── interceptors/  # 拦截器
│   │   │   │   ├── pipes/         # 管道
│   │   │   │   └── utils/         # 工具
│   │   │   ├── config/            # 配置
│   │   │   ├── database/          # 数据库
│   │   │   │   ├── migrations/    # 迁移文件
│   │   │   │   ├── seeds/         # 种子数据
│   │   │   │   └── prisma/        # Prisma Schema
│   │   │   ├── infrastructure/    # 基础设施
│   │   │   │   ├── cache/         # 缓存
│   │   │   │   ├── queue/         # 消息队列
│   │   │   │   ├── storage/       # 对象存储
│   │   │   │   └── search/        # 搜索引擎
│   │   │   └── main.ts            # 入口
│   │   ├── tests/
│   │   ├── nest-cli.json
│   │   └── package.json
│   │
│   └── agent-sdk/                 # Agent SDK
│       ├── src/
│       │   ├── client/            # 客户端
│       │   ├── protocols/         # 协议实现
│       │   ├── utils/             # 工具
│       │   └── index.ts           # 导出
│       ├── tests/
│       └── package.json
│
├── packages/                      # 共享包
│   ├── types/                     # 类型定义
│   │   ├── src/
│   │   │   ├── auth.ts
│   │   │   ├── message.ts
│   │   │   ├── agent.ts
│   │   │   ├── task.ts
│   │   │   ├── memory.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── utils/                     # 共享工具
│   │   ├── src/
│   │   │   ├── logger.ts
│   │   │   ├── validator.ts
│   │   │   ├── crypto.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── eslint-config/             # ESLint配置
│   │   ├── base.js
│   │   ├── react.js
│   │   ├── node.js
│   │   └── package.json
│   │
│   └── tsconfig/                  # TypeScript配置
│       ├── base.json
│       ├── react.json
│       ├── node.json
│       └── package.json
│
├── docs/                          # 文档
│   ├── architecture/              # 架构文档
│   │   ├── ARCHITECTURE.md        # 工程架构
│   │   ├── ADR/                   # 架构决策记录
│   │   │   ├── 001-monorepo.md
│   │   │   ├── 002-nestjs.md
│   │   │   └── 003-nextjs.md
│   │   └── diagrams/              # 架构图
│   ├── api/                       # API文档
│   ├── guides/                    # 开发指南
│   └── deployment/                # 部署文档
│
├── infra/                         # 基础设施代码
│   ├── docker/                    # Docker配置
│   │   ├── Dockerfile.backend
│   │   ├── Dockerfile.frontend
│   │   └── docker-compose.yml
│   ├── k8s/                       # Kubernetes配置
│   │   ├── deployments/
│   │   ├── services/
│   │   ├── configmaps/
│   │   └── secrets/
│   └── terraform/                 # Terraform配置
│       ├── modules/
│       └── environments/
│
├── scripts/                       # 脚本工具
│   ├── setup.sh                   # 初始化脚本
│   ├── generate-module.sh         # 生成模块
│   ├── generate-component.sh      # 生成组件
│   └── ci-check.sh                # CI检查
│
├── .github/                       # GitHub配置
│   ├── workflows/                 # GitHub Actions
│   │   ├── ci.yml
│   │   ├── test.yml
│   │   └── deploy.yml
│   ├── ISSUE_TEMPLATE/
│   └── PULL_REQUEST_TEMPLATE.md
│
├── pnpm-workspace.yaml            # pnpm工作空间
├── turbo.json                     # Turborepo配置
├── .gitignore
├── .eslintrc.js
├── .prettierrc
├── LICENSE
├── README.md
└── package.json
```

---

## 3. 模块化设计

### 3.1 后端模块结构（NestJS）

每个模块遵循DDD分层：

```
modules/
└── message/                      # 消息模块示例
    ├── domain/                   # 领域层
    │   ├── entities/             # 实体
    │   │   ├── message.entity.ts
    │   │   └── channel.entity.ts
    │   ├── value-objects/        # 值对象
    │   │   └── message-content.vo.ts
    │   ├── events/               # 领域事件
    │   │   └── message-sent.event.ts
    │   ├── repositories/         # 仓储接口
    │   │   ├── message.repository.interface.ts
    │   │   └── channel.repository.interface.ts
    │   └── services/             # 领域服务
    │       └── message-validator.service.ts
    │
    ├── application/              # 应用层
    │   ├── use-cases/            # 用例
    │   │   ├── send-message.use-case.ts
    │   │   ├── get-messages.use-case.ts
    │   │   └── delete-message.use-case.ts
    │   ├── dto/                  # 数据传输对象
    │   │   ├── send-message.dto.ts
    │   │   └── message-response.dto.ts
    │   ├── mappers/              # 映射器
    │   │   └── message.mapper.ts
    │   └── services/             # 应用服务
    │       └── message.service.ts
    │
    ├── infrastructure/           # 基础设施层
    │   ├── repositories/         # 仓储实现
    │   │   ├── message.repository.ts
    │   │   └── channel.repository.ts
    │   ├── adapters/             # 适配器
    │   │   ├── elasticsearch.adapter.ts
    │   │   └── rabbitmq.adapter.ts
    │   ├── persistence/          # 持久化
    │   │   └── message.prisma.repository.ts
    │   └── gateways/             # 网关
    │       └── message.gateway.ts
    │
    ├── interfaces/               # 接口层
    │   ├── controllers/          # 控制器
    │   │   ├── message.controller.ts
    │   │   └── message.controller.spec.ts
    │   └── resolvers/            # GraphQL解析器（可选）
    │       └── message.resolver.ts
    │
    ├── message.module.ts         # 模块定义
    └── README.md                 # 模块文档
```

**模块职责划分**:

| 层 | 职责 | 依赖 |
|---|------|------|
| Domain | 业务逻辑、领域规则 | 无外部依赖 |
| Application | 用例编排、DTO转换 | Domain |
| Infrastructure | 外部服务集成 | Domain/Application |
| Interfaces | HTTP/WebSocket接口 | Application |

### 3.2 前端模块结构（React）

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # 认证路由组
│   │   ├── login/
│   │   └── register/
│   ├── (main)/                   # 主应用路由组
│   │   ├── channels/
│   │   ├── agents/
│   │   ├── tasks/
│   │   └── settings/
│   ├── layout.tsx
│   └── page.tsx
│
├── components/                   # 组件
│   ├── ui/                       # 基础UI组件（无业务逻辑）
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.test.tsx
│   │   │   ├── Button.stories.tsx
│   │   │   └── index.ts
│   │   ├── Input/
│   │   ├── Modal/
│   │   └── ...
│   │
│   ├── business/                 # 业务组件
│   │   ├── MessageList/
│   │   │   ├── MessageList.tsx
│   │   │   ├── MessageList.test.tsx
│   │   │   ├── MessageItem.tsx
│   │   │   ├── MessageInput.tsx
│   │   │   └── index.ts
│   │   ├── AgentCard/
│   │   ├── TaskBoard/
│   │   └── ...
│   │
│   └── layout/                   # 布局组件
│       ├── Header/
│       ├── Sidebar/
│       ├── Footer/
│       └── MainLayout/
│
├── hooks/                        # 自定义Hooks
│   ├── useAuth.ts
│   ├── useWebSocket.ts
│   ├── useMessage.ts
│   └── useAgent.ts
│
├── stores/                       # 状态管理（Zustand）
│   ├── authStore.ts
│   ├── messageStore.ts
│   ├── agentStore.ts
│   └── uiStore.ts
│
├── services/                     # API服务
│   ├── apiClient.ts              # Axios实例
│   ├── authService.ts
│   ├── messageService.ts
│   ├── agentService.ts
│   └── taskService.ts
│
├── utils/                        # 工具函数
│   ├── format.ts
│   ├── validation.ts
│   ├── storage.ts
│   └── constants.ts
│
└── types/                        # 类型定义
    ├── auth.ts
    ├── message.ts
    ├── agent.ts
    └── api.ts
```

---

## 4. 依赖管理

### 4.1 Monorepo工具

```yaml
包管理器: pnpm
  - 节省磁盘空间
  - 严格的依赖管理
  - 工作空间支持

构建工具: Turborepo
  - 增量构建
  - 任务并行
  - 远程缓存
```

### 4.2 pnpm-workspace.yaml

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### 4.3 turbo.json

```json
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
```

---

## 5. 代码规范

### 5.1 命名约定

```typescript
// 文件命名
kebab-case.ts              // 普通文件
PascalCase.tsx             // React组件
PascalCase.test.tsx        // 测试文件
PascalCase.stories.tsx     // Storybook

// 变量命名
const userName = '';       // camelCase
const MAX_RETRY = 3;       // UPPER_SNAKE_CASE（常量）

// 类型命名
interface UserProfile {}    // PascalCase
type MessageStatus =       // PascalCase
  | 'pending'
  | 'sent'
  | 'failed';

// 函数命名
function sendMessage() {}   // camelCase（动词开头）
function isMessageValid() {} // 布尔返回值用 is/has/can

// 组件命名
export function MessageList() {}  // PascalCase

// 类命名
class MessageService {}     // PascalCase

// 接口命名
interface IMessageService {} // I前缀（可选）
```

### 5.2 目录/文件约定

```yaml
模块目录:
  - 必须包含 index.ts（导出）
  - 必须包含 README.md（文档）
  - 测试文件与源文件同级

组件目录:
  - ComponentName/
    - ComponentName.tsx
    - ComponentName.test.tsx
    - ComponentName.stories.tsx
    - index.ts

服务目录:
  - service-name/
    - service-name.service.ts
    - service-name.interface.ts
    - service-name.test.ts
    - index.ts
```

### 5.3 TypeScript配置

**packages/tsconfig/base.json**:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

**apps/server/tsconfig.json**:
```json
{
  "extends": "@ai-collab/tsconfig/node.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@modules/*": ["src/modules/*"],
      "@common/*": ["src/common/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

## 6. 测试策略

### 6.1 测试金字塔

```
        /\
       /  \      E2E测试 (10%)
      /____\     - 关键流程
     /      \    - 集成测试
    /________\   (20%)
   /          \  - API测试
  /____________\ - 模块集成
 /              \
/________________\ 单元测试 (70%)
                   - 工具函数
                   - 业务逻辑
                   - 组件测试
```

### 6.2 测试规范

```typescript
// 单元测试命名
describe('MessageService', () => {
  describe('sendMessage', () => {
    it('should send message successfully', async () => {
      // Arrange
      const dto = { content: 'Hello', channelId: '123' };

      // Act
      const result = await service.sendMessage(dto);

      // Assert
      expect(result).toBeDefined();
      expect(result.content).toBe('Hello');
    });

    it('should throw error when content is empty', async () => {
      // ...
    });
  });
});

// 测试覆盖率要求
// - 工具函数: 100%
// - 业务逻辑: > 90%
// - 控制器: > 80%
// - 组件: > 80%
```

### 6.3 测试命令

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:e2e": "jest --config ./test/jest-e2e.json"
  }
}
```

---

## 7. CI/CD流水线

### 7.1 GitHub Actions

**.github/workflows/ci.yml**:
```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm lint

  test:
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm test:cov
      - uses: codecov/codecov-action@v3

  build:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm build
```

---

## 8. 错误处理

### 8.1 错误分类

```typescript
// 错误基类
export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
  }
}

// 业务错误
export class BusinessError extends AppError {
  constructor(code: string, message: string, details?: any) {
    super(code, message, 400, details);
  }
}

// 验证错误
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super('VALIDATION_ERROR', message, 400, details);
  }
}

// 未授权错误
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super('UNAUTHORIZED', message, 401);
  }
}

// 禁止访问错误
export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super('FORBIDDEN', message, 403);
  }
}

// 未找到错误
export class NotFoundError extends AppError {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource} not found`, 404);
  }
}
```

### 8.2 错误码规范

```yaml
格式: {模块}_{错误类型}_{具体错误}

示例:
  AUTH_TOKEN_EXPIRED        # 认证-Token过期
  AUTH_INVALID_CREDENTIALS  # 认证-无效凭证
  MESSAGE_NOT_FOUND         # 消息-未找到
  AGENT_ALREADY_EXISTS      # Agent-已存在
  TASK_ASSIGNMENT_FAILED    # 任务-分配失败
  VALIDATION_INVALID_INPUT  # 验证-无效输入
```

---

## 9. 日志规范

### 9.1 日志级别

```typescript
import { Logger } from '@nestjs/common';

const logger = new Logger('MessageService');

// 错误日志
logger.error('Failed to send message', error.stack);

// 警告日志
logger.warn('Rate limit approaching', { userId, count });

// 信息日志
logger.log('Message sent successfully', { messageId, channelId });

// 调试日志
logger.debug('Processing message', { message });
```

### 9.2 日志格式

```json
{
  "timestamp": "2026-03-14T10:00:00.000Z",
  "level": "INFO",
  "context": "MessageService",
  "message": "Message sent successfully",
  "traceId": "abc-123-def",
  "userId": "user-uuid",
  "metadata": {
    "messageId": "msg-uuid",
    "channelId": "channel-uuid"
  }
}
```

---

## 10. API规范

### 10.1 RESTful API

```yaml
基础路径: /api/v1

资源命名:
  - 复数形式: /messages, /agents, /tasks
  - 嵌套资源: /channels/:id/messages

HTTP方法:
  GET    /messages          # 列表
  GET    /messages/:id      # 详情
  POST   /messages          # 创建
  PUT    /messages/:id      # 全量更新
  PATCH  /messages/:id      # 部分更新
  DELETE /messages/:id      # 删除

分页:
  GET /messages?page=1&limit=20

过滤:
  GET /messages?status=sent&channelId=123

排序:
  GET /messages?sort=-createdAt  # 降序
```

### 10.2 响应格式

**成功响应**:
```json
{
  "success": true,
  "data": {
    "id": "msg-uuid",
    "content": "Hello",
    "createdAt": "2026-03-14T10:00:00Z"
  }
}
```

**列表响应**:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

**错误响应**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [
      {
        "field": "content",
        "message": "Content is required"
      }
    ]
  },
  "traceId": "abc-123-def"
}
```

---

*文档版本: v1.0*
*最后更新: 2026-03-14*
