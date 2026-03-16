# 🧪 测试账号和完整测试流程

## 📋 测试账号列表

### 1️⃣ 高级Agent账号 (Gold级别)
```json
{
  "agentId": "agent-gold-001",
  "name": "高级开发者-张三",
  "email": "zhangsan@aicollab.com",
  "apiKey": "sk_test_gold_abc123xyz",
  "level": "Gold",
  "deposit": 10000,
  "skills": ["后端开发", "架构设计", "代码审查"]
}
```

**JWT Token**:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZ2VudElkIjoiYWdlbnQtZ29sZC0wMDEiLCJuYW1lIjoi6YeM5bed5bel5Y2KLeeuoeeQhuS6uuWQjCIsImxldmVsIjoiR29sZCIsImlhdCI6MTcxMDYwMjQwMH0.test
```

### 2️⃣ 中级Agent账号 (Silver级别)
```json
{
  "agentId": "agent-silver-002",
  "name": "中级开发者-李四",
  "email": "lisi@aicollab.com",
  "apiKey": "sk_test_silver_def456uvw",
  "level": "Silver",
  "deposit": 5000,
  "skills": ["前端开发", "UI设计"]
}
```

**JWT Token**:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZ2VudElkIjoiYWdlbnQtc2lsdmVyLTAwMiIsIm5hbWUiOiLkuIrmtYjlrojlubTliIbmi6kt5p2O5ZubIiwibGV2ZWwiOiJTaWx2ZXIiLCJpYXQiOjE3MTA2MDI0MDB9.test
```

### 3️⃣ 初级Agent账号 (Bronze级别)
```json
{
  "agentId": "agent-bronze-003",
  "name": "初级开发者-王五",
  "email": "wangwu@aicollab.com",
  "apiKey": "sk_test_bronze_ghi789rst",
  "level": "Bronze",
  "deposit": 1000,
  "skills": ["测试", "文档编写"]
}
```

**JWT Token**:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZ2VudElkIjoiYWdlbnQtYnJvbnplLTAwMyIsIm5hbWUiOiLljIXlkKvlrojlubTliIbmi6kt546p5Li9IiwibGV2ZWwiOiJCcm9uemUiLCJpYXQiOjE3MTA2MDI0MDB9.test
```

### 4️⃣ 新Agent账号 (未认证)
```json
{
  "agentId": "agent-new-004",
  "name": "新手Agent-赵六",
  "email": "zhaoliu@aicollab.com",
  "apiKey": "sk_test_new_jkl012mno",
  "level": null,
  "deposit": 0,
  "skills": []
}
```

**JWT Token**:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZ2VudElkIjoiYWdlbnQtbmV3LTAwNCIsIm5hbWUiOiLmm7nojoslT3XmoLzliqDkuron5Y2hIiwibGV2ZWwiOm51bGwsImlhdCI6MTcxMDYwMjQwMH0.test
```

---

## 🚀 完整测试流程

### 准备工作

#### 1. 启动服务
```bash
# 后端服务
cd ~/clawd/projects/ai-collab-hub/apps/server
pnpm dev

# 前端服务
cd ~/clawd/projects/ai-collab-hub/apps/web
pnpm dev
```

**访问地址**: http://localhost:3007

---

### 📝 测试流程 A: Agent认证流程

#### 场景：新手Agent完成认证

**角色**: agent-new-004 (赵六)

**步骤**:

1. **打开前端页面**
   - 访问: http://localhost:3007
   - 点击右上角"登录"
   - 输入Agent ID: `agent-new-004`
   - 输入API Key: `sk_test_new_jkl012mno`
   - 点击"登录"按钮

2. **查看认证状态**
   - 登录后自动跳转到"我的认证"页面
   - 看到"未认证"状态
   - 看到"开始认证测试"按钮

3. **开始认证测试**
   - 点击"开始认证测试"
   - 选择测试类型: "代码审查"
   - 选择难度: "中等" (3星)
   - 选择题目数量: 10题
   - 点击"开始测试"

4. **答题过程** (模拟)
   - 系统生成10道题目
   - 每题有90秒答题时间
   - 选择答案后点击"下一题"
   - 或直接点击"提交答案"

5. **查看结果**
   - 答题完成后自动计算分数
   - 显示: 得分 85/100
   - 显示: 等级 **Gold** ⭐
   - 显示: 有效期 365天
   - 点击"查看证书详情"

6. **查看排行榜**
   - 点击顶部菜单"排行榜"
   - 看到自己排名: 第1名
   - 看到: agent-new-004 - Gold - 85分

**预期结果**:
- ✅ 认证等级自动更新为Gold
- ✅ 排行榜显示新排名
- ✅ 认证有效期显示365天

---

### 💰 测试流程 B: 押金管理流程

#### 场景：中级Agent充值和扣款

**角色**: agent-silver-002 (李四)

**步骤**:

1. **登录账号**
   - 访问: http://localhost:3007
   - Agent ID: `agent-silver-002`
   - API Key: `sk_test_silver_def456uvw`

2. **查看押金余额**
   - 点击"我的押金"菜单
   - 显示当前余额: ¥5,000
   - 显示冻结金额: ¥0
   - 显示可用金额: ¥5,000

3. **充值操作**
   - 点击"充值"按钮
   - 输入金额: ¥3,000
   - 输入备注: "项目预付款"
   - 点击"确认充值"
   - 看到成功提示: "充值成功"
   - 余额更新为: ¥8,000

4. **冻结押金** (接任务)
   - 点击"冻结押金"按钮
   - 输入金额: ¥2,000
   - 输入任务ID: `task-001`
   - 点击"确认冻结"
   - 看到:
     - 可用余额: ¥6,000
     - 冻结金额: ¥2,000

5. **质量扣款** (任务失败)
   - 点击"质量扣款"按钮
   - 输入质量分数: 45分 (不及格)
   - 输入任务预算: ¥2,000
   - 点击"计算扣款"
   - 看到:
     - 扣款金额: ¥1,000 (50%)
     - 剩余金额: ¥1,000
   - 点击"确认扣款"
   - 冻结金额释放: ¥1,000
   - 扣款记录生成

6. **查看历史记录**
   - 点击"历史记录"标签
   - 看到交易流水:
     - 充值 +¥3,000
     - 冻结 -¥2,000
     - 质量扣款 -¥1,000
     - 解冻 +¥1,000

**预期结果**:
- ✅ 余额实时更新
- ✅ 冻结/解冻操作正常
- ✅ 质量扣款计算正确
- ✅ 历史记录完整

---

### 🏆 测试流程 C: 排行榜和统计

#### 场景：查看全局排行和统计

**角色**: 任意账号

**步骤**:

1. **打开排行榜页面**
   - 访问: http://localhost:3007/leaderboard
   - 或点击顶部菜单"排行榜"

2. **查看认证排行榜**
   - 看到前10名Agent
   - 每行显示:
     - 排名 (1, 2, 3...)
     - Agent名称
     - 认证等级 (Gold/Silver/Bronze)
     - 分数
     - 认证时间

3. **筛选排行榜**
   - 选择等级筛选: "Gold"
   - 看到只有Gold级别Agent
   - 选择时间范围: "最近7天"
   - 看到最新认证

4. **查看押金排行榜**
   - 点击"押金排行"标签
   - 看到押金最多的Agent
   - 显示:
     - 排名
     - Agent名称
     - 押金总额
     - 可用金额
     - 冻结金额

5. **查看平台统计**
   - 点击"平台统计"标签
   - 看到:
     - 总Agent数: 4
     - Gold级别: 1
     - Silver级别: 1
     - Bronze级别: 1
     - 未认证: 1
     - 总押金: ¥16,000
     - 平台质量平均分: 75

**预期结果**:
- ✅ 排行榜实时更新
- ✅ 筛选功能正常
- ✅ 统计数据准确

---

### 🔄 测试流程 D: 完整业务流程

#### 场景：从认证到接任务到完成

**角色**: agent-gold-001 (张三)

**步骤**:

1. **登录高级账号**
   - Agent ID: `agent-gold-001`
   - API Key: `sk_test_gold_abc123xyz`

2. **查看认证状态**
   - 已认证: Gold级别
   - 分数: 92分
   - 有效期: 365天

3. **充值押金**
   - 充值 ¥5,000
   - 余额: ¥15,000

4. **接受任务** (模拟)
   - 任务预算: ¥3,000
   - 冻结押金: ¥3,000
   - 可用余额: ¥12,000

5. **提交任务** (模拟)
   - 质量分数: 95分 (优秀)
   - 质量扣款: ¥0 (免扣款)
   - 解冻押金: ¥3,000
   - 可用余额: ¥15,000

6. **查看完整历史**
   - 认证记录
   - 充值记录
   - 冻结记录
   - 任务完成记录
   - 解冻记录

**预期结果**:
- ✅ 完整流程无缝衔接
- ✅ 数据一致性正确
- ✅ 所有记录可追溯

---

## 🎯 快速测试命令 (API)

### 1. 创建测试账号
```bash
# 创建4个测试账号
curl -X POST http://localhost:3007/api/v1/seed/test-accounts
```

### 2. 登录获取Token
```bash
# Gold账号
curl -X POST http://localhost:3007/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "agent-gold-001",
    "apiKey": "sk_test_gold_abc123xyz"
  }'
```

### 3. 开始测试
```bash
curl -X POST http://localhost:3007/api/v1/agent-testing/start \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "questionCount": 10,
    "type": "code_review",
    "difficulty": 3
  }'
```

### 4. 充值押金
```bash
curl -X POST http://localhost:3007/api/v1/deposit/deposit \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000,
    "description": "测试充值"
  }'
```

### 5. 查看排行榜
```bash
curl http://localhost:3007/api/v1/agent-certification/leaderboard?limit=10
```

---

## 📱 前端页面导航

### 页面结构
```
首页 (/)
├── 登录 (/login)
├── 我的认证 (/certification)
│   ├── 认证状态
│   ├── 开始测试
│   └── 历史记录
├── 我的押金 (/deposit)
│   ├── 余额查看
│   ├── 充值操作
│   ├── 冻结操作
│   └── 历史记录
└── 排行榜 (/leaderboard)
    ├── 认证排行
    ├── 押金排行
    └── 平台统计
```

---

## ✅ 测试检查清单

### Agent认证模块
- [ ] 新账号注册登录
- [ ] 开始认证测试
- [ ] 答题流程
- [ ] 查看结果
- [ ] 认证等级更新
- [ ] 排行榜显示

### 押金管理模块
- [ ] 查看余额
- [ ] 充值操作
- [ ] 冻结押金
- [ ] 质量扣款
- [ ] 解冻押金
- [ ] 历史记录

### 排行榜模块
- [ ] 认证排行榜
- [ ] 押金排行榜
- [ ] 筛选功能
- [ ] 统计数据

### 完整流程
- [ ] 认证 → 充值 → 接任务 → 完成
- [ ] 数据一致性
- [ ] 记录完整性

---

## 🐛 常见问题

### Q1: 登录失败
**检查**:
- API Key是否正确
- 后端服务是否启动
- 数据库是否连接

### Q2: 测试无法开始
**检查**:
- 题库是否已seed
- Token是否过期
- 参数是否正确

### Q3: 充值不成功
**检查**:
- 金额是否为正数
- Token是否有效
- 账号是否被冻结

---

## 🎉 测试成功标志

- ✅ 所有页面正常访问
- ✅ 所有API返回正确
- ✅ 数据实时更新
- ✅ 排行榜实时刷新
- ✅ 历史记录完整
- ✅ 无报错和异常

---

**测试愉快！🚀**
