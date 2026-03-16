# 用户体验流程 - 快速实施指南

## 📦 已创建的文件

### 1. 文档
- ✅ `USER_EXPERIENCE_FLOW.md` - 完整的用户体验流程文档
- ✅ `USER_FLOW_TEST_CHECKLIST.md` - 测试验证清单

### 2. 认证相关代码
- ✅ `apps/web/src/lib/auth.ts` - 认证工具函数
- ✅ `apps/web/src/hooks/useAuth.ts` - 认证 React Hook
- ✅ `apps/web/src/middleware.ts` - Next.js 路由守卫
- ✅ `apps/web/src/components/auth/AuthGuard.tsx` - 认证守卫组件

### 3. 新页面
- ✅ `apps/web/src/app/welcome/page.tsx` - 欢迎引导页

---

## 🔧 集成步骤

### Step 1: 更新登录页使用新 Hook

**文件**: `apps/web/src/app/login/page.tsx`

**修改点**:
```typescript
// 1. 导入 useAuth Hook
import { useAuth } from '@/hooks/useAuth';

// 2. 在组件内使用
const { login } = useAuth();

// 3. 修改 handleSubmit
const handleSubmit = async (e: React.FormEvent) => {
  // ... 原有验证逻辑
  
  try {
    const response = await axios.post('http://localhost:3000/api/v1/auth/login', {
      email: formData.email,
      password: formData.password,
    });

    // 使用新的 login 方法
    login(response.data.token, response.data.user, formData.rememberMe);

    // 处理重定向
    const redirectUrl = searchParams.get('redirect') || '/dashboard';
    router.push(redirectUrl);
    
  } catch (error) {
    // ... 错误处理
  }
};
```

---

### Step 2: 更新注册页跳转逻辑

**文件**: `apps/web/src/app/user-register/page.tsx`

**修改点**:
```typescript
// 1. 导入 useAuth
import { useAuth } from '@/hooks/useAuth';

// 2. 使用 Hook
const { login } = useAuth();

// 3. 修改注册成功后的逻辑
const handleSubmit = async (e: React.FormEvent) => {
  // ... 原有验证逻辑
  
  try {
    const response = await axios.post('http://localhost:3000/api/v1/auth/register', {
      username: formData.username,
      email: formData.email,
      password: formData.password,
    });

    // 登录用户
    login(response.data.token, response.data.user, false);

    // 跳转到欢迎引导页
    router.push('/welcome');
    
  } catch (error) {
    // ... 错误处理
  }
};
```

---

### Step 3: 添加登出功能

**创建组件**: `apps/web/src/components/layout/UserMenu.tsx`

```typescript
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { User, LogOut, Settings, CreditCard } from 'lucide-react';

export function UserMenu() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) {
    return (
      <div className="flex gap-2">
        <Link href="/login">
          <Button variant="ghost">登录</Button>
        </Link>
        <Link href="/user-register">
          <Button>注册</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100"
      >
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
          {user.username?.[0]?.toUpperCase() || 'U'}
        </div>
        <span className="hidden md:block">{user.username}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-2">
          <div className="px-4 py-2 border-b">
            <p className="font-medium">{user.username}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
          
          <Link
            href="/profile"
            className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100"
            onClick={() => setIsOpen(false)}
          >
            <User className="h-4 w-4" />
            个人资料
          </Link>
          
          <Link
            href="/credits"
            className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100"
            onClick={() => setIsOpen(false)}
          >
            <CreditCard className="h-4 w-4" />
            我的积分
          </Link>
          
          <Link
            href="/settings"
            className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100"
            onClick={() => setIsOpen(false)}
          >
            <Settings className="h-4 w-4" />
            设置
          </Link>
          
          <button
            onClick={() => {
              logout();
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100 text-red-600"
          >
            <LogOut className="h-4 w-4" />
            登出
          </button>
        </div>
      )}
    </div>
  );
}
```

---

### Step 4: 更新 Dashboard 使用 AuthGuard

**文件**: `apps/web/src/app/dashboard/page.tsx`

**修改点**:
```typescript
// 在文件开头添加
import { AuthGuard } from '@/components/auth/AuthGuard';

// 包裹整个组件
export default function DashboardPage() {
  return (
    <AuthGuard>
      {/* 原有 Dashboard 内容 */}
    </AuthGuard>
  );
}
```

---

### Step 5: 更新导航栏

**文件**: `apps/web/src/components/landing/Header.tsx`

**添加 UserMenu**:
```typescript
import { UserMenu } from '@/components/layout/UserMenu';

// 在导航栏右侧
<div className="flex items-center gap-4">
  <nav className="hidden md:flex gap-6">
    {/* 原有链接 */}
  </nav>
  <UserMenu /> {/* 替换原来的登录/注册按钮 */}
</div>
```

---

### Step 6: 更新欢迎页跳转

**文件**: `apps/web/src/app/welcome/page.tsx`

**添加 AuthGuard**:
```typescript
import { AuthGuard } from '@/components/auth/AuthGuard';

export default function WelcomePage() {
  return (
    <AuthGuard>
      {/* 原有欢迎页内容 */}
    </AuthGuard>
  );
}
```

---

## 🎯 优先级任务清单

### 🔴 高优先级（必须立即实现）

1. **集成认证 Hook**
   - [ ] 更新登录页使用 `useAuth`
   - [ ] 更新注册页使用 `useAuth`
   - [ ] 测试登录/注册流程

2. **添加登出功能**
   - [ ] 创建 UserMenu 组件
   - [ ] 添加到导航栏
   - [ ] 测试登出流程

3. **测试路由守卫**
   - [ ] 测试未认证访问受保护页面
   - [ ] 测试重定向功能
   - [ ] 测试 Token 过期处理

---

### 🟡 中优先级（本周内完成）

4. **完善欢迎引导页**
   - [ ] 集成后端 API（保存角色和技能）
   - [ ] 添加更多引导步骤（可选）
   - [ ] 优化 UI/UX

5. **角色系统实现**
   - [ ] 后端：添加角色字段到 User 模型
   - [ ] 前端：根据角色显示不同 Dashboard
   - [ ] 测试角色切换

6. **任务筛选器**
   - [ ] 实现左侧筛选器 UI
   - [ ] 集成筛选 API
   - [ ] 测试筛选功能

---

### 🟢 低优先级（后续迭代）

7. **第三方登录**
   - [ ] 实现 GitHub OAuth
   - [ ] 实现 Google OAuth
   - [ ] 测试第三方登录流程

8. **通知系统**
   - [ ] 设计通知数据结构
   - [ ] 实现通知 UI 组件
   - [ ] 集成实时通知（WebSocket）

9. **数据可视化**
   - [ ] 添加收益趋势图到 Dashboard
   - [ ] 添加任务统计图表
   - [ ] 优化数据展示

---

## 📝 测试清单

### 功能测试
- [ ] 新用户注册流程
- [ ] 老用户登录流程
- [ ] 登出功能
- [ ] 路由守卫拦截
- [ ] 重定向功能
- [ ] Token 存储（记住我）
- [ ] Token 过期处理
- [ ] 欢迎引导流程

### 边界测试
- [ ] 无效邮箱格式
- [ ] 弱密码
- [ ] 密码不匹配
- [ ] 重复注册
- [ ] 错误的登录凭据
- [ ] 网络错误处理

### 性能测试
- [ ] 页面加载速度
- [ ] API 响应时间
- [ ] 大数据量渲染

---

## 🐛 已知问题

| 问题 | 严重程度 | 解决方案 | 负责人 | 预计完成 |
|------|---------|---------|--------|---------|
| 缺少登出按钮 | 中 | 添加 UserMenu 组件 | - | - |
| 欢迎页未连接后端 | 中 | 集成用户更新 API | - | - |
| 角色系统未实现 | 高 | 添加角色字段和逻辑 | - | - |
| 任务筛选器缺失 | 中 | 实现筛选组件 | - | - |

---

## 📚 相关文档

- [用户体验流程文档](./USER_EXPERIENCE_FLOW.md)
- [测试验证清单](./USER_FLOW_TEST_CHECKLIST.md)
- [产品需求文档](./PRODUCT_REQUIREMENTS.md)
- [UI 设计规范](./UI_DESIGN_SPEC.md)

---

## 💬 需要讨论的问题

1. **角色切换**: 用户是否可以同时是 Agent 和发布者？
2. **欢迎引导**: 是否可以跳过？跳过后默认角色是什么？
3. **Token 过期**: Token 有效期多久？是否需要自动刷新？
4. **第三方登录**: 优先支持哪些平台？GitHub? Google? WeChat?

---

## 🚀 部署前检查清单

- [ ] 所有认证功能测试通过
- [ ] 路由守卫正常工作
- [ ] 登出功能正常
- [ ] 欢迎引导流程完整
- [ ] 表单验证完善
- [ ] 错误处理友好
- [ ] 响应式布局正常
- [ ] 性能符合要求
- [ ] 无 console 错误
- [ ] 代码已提交并推送

---

**更新时间**: 2026-03-15  
**负责人**: 产品经理  
**状态**: 待实施
