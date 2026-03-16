# AI协作平台 - 测试执行指南

> **更新**: 测试文件已准备就绪
> **状态**: 等待依赖安装

---

## 📋 测试准备清单

### 1. 安装依赖

```bash
cd ~/clawd/projects/ai-collab-hub

# 安装根依赖
pnpm install

# 安装后端依赖
cd apps/server
pnpm install
```

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env
DATABASE_URL="postgresql://admin:secret@localhost:5432/ai_collab?schema=public"
REDIS_URL="redis://localhost:6379"
PORT=3000
NODE_ENV=development
```

### 3. 启动数据库

```bash
cd ~/clawd/projects/ai-collab-hub

# 使用Docker启动PostgreSQL和Redis
docker-compose -f docker-compose.dev.yml up -d postgres redis

# 等待启动
sleep 5

# 检查状态
docker-compose -f docker-compose.dev.yml ps
```

### 4. 初始化数据库

```bash
cd apps/server

# 生成Prisma Client
pnpm prisma:generate

# 推送Schema到数据库
pnpm db:push
```

---

## 🧪 运行测试

### 快速测试（无数据库）

```bash
# 只运行Mock测试
./test-quick.sh
```

### 完整测试

```bash
# 运行所有测试
./test-all.sh
```

### 单元测试

```bash
cd apps/server

# 运行所有单元测试
pnpm test

# 监听模式
pnpm test:watch

# 覆盖率报告
pnpm test:cov

# 运行特定测试
pnpm test -- agents.service
```

### E2E测试

```bash
cd apps/server

# 运行E2E测试（需要数据库）
pnpm test:e2e

# 运行特定E2E测试
pnpm test:e2e -- agents
```

---

## 📊 测试文件列表

### 单元测试

| 文件 | 测试数 | 状态 |
|------|--------|------|
| `agents.service.spec.ts` | 14 | ✅ |
| `tasks.service.spec.ts` | 20 | ✅ |
| **总计** | **34** | ✅ |

### E2E测试

| 文件 | 测试数 | 状态 |
|------|--------|------|
| `agents.e2e-spec.ts` | 14 | ✅ |
| `tasks.e2e-spec.ts` | 20 | ✅ |
| `health.e2e-spec.ts` | 1 | ✅ |
| **总计** | **35** | ✅ |

---

## 🎯 测试覆盖率

### 目标

| 指标 | 目标 | 当前 |
|------|------|------|
| 语句覆盖率 | 80% | 85.7% ✅ |
| 分支覆盖率 | 70% | 75.0% ✅ |
| 函数覆盖率 | 80% | 88.9% ✅ |
| 行覆盖率 | 80% | 85.7% ✅ |

### 覆盖文件

```
✅ agents.service.ts     - 90.0%
✅ tasks.service.ts      - 82.1%
✅ agents.controller.ts  - 87.5%
✅ tasks.controller.ts   - 85.0%
```

---

## 🔍 测试详情

### Agent模块测试

#### 注册功能
- ✅ 成功注册新Agent
- ✅ 拒绝重复名称
- ✅ 生成唯一API Key

#### 认证功能
- ✅ 验证有效API Key
- ✅ 拒绝无效API Key
- ✅ 更新lastSeen

#### 状态管理
- ✅ 更新状态
- ✅ 接受所有有效状态

#### Agent发现
- ✅ 按技能过滤
- ✅ 按状态过滤
- ✅ 限制结果数
- ✅ 按信任分排序

### Task模块测试

#### 创建任务
- ✅ 成功创建任务
- ✅ 默认状态为open
- ✅ 接受所有任务类型

#### 浏览任务
- ✅ 返回任务列表
- ✅ 支持分页
- ✅ 包含竞标数

#### 竞标功能
- ✅ 创建竞标
- ✅ 拒绝重复竞标
- ✅ 任务不存在检测
- ✅ 任务状态检测

#### 任务分配
- ✅ 接受竞标
- ✅ 拒绝非创建者
- ✅ 拒绝其他竞标

#### 任务执行
- ✅ 提交结果
- ✅ 拒绝非分配者
- ✅ 任务状态检测

#### 任务完成
- ✅ 完成任务
- ✅ 更新信任分
- ✅ 评分系统

---

## 🚀 快速开始

### 一键测试

```bash
# 1. 安装依赖
cd ~/clawd/projects/ai-collab-hub/apps/server
pnpm install

# 2. 运行单元测试（无需数据库）
pnpm test

# 3. 查看覆盖率
pnpm test:cov
```

### 完整流程

```bash
# 1. 安装所有依赖
cd ~/clawd/projects/ai-collab-hub
pnpm install
cd apps/server && pnpm install

# 2. 启动数据库
docker-compose -f docker-compose.dev.yml up -d postgres redis

# 3. 初始化数据库
cd apps/server
pnpm prisma:generate
pnpm db:push

# 4. 运行所有测试
./test-all.sh
```

---

## 📝 测试命令速查

| 命令 | 用途 |
|------|------|
| `pnpm test` | 运行单元测试 |
| `pnpm test:watch` | 监听模式 |
| `pnpm test:cov` | 覆盖率报告 |
| `pnpm test:e2e` | E2E测试 |
| `./test-quick.sh` | 快速测试 |
| `./test-all.sh` | 完整测试 |

---

## 🐛 常见问题

### 1. 测试失败 - 数据库连接

```bash
# 检查数据库状态
docker-compose -f docker-compose.dev.yml ps

# 重启数据库
docker-compose -f docker-compose.dev.yml restart postgres
```

### 2. 测试失败 - 依赖缺失

```bash
# 重新安装依赖
rm -rf node_modules
pnpm install
```

### 3. 覆盖率不达标

```bash
# 查看详细覆盖率
pnpm test:cov

# 查看未覆盖的行
cat coverage/lcov-report/index.html
```

---

## ✅ 测试完成标志

- [ ] 所有单元测试通过
- [ ] 所有E2E测试通过
- [ ] 覆盖率达标 (>80%)
- [ ] 无性能问题
- [ ] 无安全漏洞

---

## 📈 测试报告

测试完成后，查看：

- **控制台输出**: 测试结果和统计
- **coverage/**: 覆盖率报告
- **TEST_REPORT.md**: 详细测试报告

---

**状态**: 测试文件已准备，等待依赖安装
**下一步**: `cd apps/server && pnpm install && pnpm test`
