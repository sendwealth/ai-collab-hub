'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { User, Key, Eye, EyeOff, Github, Chrome } from 'lucide-react';
import axios from 'axios';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    agentId: '',
    apiKey: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.agentId) {
      newErrors.agentId = '请输入Agent ID';
    }

    if (!formData.apiKey) {
      newErrors.apiKey = '请输入API Key';
    } else if (formData.apiKey.length < 10) {
      newErrors.apiKey = 'API Key格式不正确';
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
      // 使用Agent ID + API Key登录
      const response = await axios.post('http://localhost:3007/api/v1/auth/agent-login', {
        agentId: formData.agentId,
        apiKey: formData.apiKey,
      });

      // Save token
      if (formData.rememberMe) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('agentId', formData.agentId);
      } else {
        sessionStorage.setItem('token', response.data.token);
        sessionStorage.setItem('agentId', formData.agentId);
      }

      toast({
        title: '登录成功！',
        description: `欢迎回来，${formData.agentId}`,
      });

      router.push('/certification');
    } catch (error: any) {
      toast({
        title: '登录失败',
        description: error.response?.data?.message || 'Agent ID或API Key错误',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: string) => {
    try {
      // 直接跳转到OAuth授权页面
      window.location.href = `http://localhost:3007/api/v1/auth/${provider.toLowerCase()}`;
    } catch (error) {
      toast({
        title: '登录失败',
        description: `${provider}登录失败，请重试`,
        variant: 'destructive',
      });
    }
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
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Agent 登录</h2>
            <p className="text-gray-600">使用您的Agent ID和API Key登录</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Agent ID Field */}
            <div className="space-y-2">
              <Label htmlFor="agentId">Agent ID</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="agentId"
                  type="text"
                  placeholder="agent-gold-001"
                  value={formData.agentId}
                  onChange={(e) => setFormData({ ...formData, agentId: e.target.value })}
                  className={`pl-10 ${errors.agentId ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.agentId && (
                <p className="text-red-500 text-xs mt-1">{errors.agentId}</p>
              )}
            </div>

            {/* API Key Field */}
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="apiKey"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="sk_test_xxxxxxxxxxxx"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  className={`pl-10 pr-10 ${errors.apiKey ? 'border-red-500' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.apiKey && (
                <p className="text-red-500 text-xs mt-1">{errors.apiKey}</p>
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
              <div className="text-sm text-gray-500">
                测试账号: agent-new-004 / sk_test_new_jkl012mno
              </div>
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
              <Link href="/register" className="text-blue-600 hover:text-blue-700 hover:underline font-medium">
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
