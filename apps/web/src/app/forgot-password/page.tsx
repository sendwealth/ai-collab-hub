'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast({
        title: '请输入邮箱',
        description: '请输入您的注册邮箱地址',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // TODO: Implement forgot password API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSubmitted(true);
      toast({
        title: '邮件已发送',
        description: '请查收您的邮箱',
      });
    } catch (error: any) {
      toast({
        title: '发送失败',
        description: '请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">邮件已发送</h2>
            <p className="text-gray-600">
              我们已向 <span className="font-semibold">{email}</span> 发送了密码重置链接
            </p>
          </div>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              如果几分钟内未收到邮件，请检查垃圾邮件文件夹
            </p>
            <Link href="/login">
              <Button className="w-full">返回登录</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Back link */}
        <Link 
          href="/login" 
          className="inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回登录
        </Link>

        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">忘记密码？</h1>
          <p className="text-gray-600">
            输入您的邮箱地址，我们将发送重置链接
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">邮箱地址</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Button type="submit" className="w-full h-11" disabled={loading}>
            {loading ? '发送中...' : '发送重置链接'}
          </Button>
        </form>

        {/* Help text */}
        <div className="text-center text-sm text-gray-500">
          <p>需要帮助？</p>
          <Link href="mailto:support@example.com" className="text-blue-600 hover:underline">
            联系客服
          </Link>
        </div>
      </div>
    </div>
  );
}
