# UI交互和视觉反馈实现指南

## 概述

本文档详细说明了AI协作平台中所有UI组件的交互设计和视觉反馈实现。

## 🎨 设计系统

### 色彩规范

```css
/* 主色调 */
--primary: #3B82F6     /* 蓝色 - 主要操作 */
--secondary: #10B981   /* 绿色 - 成功状态 */
--accent: #8B5CF6      /* 紫色 - 强调元素 */
--warning: #F59E0B     /* 橙色 - 警告提示 */
--error: #EF4444       /* 红色 - 错误状态 */

/* 中性色 */
--gray-50 到 --gray-900 /* 用于文本、边框、背景 */
```

### 间距系统

使用 Tailwind CSS 的间距系统：
- `spacing-1` (4px) 到 `spacing-16` (64px)

### 圆角系统

```css
--radius-sm: 0.25rem
--radius-md: 0.375rem
--radius-lg: 0.5rem
--radius-xl: 0.75rem
--radius-2xl: 1rem
--radius-full: 9999px
```

## 📦 组件库

### 1. Button 组件

#### 基础用法

```tsx
import { Button } from '@/components/ui/button';

// 默认按钮
<Button>点击我</Button>

// 不同变体
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="destructive">删除</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">链接</Button>

// 不同大小
<Button size="sm">小按钮</Button>
<Button size="default">默认大小</Button>
<Button size="lg">大按钮</Button>
```

#### 交互状态

所有按钮都包含以下状态：

1. **默认状态**: 正常显示
2. **Hover状态**: 
   - 轻微上移 (`translateY(-0.5)`)
   - 添加阴影 (`shadow-md`)
   - 背景色变化
3. **Active状态**: 按下时缩小 (`scale(0.95)`)
4. **Focus状态**: 显示焦点环 (`ring-2`)
5. **Disabled状态**: 半透明 (`opacity-0.5`)，禁用点击
6. **Loading状态**: 显示加载动画

### 2. LoadingButton 组件

#### 用法

```tsx
import { LoadingButton } from '@/components/ui/loading-button';

<LoadingButton
  loading={isLoading}
  loadingText="提交中..."
  onClick={handleSubmit}
>
  提交
</LoadingButton>
```

#### 特性

- 自动显示Spinner
- 禁用按钮防止重复点击
- 可自定义loading文本

### 3. SocialLoginButton 组件

#### 用法

```tsx
import { SocialLoginButton } from '@/components/ui/social-login-button';

<SocialLoginButton
  provider="github"
  onClick={handleGitHubLogin}
  loading={isGitHubLoading}
/>

<SocialLoginButton
  provider="google"
  onClick={handleGoogleLogin}
  loading={isGoogleLoading}
/>
```

#### 特性

- 内置GitHub和Google图标
- Loading状态显示
- 防止重复点击

### 4. FormInput 组件

#### 基础用法

```tsx
import { FormInput } from '@/components/ui/form-input';

<FormInput
  label="邮箱地址"
  type="email"
  required
  placeholder="your@email.com"
  leftIcon={<Mail className="h-5 w-5" />}
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={emailError}
  success={emailSuccess}
  helperText="我们会向此邮箱发送验证码"
/>
```

#### Props

- `label`: 标签文本
- `error`: 错误信息
- `success`: 成功信息
- `helperText`: 帮助文本
- `leftIcon`: 左侧图标
- `rightIcon`: 右侧图标
- `required`: 必填标记
- `showPasswordToggle`: 显示密码切换按钮

#### 交互状态

1. **默认状态**: 正常边框
2. **Focus状态**: 蓝色焦点环
3. **Error状态**: 红色边框 + 错误图标 + 错误信息
4. **Success状态**: 绿色边框 + 成功图标 + 成功信息

### 5. useFormValidation Hook

#### 用法

```tsx
import { useFormValidation } from '@/hooks/use-form-validation';

const formConfig = {
  email: {
    rules: [
      { required: true, message: '请输入邮箱' },
      { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: '邮箱格式不正确' }
    ]
  },
  password: {
    rules: [
      { required: true, message: '请输入密码' },
      { minLength: 6, message: '密码至少6个字符' }
    ]
  }
};

const {
  values,
  errors,
  touched,
  handleChange,
  handleBlur,
  validateAll,
  reset
} = useFormValidation(
  { email: '', password: '' },
  formConfig
);

// 在输入框中使用
<FormInput
  value={values.email}
  onChange={(e) => handleChange('email', e.target.value)}
  onBlur={() => handleBlur('email')}
  error={touched.email ? errors.email : ''}
/>

// 提交时验证
const handleSubmit = (e) => {
  e.preventDefault();
  if (validateAll()) {
    // 提交表单
  }
};
```

#### 验证规则

- `required`: 必填验证
- `minLength`: 最小长度
- `maxLength`: 最大长度
- `pattern`: 正则表达式
- `custom`: 自定义验证函数

### 6. Spinner 组件

#### 用法

```tsx
import { Spinner } from '@/components/ui/spinner';

<Spinner size="sm" />  // 小号
<Spinner size="md" />  // 中号
<Spinner size="lg" />  // 大号
```

### 7. LoadingOverlay 组件

#### 用法

```tsx
import { LoadingOverlay } from '@/components/ui/loading-overlay';

<LoadingOverlay loading={isLoading} text="正在加载...">
  <div>
    {/* 内容 */}
  </div>
</LoadingOverlay>
```

### 8. EmptyState 组件

#### 用法

```tsx
import { EmptyState } from '@/components/ui/empty-state';
import { TaskSquare, Plus } from 'lucide-react';

<EmptyState
  icon={<TaskSquare />}
  title="暂无任务"
  description="成为第一个发布任务的人吧"
  action={
    <Button>
      <Plus className="h-4 w-4 mr-2" />
      发布任务
    </Button>
  }
/>
```

### 9. EnhancedTaskFilter 组件

#### 用法

```tsx
import { EnhancedTaskFilter, TaskFilters } from '@/components/ui/enhanced-task-filter';

const [filters, setFilters] = useState<TaskFilters>({
  category: 'all',
  minPrice: 0,
  maxPrice: 0,
  status: 'all',
  skills: []
});

<EnhancedTaskFilter
  filters={filters}
  onFiltersChange={setFilters}
/>
```

#### 特性

- 实时筛选反馈
- 选中状态高亮
- 筛选数量徽章
- 一键重置功能
- 活跃筛选摘要显示

### 10. OnboardingFlow 组件

#### 用法

```tsx
import { OnboardingFlow } from '@/components/ui/onboarding-flow';

const steps = [
  {
    title: '欢迎',
    description: '开始您的旅程',
    content: <div>步骤1内容</div>
  },
  {
    title: '设置',
    content: <div>步骤2内容</div>
  }
];

<OnboardingFlow
  steps={steps}
  onComplete={() => console.log('完成引导')}
/>
```

#### 特性

- 进度指示器
- 上一步/下一步导航
- 跳过功能
- 完成回调

### 11. Toast 通知

#### 基础用法

```tsx
import { useToast } from '@/components/ui/use-toast';

const { toast } = useToast();

// 成功通知
toast({
  title: '成功！',
  description: '操作已完成',
  variant: 'default'
});

// 错误通知
toast({
  title: '错误',
  description: '操作失败',
  variant: 'destructive'
});
```

#### 通知类型

- `default`: 默认（成功）
- `destructive`: 错误
- `warning`: 警告
- `info`: 信息

## 🎯 最佳实践

### 1. 按钮交互

```tsx
// ✅ 好的做法
<LoadingButton
  loading={isSubmitting}
  loadingText="提交中..."
  onClick={handleSubmit}
  disabled={!isValid}
>
  提交
</LoadingButton>

// ❌ 不好的做法
<Button onClick={handleSubmit} disabled={isSubmitting}>
  {isSubmitting ? '提交中...' : '提交'}
</Button>
```

### 2. 表单验证

```tsx
// ✅ 实时验证 + 提交验证
<FormInput
  value={values.email}
  onChange={(e) => handleChange('email', e.target.value)}
  onBlur={() => handleBlur('email')}  // 触发验证
  error={touched.email ? errors.email : ''}
  success={touched.email && !errors.email && values.email ? '格式正确' : ''}
/>

// ❌ 只在提交时验证
<FormInput
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={submitError}
/>
```

### 3. Loading状态

```tsx
// ✅ 使用专门的组件
<LoadingOverlay loading={isLoading} text="加载数据中...">
  <Content />
</LoadingOverlay>

// ❌ 手动管理显示
{isLoading ? <Spinner /> : <Content />}
```

### 4. 空状态

```tsx
// ✅ 提供明确的行动指引
<EmptyState
  icon={<TaskIcon />}
  title="暂无任务"
  description="成为第一个发布任务的人吧"
  action={<Button>发布任务</Button>}
/>

// ❌ 只显示文本
<div>暂无任务</div>
```

### 5. 错误处理

```tsx
// ✅ 友好的错误提示
try {
  await submitForm();
  toast({
    title: '提交成功！',
    description: '您的数据已保存',
  });
} catch (error) {
  toast({
    title: '提交失败',
    description: error.message || '请稍后重试',
    variant: 'destructive',
  });
}

// ❌ 直接显示错误
alert(error.message);
```

## 📱 响应式设计

所有组件都支持响应式设计：

```tsx
// 移动端优先
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <Card />
  <Card />
  <Card />
</div>
```

## 🌗 暗色模式

组件支持暗色模式（通过 Tailwind CSS）：

```tsx
<div className="bg-white dark:bg-gray-900">
  <p className="text-gray-900 dark:text-white">文本</p>
</div>
```

## 🎨 自定义主题

可以通过修改 CSS 变量来自定义主题：

```css
:root {
  --primary: #3B82F6;
  --secondary: #10B981;
  --accent: #8B5CF6;
  /* ... */
}
```

## 📝 完整示例

查看 `/app/ui-demo/page.tsx` 获取所有组件的完整交互示例。

## 🔗 相关资源

- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [Radix UI 文档](https://www.radix-ui.com/docs)
- [Lucide Icons](https://lucide.dev/)
- [Class Variance Authority](https://cva.style/docs)

---

**更新时间**: 2026-03-15
**版本**: 1.0.0
**维护者**: UI/UX Team
