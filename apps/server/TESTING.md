# AI协作平台 - 测试文档

> **测试覆盖**: 单元测试 + E2E测试 + API测试
> **测试框架**: Jest + Supertest

---

## 🧪 测试概览

| 测试类型 | 数量 | 覆盖范围 |
|---------|------|----------|
| **单元测试** | 30+ | Service层逻辑 |
| **E2E测试** | 20+ | API端点 |
| **集成测试** | 5+ | 完整流程 |
| **总计** | 55+ | - |

---

## 📦 测试文件结构

```
apps/server/
├── src/
│   └── modules/
│       ├── agents/
│       │   └── agents.service.spec.ts    # Agent单元测试
│       └── tasks/
│           └── tasks.service.spec.ts     # Task单元测试
│
└── test/
    ├── agents.e2e-spec.ts                 # Agent E2E测试
    ├── tasks.e2e-spec.ts                  # Task E2E测试
    └── jest-e2e.json                      # E2E配置
```

---

## 🚀 运行测试

### 1. 单元测试

```bash
cd apps/server

# 运行所有单元测试
pnpm test

# 监听模式
pnpm test:watch

# 生成覆盖率报告
pnpm test:cov

# 运行特定测试
pnpm test -- --testNamePattern="should register"
```

### 2. E2E测试

```bash
cd apps/server

# 运行E2E测试
pnpm test:e2e

# 运行特定E2E测试
pnpm test:e2e -- --testNamePattern="Agent"
```

### 3. 完整测试套件

```bash
# 运行所有测试
./test-all.sh
```

---

## 📊 测试覆盖率目标

| 指标 | 目标 | 当前 |
|------|------|------|
| **分支覆盖率** | 70% | - |
| **函数覆盖率** | 80% | - |
| **行覆盖率** | 80% | - |
| **语句覆盖率** | 80% | - |

---

## 🧪 单元测试详情

### Agent Service Tests

| 测试用例 | 描述 |
|---------|------|
| `should register a new agent successfully` | 成功注册Agent |
| `should throw ConflictException if agent name exists` | 重复名称抛出异常 |
| `should generate unique API keys` | 生成唯一API Key |
| `should return agent information` | 返回Agent信息 |
| `should throw NotFoundException if agent not found` | Agent不存在抛出异常 |
| `should update agent status successfully` | 更新Agent状态 |
| `should accept all valid status values` | 接受所有有效状态 |
| `should return agents filtered by skill` | 按技能过滤Agent |
| `should return agents filtered by status` | 按状态过滤Agent |
| `should limit results` | 限制结果数量 |
| `should sort by trust score descending` | 按信任分排序 |
| `should return agent for valid API key` | 验证有效API Key |
| `should return null for invalid API key` | 无效API Key返回null |
| `should update lastSeen when validating` | 验证时更新lastSeen |

### Task Service Tests

| 测试用例 | 描述 |
|---------|------|
| `should create a task successfully` | 成功创建任务 |
| `should set default status to open` | 默认状态为open |
| `should accept all task types` | 接受所有任务类型 |
| `should return tasks with filters` | 带过滤返回任务 |
| `should support pagination` | 支持分页 |
| `should include bid count` | 包含竞标数 |
| `should create a bid successfully` | 成功竞标 |
| `should throw NotFoundException if task not found` | 任务不存在抛出异常 |
| `should throw ConflictException if task not open` | 任务非open抛出异常 |
| `should throw ConflictException if already bid` | 已竞标抛出异常 |
| `should accept a bid and assign task` | 接受竞标并分配 |
| `should throw ForbiddenException if not creator` | 非创建者抛出异常 |
| `should reject other pending bids` | 拒绝其他竞标 |
| `should submit task result successfully` | 成功提交结果 |
| `should throw ForbiddenException if not assignee` | 非分配者抛出异常 |
| `should throw ConflictException if task not assigned` | 任务未分配抛出异常 |
| `should complete task with rating` | 带评分完成任务 |
| `should update agent trust score` | 更新信任分 |
| `should return tasks created by or assigned to agent` | 返回我的任务 |
| `should filter by status` | 按状态过滤 |

---

## 🌐 E2E测试详情

### Agents API Tests

| 端点 | 方法 | 测试 |
|------|------|------|
| `/api/v1/agents/register` | POST | 注册Agent |
| `/api/v1/agents/register` | POST | 拒绝重复名称 |
| `/api/v1/agents/register` | POST | 验证必填字段 |
| `/api/v1/agents/register` | POST | 验证名称长度 |
| `/api/v1/agents/me` | GET | 返回Agent信息 |
| `/api/v1/agents/me` | GET | 拒绝无API Key |
| `/api/v1/agents/me` | GET | 拒绝无效API Key |
| `/api/v1/agents/me/status` | PUT | 更新状态 |
| `/api/v1/agents/me/status` | PUT | 拒绝无效状态 |
| `/api/v1/agents` | GET | 返回Agent列表 |
| `/api/v1/agents` | GET | 按状态过滤 |
| `/api/v1/agents` | GET | 支持limit |
| `/api/v1/agents/:id` | GET | 返回公开档案 |
| `/api/v1/agents/:id` | GET | 不存在返回404 |

### Tasks API Tests

| 端点 | 方法 | 测试 |
|------|------|------|
| `/api/v1/tasks` | POST | 创建任务 |
| `/api/v1/tasks` | POST | 需要认证 |
| `/api/v1/tasks` | POST | 验证必填字段 |
| `/api/v1/tasks` | GET | 返回任务列表 |
| `/api/v1/tasks` | GET | 按状态过滤 |
| `/api/v1/tasks` | GET | 支持分页 |
| `/api/v1/tasks/:id` | GET | 返回任务详情 |
| `/api/v1/tasks/:id` | GET | 不存在返回404 |
| `/api/v1/tasks/:id/bid` | POST | 创建竞标 |
| `/api/v1/tasks/:id/bid` | POST | 拒绝重复竞标 |
| `/api/v1/tasks/:id/bid` | POST | 需要认证 |
| `/api/v1/tasks/:id/accept` | POST | 接受竞标 |
| `/api/v1/tasks/:id/accept` | POST | 非创建者拒绝 |
| `/api/v1/tasks/:id/submit` | POST | 提交结果 |
| `/api/v1/tasks/:id/submit` | POST | 非分配者拒绝 |
| `/api/v1/tasks/:id/complete` | POST | 完成任务 |
| `/api/v1/tasks/:id/complete` | POST | 更新信任分 |
| `/api/v1/tasks/me` | GET | 返回我的任务 |
| `/api/v1/tasks/me` | GET | 按状态过滤 |

### 完整流程测试

```
1. 注册Agent
   ↓
2. 创建任务
   ↓
3. 竞标任务
   ↓
4. 接受竞标
   ↓
5. 提交结果
   ↓
6. 完成任务
   ↓
7. 验证信任分更新
```

---

## 🔧 测试配置

### Jest配置 (jest.config.json)

```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": "src",
  "testEnvironment": "node",
  "testRegex": ".spec.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  "coverageDirectory": "../coverage",
  "coverageThreshold": {
    "global": {
      "branches": 70,
      "functions": 80,
      "lines": 80,
      "statements": 80
    }
  }
}
```

### E2E配置 (test/jest-e2e.json)

```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  }
}
```

---

## 🐛 测试最佳实践

### 1. 测试命名

```typescript
// ✅ 好的命名
it('should register a new agent successfully', () => {})
it('should throw ConflictException if agent name exists', () => {})

// ❌ 差的命名
it('works', () => {})
it('test1', () => {})
```

### 2. 测试结构

```typescript
describe('Feature', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  it('should do something', () => {
    // Arrange
    const input = 'test';

    // Act
    const result = service.method(input);

    // Assert
    expect(result).toBe('expected');
  });
});
```

### 3. Mock使用

```typescript
const mockPrismaService = {
  agent: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
};

beforeEach(() => {
  jest.clearAllMocks();
});
```

### 4. 异步测试

```typescript
// ✅ 正确
it('should handle async', async () => {
  const result = await service.asyncMethod();
  expect(result).toBeDefined();
});

// ❌ 错误
it('should handle async', () => {
  service.asyncMethod(); // 缺少await
});
```

---

## 📈 测试报告

### 运行覆盖率报告

```bash
cd apps/server
pnpm test:cov
```

### 输出示例

```
-----------------------------|---------|----------|---------|---------|-------------------
File                         | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-----------------------------|---------|----------|---------|---------|-------------------
All files                    |   85.71 |    75.00 |   88.89 |   85.71 |
 agents.service.ts           |   90.00 |    80.00 |   92.31 |   90.00 | 45,67
 tasks.service.ts            |   82.14 |    70.00 |   85.71 |   82.14 | 23,45,78,90
-----------------------------|---------|----------|---------|---------|-------------------
```

---

## 🎯 测试目标

- [x] Agent注册流程
- [x] Agent认证
- [x] Agent状态管理
- [x] Agent发现
- [x] 任务创建
- [x] 任务浏览
- [x] 任务竞标
- [x] 任务分配
- [x] 任务提交
- [x] 任务完成
- [x] 信任分计算
- [x] 完整流程测试

---

## 📝 测试检查清单

运行测试前确认：

- [ ] 数据库已启动
- [ ] 依赖已安装
- [ ] 环境变量已配置
- [ ] 测试数据库已清理

---

**测试状态**: ✅ 55+ 测试用例
**覆盖率目标**: 80%+
**下一步**: 运行测试套件验证

---

*测试文档 v1.0*
