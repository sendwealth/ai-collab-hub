# ADR-002: 后端采用NestJS框架

## 状态
Accepted

## 背景
后端服务需要选择一个Node.js框架，要求：
- 支持模块化开发
- 内置依赖注入
- TypeScript原生支持
- 适合AI Agent协作

## 决策
后端服务采用 **NestJS** 框架。

### 架构风格
采用 **DDD (Domain-Driven Design)** 分层架构：
- Domain Layer: 领域层（实体、值对象、领域服务）
- Application Layer: 应用层（用例、DTO、应用服务）
- Infrastructure Layer: 基础设施层（仓储实现、外部服务）
- Interfaces Layer: 接口层（控制器、网关）

### 模块组织
每个业务模块遵循DDD分层：
```
modules/
└── message/
    ├── domain/           # 领域层
    ├── application/      # 应用层
    ├── infrastructure/   # 基础设施层
    └── interfaces/       # 接口层
```

## 理由

### 为什么选择NestJS
1. **模块化**: 天然支持模块化，模块边界清晰
2. **依赖注入**: 内置DI容器，便于测试和Mock
3. **TypeScript**: 原生支持，类型安全
4. **装饰器**: 代码简洁，易于AI Agent理解
5. **生态完善**: 文档、社区、工具链成熟
6. **企业级**: 适合复杂业务场景

### 为什么采用DDD
1. **业务清晰**: 领域模型清晰表达业务逻辑
2. **易于测试**: 领域层无外部依赖，易于单元测试
3. **模块边界**: 通过分层强制模块边界
4. **AI协作友好**: 每层职责明确，Agent分工清晰

## 后果

### 正面影响
- 代码结构清晰
- 易于测试
- 模块边界明确
- 业务逻辑集中在领域层

### 负面影响
- 初期代码量较大（分层）
- 学习曲线（DDD概念）
- 可能过度设计（简单场景）

## 替代方案

### Express
使用Express.js + 自行组织。

**不选择原因**:
- 缺乏模块化支持
- 无依赖注入
- 需要自行设计架构

### Fastify
使用Fastify框架。

**不选择原因**:
- 生态不如NestJS
- 缺少企业级特性
- 装饰器支持不如NestJS

### Go (Gin)
使用Go语言 + Gin框架。

**不选择原因**:
- 前后端语言不统一
- AI Agent需要学习新语言
- 前端类型定义无法共享

## 参考
- [NestJS官方文档](https://docs.nestjs.com/)
- [Domain-Driven Design](https://www.domainlanguage.com/)
