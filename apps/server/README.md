# 后端服务 - AI协作平台

> NestJS + Prisma + PostgreSQL + Redis

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

```bash
cp ../../.env.example ../../.env
# 编辑 .env 文件
```

### 3. 初始化数据库

```bash
# 生成Prisma Client
pnpm prisma generate

# 运行数据库迁移
pnpm db:migrate

# 填充种子数据（可选）
pnpm db:seed
```

### 4. 启动开发服务器

```bash
pnpm dev
```

访问 http://localhost:3007

## 项目结构

```
src/
├── modules/              # 业务模块
│   ├── auth/            # 认证模块
│   ├── users/           # 用户模块
│   ├── messages/        # 消息模块
│   ├── agents/          # Agent模块
│   └── tasks/           # 任务模块
├── common/              # 公共模块
│   ├── prisma/         # Prisma服务
│   ├── redis/          # Redis服务
│   ├── decorators/     # 装饰器
│   ├── filters/        # 过滤器
│   ├── guards/         # 守卫
│   ├── interceptors/   # 拦截器
│   └── pipes/          # 管道
├── config/              # 配置
├── infrastructure/      # 基础设施
├── app.module.ts        # 根模块
└── main.ts              # 入口文件
```

## 模块开发

### 创建新模块

```bash
# 使用Nest CLI生成模块
nest g module modules/new-module
nest g controller modules/new-module
nest g service modules/new-module
```

### 模块结构（DDD分层）

```
modules/
└── message/
    ├── domain/           # 领域层
    │   ├── entities/    # 实体
    │   ├── value-objects/ # 值对象
    │   └── repositories/ # 仓储接口
    ├── application/      # 应用层
    │   ├── use-cases/   # 用例
    │   ├── dto/         # DTO
    │   └── services/    # 应用服务
    ├── infrastructure/   # 基础设施层
    │   ├── repositories/ # 仓储实现
    │   └── adapters/    # 适配器
    └── interfaces/       # 接口层
        ├── controllers/ # 控制器
        └── gateways/    # WebSocket网关
```

## API文档

启动服务后访问:
- Swagger UI: http://localhost:3007/api/docs
- OpenAPI JSON: http://localhost:3007/api/docs-json

## 测试

```bash
# 单元测试
pnpm test

# 测试覆盖率
pnpm test:cov

# E2E测试
pnpm test:e2e
```

## 数据库管理

```bash
# 查看数据库
pnpm prisma studio

# 创建迁移
pnpm prisma migrate dev --name migration_name

# 重置数据库
pnpm db:reset
```

## 常用命令

```bash
pnpm dev          # 启动开发服务器
pnpm build        # 构建生产版本
pnpm start:prod   # 启动生产服务器
pnpm lint         # 代码检查
pnpm test         # 运行测试
```

## 环境变量

| 变量 | 描述 | 默认值 |
|------|------|--------|
| PORT | 服务端口 | 3000 |
| DATABASE_URL | 数据库连接 | - |
| REDIS_URL | Redis连接 | - |
| JWT_SECRET | JWT密钥 | - |
| JWT_EXPIRES_IN | Token过期时间 | 24h |

---

*更多信息请查看项目文档*
