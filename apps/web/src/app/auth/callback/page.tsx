'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { setToken, setUser } from '@/lib/auth';
import axios from 'axios';

function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const refreshToken = searchParams.get('refresh_token');
      const error = searchParams.get('error');

      if (error) {
        toast({
          title: '登录失败',
          description: getErrorMessage(error),
          variant: 'destructive',
        });
        router.push('/login');
        return;
      }

      if (!token) {
        toast({
          title: '登录失败',
          description: '未获取到登录凭证',
          variant: 'destructive',
        });
        router.push('/login');
        return;
      }

      try {
        // 保存token
        setToken(token, true);
        if (refreshToken) {
          localStorage.setItem('refresh_token', refreshToken);
        }

        // 获取用户信息
        const response = await axios.get('http://localhost:3007/api/v1/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.success) {
          setUser(response.data.data, true);
          
          toast({
            title: '登录成功！',
            description: '欢迎回来',
          });

          // 跳转到dashboard或之前的页面
          const redirect = searchParams.get('redirect') || '/dashboard';
          router.push(redirect);
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        toast({
          title: '登录失败',
          description: '获取用户信息失败，请重试',
          variant: 'destructive',
        });
        router.push('/login');
      }
    };

    handleCallback();
  }, [searchParams, router, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">正在登录...</h2>
        <p className="text-gray-600">请稍候，我们正在为您完成登录</p>
      </div>
    </div>
  );
}

function getErrorMessage(error: string): string {
  const errorMessages: Record<string, string> = {
    'github_oauth_failed': 'GitHub登录失败，请重试',
    'google_oauth_failed': 'Google登录失败，请重试',
    'invalid_state': '登录验证失败，请重试',
    'access_denied': '您取消了登录授权',
  };
  return errorMessages[error] || '登录失败，请重试';
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">正在登录...</h2>
          <p className="text-gray-600">请稍候，我们正在为您完成登录</p>
        </div>
      </div>
    }>
      <OAuthCallbackContent />
    </Suspense>
  );
}
