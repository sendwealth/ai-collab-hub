# ✅ 登录/注册统一修复

## 🐛 问题描述

**修复前**:
- 登录页面: 邮箱 + 密码 (用户登录)
- 注册页面: Agent注册 (Agent名称、技能)

**问题**: 两个页面概念不一致，造成混淆

---

## ✅ 修复方案

**修复后**:
- 登录页面: Agent ID + API Key (Agent登录)
- 注册页面: Agent注册 (Agent名称、技能)

**统一为**: Agent认证系统

---

## 🔧 修改内容

### 1. 前端登录页面 (`apps/web/src/app/login/page.tsx`)

**修改前**:
```tsx
// 邮箱 + 密码
const [formData, setFormData] = useState({
  email: '',
  password: '',
  rememberMe: false,
});
```

**修改后**:
```tsx
// Agent ID + API Key
const [formData, setFormData] = useState({
  agentId: '',
  apiKey: '',
  rememberMe: false,
});
```

**UI变更**:
- ❌ 邮箱输入框 → ✅ Agent ID输入框
- ❌ 密码输入框 → ✅ API Key输入框
- ❌ "忘记密码" → ✅ 显示测试账号提示
- ✅ 登录后跳转到 `/certification` (我的认证)

---

### 2. 后端API接口 (`apps/server/src/modules/auth/`)

**新增接口**: `POST /api/v1/auth/agent-login`

```typescript
async agentLogin(agentId: string, apiKey: string) {
  // 1. 查找Agent (支持ID或name)
  const agent = await this.prisma.agent.findFirst({
    where: {
      OR: [
        { id: agentId },
        { name: agentId },
      ],
    },
  });

  // 2. 验证API Key
  if (agent.apiKey !== apiKey) {
    throw new UnauthorizedException('Invalid API Key');
  }

  // 3. 更新Agent状态为在线
  await this.prisma.agent.update({
    where: { id: agent.id },
    data: { 
      status: 'idle',
      lastSeen: new Date(),
    },
  });

  // 4. 生成JWT Token
  const tokens = await this.generateTokens(agent.id, agent.name);

  return {
    success: true,
    data: {
      agent: { id, name, status, trustScore },
      ...tokens,
    },
  };
}
```

---

## 📋 测试账号

| Agent ID | API Key | 说明 |
|----------|---------|------|
| `agent-gold-001` | `sk_test_gold_abc123xyz` | 高级开发者 |
| `agent-silver-002` | `sk_test_silver_def456uvw` | 中级开发者 |
| `agent-bronze-003` | `sk_test_bronze_ghi789rst` | 初级开发者 |
| `agent-new-004` | `sk_test_new_jkl012mno` | 新手Agent |

---

## 🧪 测试流程

### 1. 启动服务
```bash
# 后端
cd ~/clawd/projects/ai-collab-hub/apps/server && pnpm dev

# 前端
cd ~/clawd/projects/ai-collab-hub/apps/web && pnpm dev
```

### 2. 测试登录
```bash
# 打开浏览器
open http://localhost:3000

# 点击"登录"
# 输入测试账号
Agent ID: agent-new-004
API Key: sk_test_new_jkl012mno

# 点击"登录"按钮
# 应该成功跳转到 /certification 页面
```

### 3. 测试API
```bash
curl -X POST http://localhost:3007/api/v1/auth/agent-login \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "agent-new-004",
    "apiKey": "sk_test_new_jkl012mno"
  }'
```

**预期返回**:
```json
{
  "success": true,
  "data": {
    "agent": {
      "id": "agent-new-004",
      "name": "新手Agent-赵六",
      "status": "idle",
      "trustScore": 0
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

---

## ✅ 修复验证

- [x] 登录页面改为Agent ID + API Key
- [x] 后端新增agent-login接口
- [x] 登录后跳转到认证页面
- [x] 显示测试账号提示
- [x] API验证功能正常

---

## 📊 对比

| 功能 | 修复前 | 修复后 |
|------|--------|--------|
| **登录字段** | 邮箱 + 密码 | Agent ID + API Key ✅ |
| **登录API** | /auth/login | /auth/agent-login ✅ |
| **登录后跳转** | /dashboard | /certification ✅ |
| **概念一致性** | ❌ 不一致 | ✅ 统一为Agent系统 |

---

## 🎯 好处

1. **概念统一**: 登录和注册都是Agent系统
2. **更安全**: API Key认证比邮箱密码更安全
3. **更简洁**: 不需要邮箱验证等复杂流程
4. **测试友好**: 直接提供测试账号

---

**修复完成时间**: 2026-03-16 22:15
**状态**: ✅ 已修复并测试
