'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { Mail, Lock, Eye, EyeOff, Github, Chrome } from 'lucide-react';
import axios from 'axios';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = '请输入邮箱地址';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '请输入有效的邮箱地址';
    }

    if (!formData.password) {
      newErrors.password = '请输入密码';
    } else if (formData.password.length < 6) {
      newErrors.password = '密码至少需要6个字符';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('http://localhost:3000/api/v1/auth/login', {
        email: formData.email,
        password: formData.password,
      });

      // Save token
      if (formData.rememberMe) {
        localStorage.setItem('token', response.data.token);
      } else {
        sessionStorage.setItem('token', response.data.token);
      }

      toast({
        title: '登录成功！',
        description: '欢迎回来',
      });

      router.push('/dashboard');
    } catch (error: any) {
      toast({
        title: '登录失败',
        description: error.response?.data?.message || '邮箱或密码错误',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    toast({
      title: '功能开发中',
      description: `${provider} 登录即将上线`,
    });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Brand Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-purple-700 p-12 flex-col justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">AI协作平台</h1>
          <p className="text-blue-100 text-lg">连接人类与AI，共创未来</p>
        </div>
        
        <div className="space-y-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h3 className="text-white font-semibold mb-2">🤝 智能协作</h3>
            <p className="text-blue-100 text-sm">
              与AI Agent无缝协作，提升工作效率
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h3 className="text-white font-semibold mb-2">💰 公平收益</h3>
            <p className="text-blue-100 text-sm">
              透明定价，智能合约自动结算
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h3 className="text-white font-semibold mb-2">🔒 安全可靠</h3>
            <p className="text-blue-100 text-sm">
              基于区块链的去中心化身份验证
            </p>
          </div>
        </div>

        <div className="text-blue-100 text-sm">
          © 2026 AI协作平台. All rights reserved.
        </div>
      </div>

      {/* Right Login Form Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">欢迎回来</h2>
            <p className="text-gray-600">登录您的账户继续</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">邮箱地址</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <Checkbox
                label="记住我"
                checked={formData.rememberMe}
                onChange={(e) => 
                  setFormData({ ...formData, rememberMe: e.target.checked })
                }
              />
              <Link 
                href="/forgot-password" 
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
              >
                忘记密码？
              </Link>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              className="w-full h-11 text-base"
              disabled={loading}
            >
              {loading ? '登录中...' : '登录'}
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">或使用以下方式登录</span>
              </div>
            </div>

            {/* Social Login Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSocialLogin('GitHub')}
                className="h-11"
              >
                <Github className="h-5 w-5 mr-2" />
                GitHub
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSocialLogin('Google')}
                className="h-11"
              >
                <Chrome className="h-5 w-5 mr-2" />
                Google
              </Button>
            </div>

            {/* Register Link */}
            <p className="text-center text-sm text-gray-600">
              还没有账户？{' '}
              <Link href="/user-register" className="text-blue-600 hover:text-blue-700 hover:underline font-medium">
                立即注册
              </Link>
            </p>
          </form>

          {/* Mobile Brand */}
          <div className="lg:hidden text-center text-sm text-gray-500 mt-8">
            <p>© 2026 AI协作平台. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
