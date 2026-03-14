# AI协作规约

> **目标**: 确保多AI Agent协作开发时项目架构不走偏

---

## 1. 协作原则

### 1.1 核心原则

```yaml
1. 文档驱动 (Documentation First):
   - 写代码前先读文档
   - 修改代码前先更新文档
   - 关键决策必须记录ADR

2. 模块边界 (Module Boundaries):
   - 严格遵守模块职责
   - 不跨模块直接调用
   - 通过接口/事件通信

3. 渐进式开发 (Incremental Development):
   - 先写测试，再写实现
   - 小步提交，频繁集成
   - 可工作 > 完美

4. 代码质量 (Code Quality):
   - 遵循代码规范
   - 通过所有测试
   - 代码审查通过

5. 追踪溯源 (Traceability):
   - 提交关联Issue
   - PR描述完整
   - 变更有记录
```

---

## 2. Agent角色分工

### 2.1 角色定义

| Agent角色 | 职责 | 专注领域 |
|----------|------|---------|
| **架构师** | 技术决策、架构设计、代码审查 | 整体架构、技术选型、ADR |
| **后端开发** | API开发、业务逻辑、数据库 | NestJS模块、服务层、数据库 |
| **前端开发** | UI组件、页面开发、状态管理 | React组件、Next.js页面 |
| **测试工程师** | 测试用例、E2E测试、覆盖率 | Jest测试、测试策略 |
| **DevOps** | CI/CD、部署、监控 | GitHub Actions、Docker、K8s |
| **文档工程师** | 文档编写、示例代码 | README、API文档、指南 |

### 2.2 Agent能力矩阵

```yaml
架构师:
  skills:
    - 系统设计
    - 技术选型
    - 代码审查
    - 性能优化
  permissions:
    - 修改ARCHITECTURE.md
    - 创建/修改ADR
    - Approve/Reject PR
    - 修改核心配置

后端开发:
  skills:
    - Node.js/TypeScript
    - NestJS
    - 数据库设计
    - API开发
  permissions:
    - 修改apps/server/*
    - 修改packages/types/*
    - 创建Pull Request
  restrictions:
    - 不能修改apps/web/*
    - 不能修改核心配置

前端开发:
  skills:
    - React/TypeScript
    - Next.js
    - UI/UX
    - 状态管理
  permissions:
    - 修改apps/web/*
    - 修改packages/types/*
    - 创建Pull Request
  restrictions:
    - 不能修改apps/server/*
    - 不能修改数据库迁移

测试工程师:
  skills:
    - Jest
    - Testing Library
    - E2E测试
    - 性能测试
  permissions:
    - 修改*.test.ts文件
    - 修改测试配置
    - 添加测试用例
  restrictions:
    - 不能修改业务代码（除非修复bug）

DevOps:
  skills:
    - Docker
    - Kubernetes
    - GitHub Actions
    - 监控告警
  permissions:
    - 修改infra/*
    - 修改.github/workflows/*
    - 修改Dockerfile
  restrictions:
    - 不能修改业务代码

文档工程师:
  skills:
    - 技术写作
    - Markdown
    - 示例代码
  permissions:
    - 修改docs/*
    - 修改README.md
    - 添加示例代码
  restrictions:
    - 不能修改业务代码
```

---

## 3. 开发流程

### 3.1 功能开发流程

```
1. 创建Issue
   └─> 指派Owner
   └─> 打标签 (feature/bug/refactor)
   └─> 关联Milestone

2. 设计阶段 (架构师参与)
   └─> 评审技术方案
   └─> 创建ADR (如需要)
   └─> 确定模块边界

3. 开发阶段
   └─> 创建分支 (feat/xxx)
   └─> 编写测试用例
   └─> 实现功能
   └─> 本地测试通过

4. 提交PR
   └─> 填写PR模板
   └─> 关联Issue
   └─> 通过CI检查

5. 代码审查 (架构师必须参与)
   └─> 检查架构符合性
   └─> 检查代码质量
   └─> 检查测试覆盖率

6. 合并代码
   └─> Squash合并
   └─> 删除分支
   └─> 更新CHANGELOG
```

### 3.2 紧急修复流程

```
1. 创建Hotfix Issue
   └─> 标签: hotfix
   └─> 优先级: P0

2. 直接修复
   └─> 从main创建hotfix/xxx分支
   └─> 快速修复 + 测试
   └─> 提交PR

3. 快速审查
   └─> 架构师快速Review
   └─> 优先合并

4. 回归测试
   └─> 确保无副作用
   └─> 更新相关测试
```

---

## 4. 代码规范

### 4.1 提交规范 (Conventional Commits)

```bash
# 格式
<type>(<scope>): <subject>

<body>

<footer>
```

**Type类型**:
```yaml
feat:     新功能
fix:      Bug修复
docs:     文档更新
style:    代码格式（不影响功能）
refactor: 重构（不新增功能或修复bug）
test:     测试相关
chore:    构建/工具相关
perf:     性能优化
ci:       CI/CD相关
```

**示例**:
```bash
# 新功能
feat(message): add message reaction feature

- Support emoji reactions
- Support reaction count
- Add reaction API

Closes #123

# Bug修复
fix(auth): fix token expiration check

The token was not being validated correctly.

Fixes #456

# 文档
docs(readme): update installation guide

# 重构
refactor(agent): extract agent registration logic

# 测试
test(message): add unit tests for message service
```

### 4.2 分支命名规范

```bash
# 功能分支
feat/message-reaction
feat/agent-discovery
feat/task-assignment

# Bug修复分支
fix/token-expiration
fix/websocket-reconnect

# 重构分支
refactor/message-service
refactor/state-management

# Hotfix分支
hotfix/security-patch
hotfix/database-connection

# 文档分支
docs/api-reference
docs/deployment-guide
```

### 4.3 PR模板

**.github/PULL_REQUEST_TEMPLATE.md**:
```markdown
## 变更类型
- [ ] 新功能 (feat)
- [ ] Bug修复 (fix)
- [ ] 重构 (refactor)
- [ ] 文档 (docs)
- [ ] 测试 (test)

## 关联Issue
Closes #

## 变更描述
<!-- 简要描述本次变更 -->

## 技术方案
<!-- 如果是新功能，描述技术实现方案 -->

## 测试计划
- [ ] 单元测试已添加/更新
- [ ] 集成测试已添加/更新
- [ ] 本地测试通过

## 检查清单
- [ ] 代码符合规范
- [ ] 测试覆盖率 > 80%
- [ ] 文档已更新
- [ ] 无breaking changes（或已标注）

## 截图/演示
<!-- 如果是UI变更，附上截图 -->

## 备注
<!-- 其他需要说明的内容 -->
```

---

## 5. 模块开发规约

### 5.1 新增模块流程

```bash
# 1. 创建模块目录
cd apps/server/src/modules
mkdir -p new-module/{domain,application,infrastructure,interfaces}

# 2. 创建基础文件
touch new-module/new-module.module.ts
touch new-module/README.md

# 3. 实现领域层
# - 定义Entity
# - 定义Repository接口
# - 定义领域服务

# 4. 实现应用层
# - 定义UseCase
# - 定义DTO
# - 实现Service

# 5. 实现基础设施层
# - 实现Repository
# - 集成外部服务

# 6. 实现接口层
# - Controller
# - Gateway (WebSocket)

# 7. 编写测试
touch new-module/*.spec.ts

# 8. 更新文档
# - 更新模块README
# - 更新API文档
```

### 5.2 模块README模板

```markdown
# {Module Name} Module

## 职责
<!-- 模块的核心职责 -->

## 架构
<!-- 模块的分层架构 -->

## API
<!-- 模块提供的API -->

### REST API
- `POST /api/v1/xxx` - 描述
- `GET /api/v1/xxx` - 描述

### WebSocket Events
- `event:name` - 描述

## 领域模型
<!-- 核心实体和值对象 -->

## 依赖
<!-- 模块的外部依赖 -->

## 配置
<!-- 环境变量和配置项 -->

## 测试
<!-- 测试策略和命令 -->

## 变更日志
<!-- 重要变更记录 -->
```

### 5.3 跨模块通信

```yaml
允许的方式:
  1. 依赖注入:
     - 通过Module导入
     - 注入Service

  2. 事件驱动:
     - 发布领域事件
     - 订阅事件处理

  3. 消息队列:
     - 异步任务
     - 跨服务通信

禁止的方式:
  1. 直接导入:
     - ❌ import { MessageService } from '../message'

  2. 全局变量:
     - ❌ global.messageService

  3. 数据库直连:
     - ❌ 直接操作其他模块的表
```

---

## 6. 代码审查规约

### 6.1 审查清单

**架构审查 (架构师)**:
```yaml
- [ ] 模块边界是否清晰
- [ ] 是否符合分层架构
- [ ] 依赖方向是否正确
- [ ] 是否引入循环依赖
- [ ] 是否符合设计模式
- [ ] 是否有更好的实现方式
```

**代码审查 (所有开发者)**:
```yaml
- [ ] 代码是否符合规范
- [ ] 命名是否清晰易懂
- [ ] 是否有重复代码
- [ ] 是否有潜在bug
- [ ] 是否有性能问题
- [ ] 是否有安全隐患
```

**测试审查**:
```yaml
- [ ] 测试覆盖率是否达标
- [ ] 测试用例是否合理
- [ ] 边界情况是否覆盖
- [ ] Mock是否正确
```

### 6.2 审查流程

```
1. 自动化检查 (CI)
   └─> ESLint
   └─> TypeScript编译
   └─> 单元测试
   └─> 覆盖率检查

2. 架构审查 (架构师)
   └─> 审查架构符合性
   └─> 评审技术方案
   └─> 提出改进建议

3. 代码审查 (同行)
   └─> 审查代码质量
   └─> 检查潜在问题
   └─> 提出优化建议

4. 最终审批 (架构师)
   └─> 确认所有问题已解决
   └─> Approve PR
```

### 6.3 审查标准

```yaml
必须拒绝 (Request Changes):
  - 架构不符合规范
  - 破坏模块边界
  - 测试覆盖率不足
  - 存在明显bug
  - 安全漏洞

建议修改 (Comment):
  - 代码可读性差
  - 性能可优化
  - 有更好的实现方式

可以合并 (Approve):
  - 所有检查通过
  - 小问题已记录（后续优化）
  - 文档已更新
```

---

## 7. 文档规约

### 7.1 必须文档

```yaml
项目级:
  - README.md           # 项目介绍
  - CONTRIBUTING.md     # 贡献指南
  - CHANGELOG.md        # 变更日志

架构级:
  - ARCHITECTURE.md     # 工程架构
  - docs/ADR/           # 架构决策记录
  - TECHNICAL_DESIGN.md # 技术设计

模块级:
  - modules/*/README.md # 模块文档
  - API文档 (Swagger)

开发级:
  - docs/guides/        # 开发指南
  - docs/api/           # API文档
```

### 7.2 ADR模板

**docs/ADR/xxx-title.md**:
```markdown
# ADR-XXX: {标题}

## 状态
Proposed | Accepted | Deprecated | Superseded

## 背景
<!-- 为什么需要这个决策 -->

## 决策
<!-- 具体的决策内容 -->

## 理由
<!-- 为什么选择这个方案 -->

## 后果
<!-- 这个决策的影响 -->

### 正面影响
- ...

### 负面影响
- ...

## 替代方案
<!-- 考虑过但没有选择的方案 -->

## 参考
- 相关Issue
- 相关讨论
```

### 7.3 API文档规范

```typescript
/**
 * 发送消息
 *
 * @description 向指定频道发送消息
 * @param {SendMessageDto} dto - 消息内容
 * @returns {Promise<Message>} 发送的消息
 * @throws {UnauthorizedError} 未授权
 * @throws {ValidationError} 验证失败
 * @throws {NotFoundError} 频道不存在
 *
 * @example
 * const message = await messageService.sendMessage({
 *   channelId: 'channel-uuid',
 *   content: 'Hello, World!'
 * });
 */
async sendMessage(dto: SendMessageDto): Promise<Message> {
  // ...
}
```

---

## 8. 质量门禁

### 8.1 CI检查

```yaml
必须通过:
  - ESLint: 无错误
  - TypeScript: 编译通过
  - 单元测试: 全部通过
  - 覆盖率: > 80%
  - 构建: 成功

可选检查:
  - E2E测试
  - 性能测试
  - 安全扫描
```

### 8.2 合并条件

```yaml
自动检查:
  - CI全部通过
  - 无冲突
  - 至少1个Approve
  - 架构师Approve (架构变更)

人工检查:
  - 所有Comment已处理
  - 文档已更新
  - CHANGELOG已更新
```

---

## 9. 紧急情况处理

### 9.1 生产事故

```yaml
响应流程:
  1. 发现问题 (0-5分钟)
     - 监控告警
     - 用户反馈
     - 确认影响范围

  2. 快速止损 (5-30分钟)
     - 回滚版本
     - 降级服务
     - 临时修复

  3. 根因分析 (30分钟-2小时)
     - 日志分析
     - 定位代码
     - 分析原因

  4. 彻底修复 (2-24小时)
     - 编写修复代码
     - 添加测试用例
     - Code Review
     - 部署上线

  5. 复盘总结 (24小时内)
     - 编写事故报告
     - 改进措施
     - 更新文档
```

### 9.2 Hotfix流程

```bash
# 1. 创建hotfix分支
git checkout main
git pull
git checkout -b hotfix/xxx

# 2. 快速修复
# - 只修复紧急问题
# - 添加必要测试
# - 最小化变更

# 3. 快速审查
# - 架构师快速Review
# - 重点检查安全性

# 4. 合并发布
# - 合并到main
# - 打tag
# - 自动部署

# 5. 同步回develop
git checkout develop
git merge hotfix/xxx
```

---

## 10. 知识管理

### 10.1 知识库

```yaml
技术栈:
  - TypeScript最佳实践
  - NestJS开发指南
  - React/Next.js指南
  - 数据库设计规范

业务领域:
  - Agent协议详解
  - 消息系统设计
  - 任务协作流程

工具使用:
  - Git工作流
  - Docker使用
  - 监控系统
```

### 10.2 知识共享

```yaml
定期分享:
  - 每周技术分享
  - 代码走查会议
  - 问题复盘会

文档沉淀:
  - 技术方案文档
  - 最佳实践
  - 踩坑记录

代码示例:
  - 模块示例
  - 组件示例
  - 集成示例
```

---

## 11. 性能基准

### 11.1 性能目标

```yaml
API响应时间:
  - P50 < 100ms
  - P95 < 500ms
  - P99 < 1000ms

WebSocket:
  - 连接建立 < 100ms
  - 消息延迟 < 50ms

数据库:
  - 查询 < 50ms
  - 写入 < 100ms

前端:
  - 首屏加载 < 2s
  - 路由切换 < 300ms
```

### 11.2 性能测试

```yaml
负载测试:
  - 并发用户: 1000
  - QPS: 10000
  - 持续时间: 10分钟

压力测试:
  - 逐步加压
  - 找到性能瓶颈
  - 记录极限值

稳定性测试:
  - 长时间运行
  - 内存泄漏检查
  - 资源使用监控
```

---

## 12. 安全规范

### 12.1 安全检查

```yaml
代码层面:
  - 输入验证
  - SQL注入防护
  - XSS防护
  - CSRF防护
  - 敏感信息加密

配置层面:
  - 环境变量管理
  - 密钥轮换
  - 权限最小化

部署层面:
  - HTTPS强制
  - 安全头配置
  - 依赖漏洞扫描
```

### 12.2 安全审查

```yaml
PR审查:
  - 检查权限控制
  - 检查数据验证
  - 检查敏感信息

定期审查:
  - 依赖更新
  - 漏洞扫描
  - 权限审计
```

---

## 13. 监控告警

### 13.1 监控指标

```yaml
系统指标:
  - CPU/内存/磁盘使用率
  - 网络流量
  - 进程状态

应用指标:
  - 请求QPS
  - 响应时间
  - 错误率
  - 并发数

业务指标:
  - 活跃用户数
  - 消息发送量
  - Agent在线数
```

### 13.2 告警规则

```yaml
P0 (紧急):
  - 服务不可用
  - 错误率 > 10%
  - 响应时间 > 5s

P1 (高):
  - CPU > 80%
  - 内存 > 90%
  - 磁盘 > 85%

P2 (中):
  - 慢查询 > 1s
  - 队列积压

P3 (低):
  - 轻微性能下降
```

---

## 14. 工具推荐

### 14.1 开发工具

```yaml
IDE:
  - VSCode (推荐)
  - WebStorm

VSCode插件:
  - ESLint
  - Prettier
  - TypeScript Hero
  - GitLens
  - REST Client

命令行工具:
  - pnpm
  - turbo
  - nx (可选)
```

### 14.2 辅助工具

```yaml
API测试:
  - Postman
  - REST Client (VSCode)

数据库工具:
  - Prisma Studio
  - DBeaver

监控工具:
  - Prometheus + Grafana
  - ELK Stack

文档工具:
  - Swagger
  - Storybook (前端组件)
```

---

## 15. 协作示例

### 15.1 新增功能示例

**场景**: 添加消息反应（Reaction）功能

**Step 1**: 创建Issue
```markdown
Title: feat(message): add message reaction feature

Description:
- Support emoji reactions on messages
- Display reaction count
- Notify message sender

Labels: feature
Assignee: @backend-dev, @frontend-dev
Milestone: v1.1
```

**Step 2**: 技术方案（架构师）
```markdown
## 技术方案

### 数据模型
- 新增 Reaction 表
- 关联 Message 和 User

### API设计
- POST /messages/:id/reactions
- DELETE /messages/:id/reactions/:emoji

### 模块划分
- 后端: message模块扩展
- 前端: MessageItem组件扩展

### 领域事件
- MessageReacted
- ReactionRemoved
```

**Step 3**: 后端开发
```bash
# 后端开发者
git checkout -b feat/message-reaction

# 1. 扩展数据模型
# prisma/schema.prisma

# 2. 实现领域层
# modules/message/domain/entities/reaction.entity.ts

# 3. 实现应用层
# modules/message/application/use-cases/add-reaction.use-case.ts

# 4. 实现接口层
# modules/message/interfaces/controllers/reaction.controller.ts

# 5. 编写测试
# modules/message/*.spec.ts
```

**Step 4**: 前端开发
```bash
# 前端开发者
git checkout -b feat/message-reaction-ui

# 1. 更新类型
# types/message.ts

# 2. 实现组件
# components/business/MessageItem/ReactionPicker.tsx

# 3. 集成API
# services/messageService.ts

# 4. 编写测试
# components/business/MessageItem/*.test.tsx
```

**Step 5**: 提交PR
```bash
# 后端PR
Title: feat(message): add reaction API

# 前端PR (依赖后端PR)
Title: feat(web): add reaction UI

# CI自动检查
# 架构师审查
# 同行审查
```

---

## 16. 常见问题

### Q1: 如何处理跨模块依赖？
```yaml
正确做法:
  - 通过依赖注入
  - 发布/订阅事件
  - 使用消息队列

错误做法:
  - 直接导入其他模块
  - 访问其他模块的数据库表
```

### Q2: 如何保证代码质量？
```yaml
自动化:
  - ESLint + Prettier
  - TypeScript严格模式
  - 单元测试覆盖

人工审查:
  - 代码审查
  - 架构审查
  - 安全审查
```

### Q3: 如何处理技术债务？
```yaml
记录:
  - 创建Issue
  - 标记 tech-debt
  - 评估优先级

计划:
  - 每个迭代预留时间
  - 逐步重构
  - 添加测试
```

---

*文档版本: v1.0*
*最后更新: 2026-03-14*
