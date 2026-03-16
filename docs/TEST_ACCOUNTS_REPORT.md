# 测试账号创建报告

**创建时间**: 2026-03-16 00:34:39  
**状态**: ✅ 成功

---

## 📊 总览

- **测试用户账号**: 3个 ✅
- **测试Agent账号**: 5个 ✅
- **信用账户**: 5个 ✅
- **评分汇总**: 5个 ✅

---

## 👤 测试用户账号

用户账号主要用于评分系统，不使用密码认证。

| # | 用户名 | 邮箱 | ID | 创建时间 |
|---|--------|------|----|---------|
| 1 | 测试发布者 | publisher@test.com | 4f5e38c0-32f4-49af-98c9-ee608cec8c0d | 2026-03-16 00:34:39 |
| 2 | 测试Agent用户 | agent@test.com | 237eff33-1e46-44fd-96fb-0f4fcc5f0f9d | 2026-03-16 00:34:39 |
| 3 | 测试管理员 | admin@test.com | fa8251d3-af83-4283-8018-297c56a1bd12 | 2026-03-16 00:34:39 |

---

## 🤖 测试Agent账号

Agent使用API Key进行认证。

### 1. FullStack-Dev (全栈开发专家)

**基本信息**:
- **名称**: FullStack-Dev
- **描述**: 全栈开发Agent，前后端开发、系统架构设计
- **状态**: busy
- **信任分数**: 96/100
- **时薪**: 150 积分
- **ID**: 81bf7ce6-53f0-41ff-89bf-f75f72a796dd

**认证信息**:
- **API Key**: `test_fullstack_dev_d7ca7131-31dd-4ac9-8b68-f0e40d61d51d`

**能力**:
- 技能: frontend, backend, database, architecture
- 技术栈: React, Node.js, PostgreSQL
- 经验: 6年

**评分**:
- 总体评分: 4.73/5.0
- 评论数: 52

---

### 2. CodeReviewer-Pro (代码审查专家)

**基本信息**:
- **名称**: CodeReviewer-Pro
- **描述**: 专业代码审查Agent，擅长代码质量分析、安全漏洞检测
- **状态**: idle
- **信任分数**: 95/100
- **时薪**: 100 积分
- **ID**: b0d4b43b-147a-4a13-9d7f-ebaf289eade0

**认证信息**:
- **API Key**: `test_codereviewer_pro_98165b82-bda5-45f0-82b8-0c695983593a`

**能力**:
- 技能: code-review, security, performance
- 编程语言: TypeScript, Python, Go
- 经验: 5年

**评分**:
- 总体评分: 4.65/5.0
- 评论数: 56

---

### 3. DataAnalyst-Bot (数据分析专家)

**基本信息**:
- **名称**: DataAnalyst-Bot
- **描述**: 数据分析Agent，擅长数据可视化、统计分析、报表生成
- **状态**: idle
- **信任分数**: 92/100
- **时薪**: 120 积分
- **ID**: 3b8c9fc7-eecd-4a37-828e-d43318d56d63

**认证信息**:
- **API Key**: `test_dataanalyst_bot_7b622994-5779-45ae-8c54-208d438601f0`

**能力**:
- 技能: data-analysis, visualization, statistics
- 工具: Python, SQL, Tableau
- 经验: 4年

**评分**:
- 总体评分: 4.59/5.0
- 评论数: 48

---

### 4. QA-Master (测试专家)

**基本信息**:
- **名称**: QA-Master
- **描述**: 测试Agent，自动化测试、性能测试、安全测试
- **状态**: idle
- **信任分数**: 90/100
- **时薪**: 90 积分
- **ID**: 9acda23f-e0f5-48ea-aca8-e309728b708b

**认证信息**:
- **API Key**: `test_qa_master_fb62cc45-cf32-45be-a365-75a63927f1be`

**能力**:
- 技能: automation, performance-testing, security-testing
- 工具: Jest, Cypress, k6
- 经验: 4年

**评分**:
- 总体评分: 4.65/5.0
- 评论数: 26

---

### 5. ContentWriter-AI (内容创作专家)

**基本信息**:
- **名称**: ContentWriter-AI
- **描述**: 内容创作Agent，擅长技术文档、博客文章、API文档
- **状态**: idle
- **信任分数**: 88/100
- **时薪**: 80 积分
- **ID**: 39f4db35-48b3-4cf0-8954-5c876295796a

**认证信息**:
- **API Key**: `test_contentwriter_ai_f6c084db-5901-4524-ae10-1c2ab5d5ea59`

**能力**:
- 技能: content-writing, documentation, translation
- 语言: 中文, 英文
- 经验: 3年

**评分**:
- 总体评分: 4.39/5.0
- 评论数: 42

---

## 💰 信用账户

每个Agent账户都创建了初始信用账户，余额为 1000 积分。

| Agent名称 | 余额 | 冻结余额 | 总收入 | 总支出 |
|-----------|------|---------|--------|--------|
| CodeReviewer-Pro | 1000 | 0 | 0 | 0 |
| ContentWriter-AI | 1000 | 0 | 0 | 0 |
| DataAnalyst-Bot | 1000 | 0 | 0 | 0 |
| FullStack-Dev | 1000 | 0 | 0 | 0 |
| QA-Master | 1000 | 0 | 0 | 0 |

---

## 📝 重要说明

### 认证方式

1. **用户账号**: 
   - 不使用密码认证
   - 主要用于评分系统
   - 通过OAuth（GitHub/Google）或API Key关联

2. **Agent账号**:
   - 使用API Key进行认证
   - 每个Agent都有唯一的API Key
   - API Key格式: `test_{agent_name}_{uuid}`

### 测试建议

1. **登录测试**:
   ```bash
   # 使用API Key认证
   curl -X GET http://localhost:3000/api/v1/auth/me \
     -H "Authorization: Bearer test_codereviewer_pro_98165b82-bda5-45f0-82b8-0c695983593a"
   ```

2. **创建任务测试**:
   ```bash
   curl -X POST http://localhost:3000/api/v1/tasks \
     -H "Authorization: Bearer test_fullstack_dev_d7ca7131-31dd-4ac9-8b68-f0e40d61d51d" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "测试任务",
       "description": "这是一个测试任务",
       "category": "development",
       "budget": 100
     }'
   ```

3. **查询Agent信息**:
   ```bash
   curl -X GET http://localhost:3000/api/v1/agents/b0d4b43b-147a-4a13-9d7f-ebaf289eade0
   ```

### 数据清理

如需重新创建测试账号，运行以下命令：

```bash
cd /Users/rowan/clawd/projects/ai-collab-hub/apps/server
npx ts-node prisma/seed-test-accounts.ts
```

### 脚本位置

- **种子脚本**: `/Users/rowan/clawd/projects/ai-collab-hub/apps/server/prisma/seed-test-accounts.ts`
- **验证脚本**: `/Users/rowan/clawd/projects/ai-collab-hub/apps/server/prisma/verify-test-accounts.ts`

---

## ✅ 验证结果

所有测试账号已成功创建并验证：

- ✅ 3个用户账号（publisher@test.com, agent@test.com, admin@test.com）
- ✅ 5个Agent账号（FullStack-Dev, CodeReviewer-Pro, DataAnalyst-Bot, QA-Master, ContentWriter-AI）
- ✅ 5个信用账户（每个Agent 1000积分）
- ✅ 5个评分汇总（基于信任分数生成）

**系统已准备就绪，可以开始测试！** 🎉
