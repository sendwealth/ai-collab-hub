# UI组件快速参考

## 🚀 快速开始

### 按钮组件

```tsx
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';

// 基础按钮
<Button>点击我</Button>

// Loading按钮
<LoadingButton loading={isLoading} loadingText="提交中...">
  提交
</LoadingButton>

// 按钮变体
<Button variant="outline">Outline</Button>
<Button variant="destructive">删除</Button>
```

### 表单输入

```tsx
import { FormInput } from '@/components/ui/form-input';
import { useFormValidation } from '@/hooks/use-form-validation';

// 配置验证规则
const formConfig = {
  email: {
    rules: [
      { required: true, message: '请输入邮箱' },
      { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: '邮箱格式不正确' }
    ]
  }
};

// 使用Hook
const { values, errors, handleChange, handleBlur } = useFormValidation(
  { email: '' },
  formConfig
);

// 使用组件
<FormInput
  label="邮箱"
  type="email"
  required
  value={values.email}
  onChange={(e) => handleChange('email', e.target.value)}
  onBlur={() => handleBlur('email')}
  error={errors.email}
  leftIcon={<Mail />}
/>
```

### 社交登录

```tsx
import { SocialLoginButton } from '@/components/ui/social-login-button';

<SocialLoginButton
  provider="github"
  onClick={handleGitHubLogin}
  loading={isGitHubLoading}
/>
```

### Loading状态

```tsx
import { Spinner } from '@/components/ui/spinner';
import { LoadingOverlay } from '@/components/ui/loading-overlay';

// Spinner
<Spinner size="lg" />

// Loading Overlay
<LoadingOverlay loading={isLoading} text="加载中...">
  <Content />
</LoadingOverlay>
```

### 空状态

```tsx
import { EmptyState } from '@/components/ui/empty-state';

<EmptyState
  icon={<TaskIcon />}
  title="暂无任务"
  description="成为第一个发布任务的人吧"
  action={<Button>发布任务</Button>}
/>
```

### 筛选器

```tsx
import { EnhancedTaskFilter } from '@/components/ui/enhanced-task-filter';

const [filters, setFilters] = useState({
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

### Toast通知

```tsx
import { useToast } from '@/components/ui/use-toast';

const { toast } = useToast();

toast({
  title: '成功！',
  description: '操作已完成',
  variant: 'default'
});
```

### 用户引导

```tsx
import { OnboardingFlow } from '@/components/ui/onboarding-flow';

const steps = [
  {
    title: '步骤1',
    content: <div>内容1</div>
  },
  {
    title: '步骤2',
    content: <div>内容2</div>
  }
];

<OnboardingFlow
  steps={steps}
  onComplete={() => console.log('完成')}
/>
```

## 📋 常见场景

### 登录表单

```tsx
function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { values, errors, handleChange, handleBlur, validateAll } = useFormValidation(
    { email: '', password: '' },
    {
      email: { rules: [{ required: true, message: '请输入邮箱' }] },
      password: { rules: [{ required: true, message: '请输入密码' }] }
    }
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAll()) return;

    setIsLoading(true);
    try {
      await login(values);
      toast({ title: '登录成功！' });
    } catch (error) {
      toast({ title: '登录失败', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <FormInput
        label="邮箱"
        type="email"
        required
        value={values.email}
        onChange={(e) => handleChange('email', e.target.value)}
        onBlur={() => handleBlur('email')}
        error={errors.email}
        leftIcon={<Mail />}
      />
      <FormInput
        label="密码"
        type="password"
        required
        showPasswordToggle
        value={values.password}
        onChange={(e) => handleChange('password', e.target.value)}
        onBlur={() => handleBlur('password')}
        error={errors.password}
        leftIcon={<Lock />}
      />
      <LoadingButton type="submit" loading={isLoading} className="w-full">
        登录
      </LoadingButton>
    </form>
  );
}
```

### 任务列表页

```tsx
function TaskListPage() {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState(defaultFilters);

  useEffect(() => {
    loadTasks();
  }, [filters]);

  const filteredTasks = filterTasks(tasks, filters);

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="col-span-1">
        <EnhancedTaskFilter
          filters={filters}
          onFiltersChange={setFilters}
        />
      </div>
      <div className="col-span-2">
        <LoadingOverlay loading={isLoading}>
          {filteredTasks.length === 0 ? (
            <EmptyState
              icon={<TaskIcon />}
              title="暂无任务"
              action={<Button>发布任务</Button>}
            />
          ) : (
            <TaskList tasks={filteredTasks} />
          )}
        </LoadingOverlay>
      </div>
    </div>
  );
}
```

## 🎨 样式定制

### 自定义颜色

```css
/* 在 globals.css 中 */
:root {
  --primary: #3B82F6;
  --secondary: #10B981;
}
```

### 自定义按钮样式

```tsx
<Button className="bg-purple-600 hover:bg-purple-700">
  自定义按钮
</Button>
```

## 📚 更多资源

- [完整文档](/docs/UI_INTERACTION_GUIDE.md)
- [演示页面](http://localhost:3000/ui-demo)
- [组件源码](/apps/web/src/components/ui/)

---

**快速参考 | 更新时间: 2026-03-15**
