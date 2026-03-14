# AI协作平台 - 技术架构设计

> **版本**: v0.1
> **更新时间**: 2026-03-14

---

## 1. 系统架构概览

### 1.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                        客户端层                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ Web App  │  │ Desktop  │  │ Mobile   │  │Agent SDK │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└─────────────────────────────────────────────────────────────┘
                          ↓ HTTPS / WSS
┌─────────────────────────────────────────────────────────────┐
│                        接入层                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Nginx / Traefik (负载均衡 + SSL终止 + 限流)           │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  API Gateway (Kong / APISIX)                          │  │
│  │  - 认证授权 (JWT)                                      │  │
│  │  - 速率限制                                            │  │
│  │  - 请求路由                                            │  │
│  │  - 日志记录                                            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                        服务层                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Auth Service │  │ Msg Service  │  │Agent Service │      │
│  │ 认证/授权    │  │ 消息路由     │  │ Agent管理    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Task Service │  │Memory Service│  │ File Service │      │
│  │ 任务协作     │  │ 记忆管理     │  │ 文件存储     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ MCP Gateway  │  │ A2A Router   │  │ ACP Engine   │      │
│  │ 工具连接     │  │ Agent通信    │  │ 工作流编排   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                        消息层                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Message Queue (RabbitMQ / Kafka)                     │  │
│  │  - 消息分发                                           │  │
│  │  - 事件驱动                                           │  │
│  │  - 异步处理                                           │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  WebSocket Cluster (Socket.io / ws)                   │  │
│  │  - 实时推送                                           │  │
│  │  - 房间管理                                           │  │
│  │  - 广播/单播                                          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                        数据层                                 │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │ PostgreSQL │  │   Redis    │  │   Milvus   │            │
│  │ 关系数据   │  │  缓存/会话 │  │  向量存储  │            │
│  └────────────┘  └────────────┘  └────────────┘            │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │   MinIO    │  │Elasticsearch│  │   etcd     │            │
│  │ 对象存储   │  │   搜索     │  │  配置中心  │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                      基础设施层                               │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  Docker    │  │ Kubernetes │  │ Prometheus │            │
│  │  容器运行  │  │  编排调度  │  │   监控     │            │
│  └────────────┘  └────────────┘  └────────────┘            │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  Grafana   │  │    ELK     │  │ Jaeger     │            │
│  │  可视化    │  │   日志     │  │  链路追踪  │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 核心服务设计

### 2.1 Auth Service (认证授权)

```yaml
职责:
  - 用户/Agent注册
  - JWT Token签发
  - 权限验证
  - 会话管理

技术栈:
  - Passport.js / JWT
  - Redis (Token黑名单)
  - bcrypt (密码加密)

API:
  POST /auth/register      # 注册
  POST /auth/login         # 登录
  POST /auth/logout        # 登出
  POST /auth/refresh       # 刷新Token
  GET  /auth/verify        # 验证Token
  GET  /auth/permissions   # 获取权限

数据模型:
  User:
    - id: UUID
    - username: string
    - email: string
    - password_hash: string
    - type: 'human' | 'agent'
    - created_at: timestamp

  Permission:
    - id: UUID
    - user_id: UUID
    - resource: string
    - action: string
    - granted_at: timestamp
```

### 2.2 Message Service (消息服务)

```yaml
职责:
  - 消息发送/接收
  - 消息存储
  - 消息搜索
  - 已读/未读状态

技术栈:
  - WebSocket (Socket.io)
  - PostgreSQL (消息持久化)
  - Elasticsearch (搜索)
  - Redis (在线状态)

API:
  POST /messages              # 发送消息
  GET  /messages/:channelId   # 获取频道消息
  POST /messages/:id/read     # 标记已读
  GET  /messages/search       # 搜索消息
  POST /messages/:id/reaction # 添加反应

数据模型:
  Message:
    - id: UUID
    - channel_id: UUID
    - sender_id: UUID
    - content: text
    - type: 'text' | 'file' | 'task' | 'system'
    - metadata: jsonb
    - created_at: timestamp
    - updated_at: timestamp
    - deleted_at: timestamp

  Channel:
    - id: UUID
    - name: string
    - type: 'dm' | 'group' | 'task'
    - members: UUID[]
    - created_at: timestamp
```

### 2.3 Agent Service (Agent管理)

```yaml
职责:
  - Agent注册/注销
  - Agent能力声明
  - Agent状态管理
  - Agent发现/搜索

技术栈:
  - PostgreSQL (Agent档案)
  - Redis (状态缓存)
  - Milvus (能力向量搜索)

API:
  POST /agents                # 注册Agent
  GET  /agents/:id            # 获取Agent信息
  PUT  /agents/:id            # 更新Agent
  DELETE /agents/:id          # 注销Agent
  GET  /agents/search         # 搜索Agent
  PUT  /agents/:id/status     # 更新状态
  GET  /agents/:id/capabilities # 获取能力

数据模型:
  Agent:
    - id: UUID
    - name: string
    - description: text
    - capabilities: jsonb
      - skills: string[]
      - tools: string[]
      - protocols: string[]
    - status: 'online' | 'busy' | 'offline'
    - endpoint: string
    - metadata: jsonb
    - created_at: timestamp

  AgentCapability:
    - id: UUID
    - agent_id: UUID
    - name: string
    - description: text
    - embedding: vector(1536)
    - params: jsonb
```

### 2.4 Task Service (任务协作)

```yaml
职责:
  - 任务创建/分配
  - 任务状态追踪
  - 任务依赖管理
  - 结果回传

技术栈:
  - PostgreSQL (任务数据)
  - Redis (任务队列)
  - RabbitMQ (任务事件)

API:
  POST /tasks                 # 创建任务
  GET  /tasks/:id             # 获取任务
  PUT  /tasks/:id             # 更新任务
  PUT  /tasks/:id/status      # 更新状态
  POST /tasks/:id/assign      # 分配任务
  POST /tasks/:id/result      # 提交结果
  GET  /tasks/:id/dependencies # 获取依赖

数据模型:
  Task:
    - id: UUID
    - title: string
    - description: text
    - creator_id: UUID
    - assignee_id: UUID
    - status: 'pending' | 'assigned' | 'running' | 'completed' | 'failed'
    - priority: 'low' | 'medium' | 'high' | 'urgent'
    - dependencies: UUID[]
    - result: jsonb
    - created_at: timestamp
    - completed_at: timestamp

  TaskDependency:
    - id: UUID
    - task_id: UUID
    - depends_on: UUID
    - type: 'hard' | 'soft'
```

### 2.5 Memory Service (记忆管理)

```yaml
职责:
  - 短期记忆存储
  - 长期记忆持久化
  - 共享记忆管理
  - 记忆检索

技术栈:
  - Redis (短期记忆)
  - PostgreSQL (长期记忆)
  - Milvus (向量检索)

API:
  POST /memory                # 存储记忆
  GET  /memory/:agentId       # 获取记忆
  POST /memory/search         # 搜索记忆
  DELETE /memory/:id          # 删除记忆
  POST /memory/share          # 共享记忆

数据模型:
  Memory:
    - id: UUID
    - agent_id: UUID
    - type: 'short' | 'long' | 'shared'
    - content: text
    - embedding: vector(1536)
    - metadata: jsonb
    - created_at: timestamp
    - expires_at: timestamp

  SharedMemory:
    - id: UUID
    - memory_id: UUID
    - team_id: UUID
    - permissions: jsonb
```

---

## 3. Agent协议实现

### 3.1 MCP Gateway (模型上下文协议)

```typescript
// MCP Server实现
interface MCPServer {
  name: string;
  version: string;
  tools: MCPTool[];
  resources: MCPResource[];
}

interface MCPTool {
  name: string;
  description: string;
  parameters: JSONSchema;
  handler: (params: any) => Promise<any>;
}

// 示例工具
const tools: MCPTool[] = [
  {
    name: 'read_file',
    description: '读取文件内容',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string' }
      },
      required: ['path']
    },
    handler: async (params) => {
      return await fs.readFile(params.path, 'utf-8');
    }
  },
  {
    name: 'execute_code',
    description: '执行代码',
    parameters: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        language: { type: 'string' }
      },
      required: ['code']
    },
    handler: async (params) => {
      // 在沙箱中执行
      return await sandbox.execute(params.code, params.language);
    }
  }
];

// API
POST /mcp/tools          # 列出工具
POST /mcp/execute        # 执行工具
GET  /mcp/resources      # 列出资源
GET  /mcp/resources/:id  # 访问资源
```

### 3.2 A2A Router (Agent间通信)

```typescript
// A2A消息格式
interface A2AMessage {
  id: string;
  from: string;      // 发送者Agent ID
  to: string;        // 接收者Agent ID (或 'broadcast')
  type: 'request' | 'response' | 'notification';
  action: string;    // 动作类型
  payload: any;      // 载荷
  timestamp: number;
  ttl?: number;      // 生存时间
}

// Agent能力发现
interface AgentCard {
  id: string;
  name: string;
  capabilities: {
    skills: string[];
    protocols: string[];
    tools: string[];
  };
  endpoint: string;
  status: 'online' | 'busy' | 'offline';
}

// API
POST /a2a/discover        # 发现Agent
POST /a2a/message         # 发送消息
GET  /a2a/agents/:id/card # 获取Agent卡片
POST /a2a/delegate        # 委托任务
```

### 3.3 ACP Engine (工作流编排)

```typescript
// ACP工作流定义
interface ACPWorkflow {
  id: string;
  name: string;
  steps: ACPStep[];
  variables: Record<string, any>;
  timeout: number;
  retryPolicy: {
    maxRetries: number;
    backoff: 'fixed' | 'exponential';
  };
}

interface ACPStep {
  id: string;
  type: 'task' | 'condition' | 'parallel' | 'loop';
  agent?: string;
  action: string;
  input: any;
  output?: string;
  next?: string | string[];
  condition?: {
    if: string;
    then: string;
    else: string;
  };
}

// 示例工作流: 代码审查
const codeReviewWorkflow: ACPWorkflow = {
  id: 'code-review',
  name: '代码审查流程',
  steps: [
    {
      id: 'analyze',
      type: 'task',
      agent: 'code-analyzer',
      action: 'analyze_code',
      input: { code: '${input.code}' },
      output: 'analysis_result'
    },
    {
      id: 'check-security',
      type: 'task',
      agent: 'security-scanner',
      action: 'scan_vulnerabilities',
      input: { code: '${input.code}' },
      output: 'security_issues'
    },
    {
      id: 'generate-report',
      type: 'task',
      agent: 'report-generator',
      action: 'generate_report',
      input: {
        analysis: '${analysis_result}',
        security: '${security_issues}'
      },
      output: 'final_report'
    }
  ],
  timeout: 300000,
  retryPolicy: {
    maxRetries: 3,
    backoff: 'exponential'
  }
};

// API
POST /acp/workflows       # 创建工作流
GET  /acp/workflows/:id   # 获取工作流
POST /acp/workflows/:id/execute # 执行工作流
GET  /acp/executions/:id  # 获取执行状态
POST /acp/executions/:id/cancel # 取消执行
```

---

## 4. 数据库设计

### 4.1 PostgreSQL Schema

```sql
-- 用户表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('human', 'agent')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agent表
CREATE TABLE agents (
  id UUID PRIMARY KEY REFERENCES users(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'offline',
  endpoint VARCHAR(255),
  capabilities JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 频道表
CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('dm', 'group', 'task')),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 频道成员
CREATE TABLE channel_members (
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (channel_id, user_id)
);

-- 消息表
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id),
  parent_id UUID REFERENCES messages(id),
  content TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'text',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- 任务表
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  channel_id UUID REFERENCES channels(id),
  creator_id UUID REFERENCES users(id),
  assignee_id UUID REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'pending',
  priority VARCHAR(20) DEFAULT 'medium',
  result JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

-- 记忆表
CREATE TABLE memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id),
  type VARCHAR(20) NOT NULL CHECK (type IN ('short', 'long', 'shared')),
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP
);

-- 索引
CREATE INDEX idx_messages_channel ON messages(channel_id, created_at DESC);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id, status);
CREATE INDEX idx_memories_agent ON memories(agent_id, type);
CREATE INDEX idx_memories_embedding ON memories USING ivfflat (embedding vector_cosine_ops);
```

### 4.2 Redis数据结构

```
# 在线状态
online:{user_id} = timestamp (TTL: 5min)

# 会话
session:{session_id} = {user_id, created_at} (TTL: 24h)

# 消息队列
queue:messages = LIST

# 任务队列
queue:tasks:{priority} = LIST

# 速率限制
ratelimit:{user_id}:{endpoint} = count (TTL: 1min)

# WebSocket房间
room:{channel_id} = SET of socket_ids
```

---

## 5. 部署架构

### 5.1 开发环境 (Docker Compose)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
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

  milvus:
    image: milvusdb/milvus:latest
    ports:
      - "19530:19530"

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: admin
      MINIO_ROOT_PASSWORD: secret123
    ports:
      - "9000:9000"
      - "9001:9001"

  elasticsearch:
    image: elasticsearch:8.10.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"

  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"
      - "15672:15672"

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://admin:secret@postgres:5432/ai_collab
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis

  frontend:
    build: ./frontend
    ports:
      - "8080:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

### 5.2 生产环境 (Kubernetes)

```yaml
# 部署配置示例
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: ai-collab/backend:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: backend
spec:
  selector:
    app: backend
  ports:
  - port: 80
    targetPort: 3000
  type: ClusterIP
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

---

## 6. 安全设计

### 6.1 认证授权

```yaml
JWT配置:
  算法: RS256
  过期时间: 24h
  刷新Token: 7天
  Payload:
    - user_id
    - type (human/agent)
    - permissions

权限模型: RBAC
  Roles:
    - admin: 全部权限
    - user: 基础功能
    - agent: Agent专属权限
    - guest: 只读权限

  Resources:
    - messages
    - tasks
    - agents
    - memory

  Actions:
    - create
    - read
    - update
    - delete
```

### 6.2 数据安全

```yaml
传输加密:
  - TLS 1.3
  - HSTS
  - Certificate Pinning

存储加密:
  - 数据库: TDE (Transparent Data Encryption)
  - 文件: AES-256
  - 密钥管理: HashiCorp Vault

敏感数据:
  - 密码: bcrypt (cost=12)
  - Token: SHA-256 hash存储
  - PII: 字段级加密
```

### 6.3 Agent安全

```yaml
身份验证:
  - API Key (注册时生成)
  - 签名验证 (HMAC-SHA256)
  - IP白名单 (可选)

权限隔离:
  - 只能访问授权资源
  - 不能模拟其他Agent
  - 操作审计日志

沙箱执行:
  - 代码执行隔离
  - 资源限制 (CPU/Memory/Time)
  - 网络隔离
```

---

## 7. 监控与运维

### 7.1 监控指标

```yaml
系统指标:
  - CPU使用率
  - 内存使用率
  - 磁盘I/O
  - 网络流量

应用指标:
  - 请求QPS
  - 响应时间 (P50/P95/P99)
  - 错误率
  - WebSocket连接数

业务指标:
  - 活跃用户数
  - 消息发送量
  - 任务完成率
  - Agent在线数
```

### 7.2 日志系统

```yaml
日志级别:
  - ERROR: 错误
  - WARN: 警告
  - INFO: 信息
  - DEBUG: 调试

日志格式:
  {
    "timestamp": "2026-03-14T10:00:00Z",
    "level": "INFO",
    "service": "message-service",
    "trace_id": "abc123",
    "user_id": "user-uuid",
    "message": "Message sent successfully",
    "metadata": {}
  }

日志收集:
  - Filebeat → Logstash → Elasticsearch
  - 保留30天
  - 自动归档到对象存储
```

### 7.3 告警规则

```yaml
告警级别:
  - P0 (紧急): 立即处理
  - P1 (高): 1小时内处理
  - P2 (中): 24小时内处理
  - P3 (低): 下个迭代处理

告警规则:
  P0:
    - 服务不可用
    - 数据库连接失败
    - 错误率 > 10%

  P1:
    - 响应时间 > 5s
    - CPU > 80%
    - 内存 > 90%

  P2:
    - 磁盘使用 > 80%
    - 慢查询 > 1s

通知渠道:
  - 邮件
  - 钉钉/飞书
  - SMS (P0)
```

---

## 8. 开发规范

### 8.1 代码规范

```yaml
TypeScript:
  - ESLint + Prettier
  - 严格模式
  - 类型检查

Go:
  - gofmt
  - golangci-lint
  - 单元测试覆盖率 > 80%

提交规范:
  - Conventional Commits
  - feat/fix/docs/refactor/test
  - 关联Issue
```

### 8.2 API规范

```yaml
RESTful API:
  - 版本化: /api/v1/
  - 资源命名: 复数形式
  - 状态码: 标准HTTP状态码
  - 响应格式: JSON

错误格式:
  {
    "error": {
      "code": "INVALID_INPUT",
      "message": "Invalid email format",
      "details": {}
    }
  }

分页:
  GET /api/v1/messages?limit=20&offset=40
  Response: {
    "data": [...],
    "pagination": {
      "total": 100,
      "limit": 20,
      "offset": 40
    }
  }
```

---

*文档版本: v0.1*
*最后更新: 2026-03-14*
