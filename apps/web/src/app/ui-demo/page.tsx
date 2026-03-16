'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { SocialLoginButton } from '@/components/ui/social-login-button';
import { FormInput } from '@/components/ui/form-input';
import { useFormValidation } from '@/hooks/use-form-validation';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { EnhancedTaskFilter } from '@/components/ui/enhanced-task-filter';
import { OnboardingFlow } from '@/components/ui/onboarding-flow';
import { useToast } from '@/components/ui/use-toast';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Mail,
  Lock,
  User,
  ClipboardList,
  Plus,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function UIDemoPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [overlayLoading, setOverlayLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [filters, setFilters] = useState<{
    category: string;
    minPrice: number;
    maxPrice: number;
    status: string;
    skills: string[];
  }>({
    category: 'all',
    minPrice: 0,
    maxPrice: 0,
    status: 'all',
    skills: [] as string[],
  });

  // Form validation example
  const formConfig = {
    email: {
      rules: [
        { required: true, message: '请输入邮箱地址' },
        {
          pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          message: '请输入有效的邮箱地址',
        },
      ],
    },
    password: {
      rules: [
        { required: true, message: '请输入密码' },
        { minLength: 6, message: '密码至少需要6个字符' },
      ],
    },
    username: {
      rules: [
        { required: true, message: '请输入用户名' },
        { minLength: 3, message: '用户名至少需要3个字符' },
      ],
    },
  };

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    reset,
  } = useFormValidation(
    {
      email: '',
      password: '',
      username: '',
    },
    formConfig
  );

  // Handlers
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateAll()) {
      setLoading(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast({
        title: '提交成功！',
        description: '表单验证通过，数据已提交',
        variant: 'default',
      });
      setLoading(false);
      reset();
    } else {
      toast({
        title: '验证失败',
        description: '请检查表单中的错误',
        variant: 'destructive',
      });
    }
  };

  const handleSocialLogin = async (provider: string) => {
    setSocialLoading(provider);
    // Simulate OAuth flow
    await new Promise((resolve) => setTimeout(resolve, 2000));
    toast({
      title: `${provider} 登录成功！`,
      description: '正在跳转...',
    });
    setSocialLoading(null);
  };

  const handleLoadingOverlay = async () => {
    setOverlayLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 3000));
    setOverlayLoading(false);
    toast({
      title: '加载完成',
      description: '数据已成功加载',
    });
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    toast({
      title: '引导完成！',
      description: '欢迎使用AI协作平台',
    });
  };

  const onboardingSteps = [
    {
      title: '欢迎来到AI协作平台',
      description: '让我们一起开始您的AI协作之旅',
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            这是一个连接人类与AI的协作平台，让您可以：
          </p>
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span>发布任务并与AI Agent协作</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span>获得公平透明的收益</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span>构建您的AI协作网络</span>
            </li>
          </ul>
        </div>
      ),
    },
    {
      title: '完善您的个人信息',
      description: '让我们更好地了解您',
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            填写您的个人资料可以帮助您：
          </p>
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span>获得更精准的任务推荐</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span>展示您的专业技能</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span>建立信任和声誉</span>
            </li>
          </ul>
        </div>
      ),
    },
    {
      title: '开始您的第一个任务',
      description: '准备开始了吗？',
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            您现在可以：
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Button className="h-20 flex-col gap-2">
              <Plus className="h-6 w-6" />
              发布任务
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <ClipboardList className="h-6 w-6" />
              浏览任务
            </Button>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            UI组件交互演示
          </h1>
          <p className="text-gray-600">
            展示所有按钮、表单、筛选器等组件的完整交互状态和视觉反馈
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Button States */}
          <Card>
            <CardHeader>
              <CardTitle>按钮状态演示</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-gray-600 mb-2">主要按钮</p>
                <div className="flex flex-wrap gap-2">
                  <Button>默认状态</Button>
                  <Button disabled>禁用状态</Button>
                  <LoadingButton loading loadingText="加载中...">
                    加载状态
                  </LoadingButton>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-600 mb-2">次要按钮</p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline">Outline</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="ghost">Ghost</Button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-600 mb-2">危险按钮</p>
                <Button variant="destructive">删除</Button>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-600 mb-2">社交登录按钮</p>
                <div className="space-y-2">
                  <SocialLoginButton
                    provider="github"
                    onClick={() => handleSocialLogin('GitHub')}
                    loading={socialLoading === 'GitHub'}
                  />
                  <SocialLoginButton
                    provider="google"
                    onClick={() => handleSocialLogin('Google')}
                    loading={socialLoading === 'Google'}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Validation */}
          <Card>
            <CardHeader>
              <CardTitle>表单验证演示</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <FormInput
                  label="用户名"
                  required
                  leftIcon={<User className="h-5 w-5" />}
                  placeholder="输入用户名"
                  value={values.username}
                  onChange={(e) => handleChange('username', e.target.value)}
                  onBlur={() => handleBlur('username')}
                  error={touched.username ? errors.username : ''}
                  success={
                    touched.username && !errors.username && values.username
                      ? '用户名可用'
                      : ''
                  }
                />

                <FormInput
                  label="邮箱地址"
                  type="email"
                  required
                  leftIcon={<Mail className="h-5 w-5" />}
                  placeholder="your@email.com"
                  value={values.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  error={touched.email ? errors.email : ''}
                  success={
                    touched.email && !errors.email && values.email
                      ? '邮箱格式正确'
                      : ''
                  }
                />

                <FormInput
                  label="密码"
                  type="password"
                  required
                  showPasswordToggle
                  leftIcon={<Lock className="h-5 w-5" />}
                  placeholder="••••••••"
                  value={values.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  onBlur={() => handleBlur('password')}
                  error={touched.password ? errors.password : ''}
                  helperText="密码至少6个字符"
                />

                <LoadingButton
                  type="submit"
                  className="w-full"
                  loading={loading}
                  loadingText="提交中..."
                >
                  提交表单
                </LoadingButton>
              </form>
            </CardContent>
          </Card>

          {/* Loading States */}
          <Card>
            <CardHeader>
              <CardTitle>Loading状态演示</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-gray-600 mb-2">Spinner组件</p>
                <div className="flex items-center gap-4">
                  <Spinner size="sm" />
                  <Spinner size="md" />
                  <Spinner size="lg" />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-600 mb-2">Loading Overlay</p>
                <Button onClick={handleLoadingOverlay}>
                  显示Loading Overlay
                </Button>
                <LoadingOverlay
                  loading={overlayLoading}
                  text="正在加载数据..."
                >
                  <div className="p-8 bg-gray-100 rounded-lg">
                    <p className="text-gray-600">
                      这是一些内容，点击按钮查看loading overlay效果
                    </p>
                  </div>
                </LoadingOverlay>
              </div>
            </CardContent>
          </Card>

          {/* Empty State */}
          <Card>
            <CardHeader>
              <CardTitle>空状态演示</CardTitle>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={<ClipboardList />}
                title="暂无任务"
                description="成为第一个发布任务的人吧"
                action={
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    发布任务
                  </Button>
                }
              />
            </CardContent>
          </Card>

          {/* Task Filter */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>筛选器演示</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <EnhancedTaskFilter
                  filters={filters}
                  onFiltersChange={setFilters}
                  className="lg:col-span-1"
                />
                <div className="lg:col-span-2 p-4 bg-gray-50 rounded-lg">
                  <div className="mb-4">
                    <h3 className="font-semibold mb-2">当前筛选条件:</h3>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">
                        类别: {filters.category}
                      </Badge>
                      <Badge variant="outline">状态: {filters.status}</Badge>
                      {filters.skills.length > 0 && (
                        <Badge variant="outline">
                          技能: {filters.skills.join(', ')}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    尝试更改筛选条件，查看实时反馈效果
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Onboarding Flow */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>用户引导流程</CardTitle>
            </CardHeader>
            <CardContent>
              {!showOnboarding ? (
                <div className="text-center py-8">
                  <Button onClick={() => setShowOnboarding(true)} size="lg">
                    开始引导流程
                  </Button>
                </div>
              ) : (
                <OnboardingFlow
                  steps={onboardingSteps}
                  onComplete={handleOnboardingComplete}
                />
              )}
            </CardContent>
          </Card>

          {/* Toast Notifications Demo */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Toast通知演示</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() =>
                    toast({
                      title: '成功！',
                      description: '操作已成功完成',
                      variant: 'default',
                    })
                  }
                >
                  成功通知
                </Button>
                <Button
                  variant="destructive"
                  onClick={() =>
                    toast({
                      title: '错误！',
                      description: '操作失败，请重试',
                      variant: 'destructive',
                    })
                  }
                >
                  错误通知
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    toast({
                      title: '警告',
                      description: '请注意这个警告信息',
                    })
                  }
                >
                  警告通知
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    toast({
                      title: '提示',
                      description: '这是一条信息提示',
                    })
                  }
                >
                  信息通知
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
