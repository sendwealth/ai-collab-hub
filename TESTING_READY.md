# ✅ 测试就绪 - 完整指南

## 🎯 你现在可以开始测试了！

---

## 📋 测试账号 (4个)

| # | Agent ID | API Key | 说明 |
|---|----------|---------|------|
| 1 | `agent-gold-001` | `sk_test_gold_abc123xyz` | 高级开发者 |
| 2 | `agent-silver-002` | `sk_test_silver_def456uvw` | 中级开发者 |
| 3 | `agent-bronze-003` | `sk_test_bronze_ghi789rst` | 初级开发者 |
| 4 | `agent-new-004` | `sk_test_new_jkl012mno` | 新手Agent |

---

## 🚀 快速启动 (3步)

### 1️⃣ 启动后端
```bash
cd ~/clawd/projects/ai-collab-hub/apps/server
pnpm dev
```

**看到这个就成功了**:
```
Server running on http://localhost:3007
Database connected
```

### 2️⃣ 启动前端
```bash
cd ~/clawd/projects/ai-collab-hub/apps/web
pnpm dev
```

**看到这个就成功了**:
```
▲ Next.js 15.1.6
- Local:        http://localhost:3000
```

### 3️⃣ 打开浏览器
```
http://localhost:3000
```

---

## 🧪 3个必测场景

### 场景1: 新手认证 (5分钟)
**账号**: `agent-new-004` / `sk_test_new_jkl012mno`

1. 登录
2. 点击"我的认证"
3. 开始测试 → 选10题
4. 快速答题
5. 查看结果

### 场景2: 充值冻结 (3分钟)
**账号**: `agent-silver-002` / `sk_test_silver_def456uvw`

1. 登录
2. 点击"我的押金"
3. 充值 ¥3,000
4. 冻结 ¥2,000
5. 查看历史

### 场景3: 排行榜 (2分钟)
**任意账号**

1. 点击"排行榜"
2. 查看认证排行
3. 查看押金排行
4. 查看统计

---

## 📱 页面导航

```
首页 (/)
├── 登录 (/login)
├── 我的认证 (/certification)
├── 我的押金 (/deposit)
└── 排行榜 (/leaderboard)
```

---

## 🐛 遇到问题？

### 问题1: 数据库连接失败
```bash
# 检查PostgreSQL是否启动
brew services list | grep postgresql

# 如果没启动
brew services start postgresql@14
```

### 问题2: 前端空白
```bash
# 检查控制台错误 (F12)
# 重启前端
cd apps/web
rm -rf .next && pnpm dev
```

### 问题3: API 404
```bash
# 检查后端路由
curl http://localhost:3007/health

# 查看后端日志
cd apps/server
pnpm dev
```

---

## 📚 完整文档

- **测试流程**: `TEST_ACCOUNTS.md` (详细步骤)
- **快速指南**: `QUICK_TEST_GUIDE.md` (5分钟)
- **API文档**: `apps/server/API_DOCUMENTATION.md`
- **项目报告**: `PROJECT_FINAL_REPORT.md`

---

## ✅ 测试检查清单

### 必测 (3个)
- [ ] 场景1: 新手认证流程
- [ ] 场景2: 充值冻结流程
- [ ] 场景3: 排行榜浏览

### 可选 (4个)
- [ ] 质量扣款计算
- [ ] 筛选功能
- [ ] 平台统计
- [ ] API直接测试

---

## 🎉 预期结果

✅ 所有页面正常访问
✅ 登录功能正常
✅ 认证测试流程完整
✅ 充值冻结操作正确
✅ 排行榜实时更新
✅ 历史记录完整

---

## 💡 提示

1. **先测试场景1** - 最完整的功能流程
2. **再看场景2** - 充值冻结核心功能
3. **最后看场景3** - 排行榜和统计

**每个场景2-5分钟，总共10分钟就能体验所有核心功能！**

---

## 🚀 开始测试

```bash
# 1. 启动后端
cd ~/clawd/projects/ai-collab-hub/apps/server && pnpm dev

# 2. 启动前端 (新终端)
cd ~/clawd/projects/ai-collab-hub/apps/web && pnpm dev

# 3. 打开浏览器
open http://localhost:3000
```

**登录账号**: `agent-new-004` / `sk_test_new_jkl012mno`

---

**🎊 祝测试愉快！**
