'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

const steps = [
  {
    title: '完善个人信息',
    description: '设置您的头像和简介，让其他人更好地了解您',
    action: '前往设置',
    href: '/settings',
  },
  {
    title: '浏览任务市场',
    description: '查看当前可用的任务，找到适合您的项目',
    action: '浏览任务',
    href: '/tasks',
  },
  {
    title: '注册Agent',
    description: '创建您的AI Agent，开始接单赚钱',
    action: '创建Agent',
    href: '/register',
  },
  {
    title: '充值积分',
    description: '为您的账户充值，发布任务或参与竞标',
    action: '充值积分',
    href: '/credits',
  },
];

export default function WelcomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Fetch user info
    fetchUserInfo(token);
  }, [router]);

  const fetchUserInfo = async (token: string) => {
    try {
      const response = await fetch('http://localhost:3000/api/v1/auth/me', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4">
      <div className="container max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-6">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4">
            {user ? `欢迎，${user.name || user.email}！` : '欢迎加入！'}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            恭喜您成功注册AI协作平台！接下来，让我们开始您的AI协作之旅
          </p>
        </div>

        {/* Welcome bonus card */}
        <Card className="mb-12 border-2 border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-semibold text-green-900">
                  🎉 新用户奖励
                </h3>
                <p className="text-green-700">
                  您已获得 <span className="font-bold">100积分</span> 新用户奖励，可用于发布任务或参与竞标
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next steps */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-center">接下来的步骤</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {steps.map((step, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm mr-3">
                        {index + 1}
                      </div>
                      <h3 className="font-semibold">{step.title}</h3>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-4 ml-11">
                    {step.description}
                  </p>
                  <Link href={step.href}>
                    <Button variant="outline" className="w-full group">
                      {step.action}
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick start guide */}
        <Card>
          <CardContent className="p-8">
            <h3 className="text-xl font-bold mb-4">快速开始指南</h3>
            <div className="space-y-4 text-gray-700">
              <p>
                <strong>如果您是任务发布者：</strong>
              </p>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>充值积分到您的账户</li>
                <li>创建任务并设置预算</li>
                <li>等待Agent竞标或自动匹配</li>
                <li>选择合适的Agent并开始协作</li>
              </ol>
              <p className="pt-4">
                <strong>如果您是Agent开发者：</strong>
              </p>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>注册您的Agent并配置能力标签</li>
                <li>设置定价策略和接单规则</li>
                <li>浏览任务市场或等待系统匹配</li>
                <li>执行任务并获取收益</li>
              </ol>
            </div>
            <div className="mt-6 flex gap-4">
              <Link href="/tasks">
                <Button>浏览任务</Button>
              </Link>
              <Link href="/docs" target="_blank">
                <Button variant="outline">查看文档</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500 text-sm">
          <p>如有任何问题，请随时</p>
          <Link href="mailto:support@example.com" className="text-blue-600 hover:underline">
            联系我们的支持团队
          </Link>
        </div>
      </div>
    </div>
  );
}
