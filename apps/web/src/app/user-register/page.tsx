'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { User, Mail, Lock, Eye, EyeOff, Github, Chrome, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

export default function UserRegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [passwordStrength, setPasswordStrength] = useState(0);

  const checkPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/)) strength++;
    if (password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;
    setPasswordStrength(strength);
  };

  const getPasswordStrengthLabel = () => {
    if (passwordStrength <= 1) return { text: '弱', color: 'text-red-500' };
    if (passwordStrength <= 2) return { text: '一般', color: 'text-yellow-500' };
    if (passwordStrength <= 3) return { text: '良好', color: 'text-blue-500' };
    return { text: '强', color: 'text-green-500' };
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username) {
      newErrors.username = '请输入用户名';
    } else if (formData.username.length < 3) {
      newErrors.username = '用户名至少需要3个字符';
    } else if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(formData.username)) {
      newErrors.username = '用户名只能包含字母、数字、下划线和中文';
    }

    if (!formData.email) {
      newErrors.email = '请输入邮箱地址';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '请输入有效的邮箱地址';
    }

    if (!formData.password) {
      newErrors.password = '请输入密码';
    } else if (formData.password.length < 8) {
      newErrors.password = '密码至少需要8个字符';
    } else if (passwordStrength < 3) {
      newErrors.password = '密码强度不足，请包含大小写字母、数字和特殊字符';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '请确认密码';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致';
    }

    if (!formData.agreeTerms) {
      newErrors.agreeTerms = '请阅读并同意用户协议和隐私政策';
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
      const response = await axios.post('http://localhost:3000/api/v1/auth/register', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      toast({
        title: '注册成功！',
        description: '请查收邮箱完成验证',
      });

      // Save token and redirect
      localStorage.setItem('token', response.data.token);
      router.push('/welcome');
    } catch (error: any) {
      toast({
        title: '注册失败',
        description: error.response?.data?.message || '请检查输入信息',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSocialRegister = (provider: string) => {
    toast({
      title: '功能开发中',
      description: `${provider} 注册即将上线`,
    });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Brand Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-600 to-blue-700 p-12 flex-col justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">AI协作平台</h1>
          <p className="text-purple-100 text-lg">开启您的AI协作之旅</p>
        </div>
        
        <div className="space-y-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="h-6 w-6 text-green-300 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-white font-semibold mb-1">快速上手</h3>
                <p className="text-purple-100 text-sm">
                  3分钟完成注册，立即开始使用
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="h-6 w-6 text-green-300 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-white font-semibold mb-1">免费试用</h3>
                <p className="text-purple-100 text-sm">
                  新用户赠送100积分，免费体验所有功能
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="h-6 w-6 text-green-300 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-white font-semibold mb-1">安全保障</h3>
                <p className="text-purple-100 text-sm">
                  端到端加密，保护您的数据安全
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-purple-100 text-sm">
          © 2026 AI协作平台. All rights reserved.
        </div>
      </div>

      {/* Right Register Form Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">创建账户</h2>
            <p className="text-gray-600">加入我们，探索AI协作的无限可能</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Field */}
            <div className="space-y-2">
              <Label htmlFor="username">用户名</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="username"
                  type="text"
                  placeholder="您的用户名"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className={`pl-10 ${errors.username ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.username && (
                <p className="text-red-500 text-xs mt-1">{errors.username}</p>
              )}
            </div>

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
                  onChange={(e) => {
                    const password = e.target.value;
                    setFormData({ ...formData, password });
                    checkPasswordStrength(password);
                  }}
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
              {formData.password && (
                <div className="flex items-center justify-between mt-1">
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`h-1 w-6 rounded ${
                          level <= passwordStrength
                            ? passwordStrength <= 1
                              ? 'bg-red-500'
                              : passwordStrength <= 2
                              ? 'bg-yellow-500'
                              : passwordStrength <= 3
                              ? 'bg-blue-500'
                              : 'bg-green-500'
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className={`text-xs ${getPasswordStrengthLabel().color}`}>
                    {getPasswordStrengthLabel().text}
                  </span>
                </div>
              )}
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">确认密码</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className={`pl-10 pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Agree Terms */}
            <div className="space-y-2">
              <Checkbox
                label={
                  <span className="text-sm text-gray-600">
                    我已阅读并同意{' '}
                    <Link href="/terms" className="text-blue-600 hover:underline">
                      用户协议
                    </Link>{' '}
                    和{' '}
                    <Link href="/privacy" className="text-blue-600 hover:underline">
                      隐私政策
                    </Link>
                  </span>
                }
                checked={formData.agreeTerms}
                onChange={(e) => 
                  setFormData({ ...formData, agreeTerms: e.target.checked })
                }
              />
              {errors.agreeTerms && (
                <p className="text-red-500 text-xs mt-1">{errors.agreeTerms}</p>
              )}
            </div>

            {/* Register Button */}
            <Button
              type="submit"
              className="w-full h-11 text-base"
              disabled={loading}
            >
              {loading ? '注册中...' : '创建账户'}
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">或使用以下方式注册</span>
              </div>
            </div>

            {/* Social Register Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSocialRegister('GitHub')}
                className="h-11"
              >
                <Github className="h-5 w-5 mr-2" />
                GitHub
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSocialRegister('Google')}
                className="h-11"
              >
                <Chrome className="h-5 w-5 mr-2" />
                Google
              </Button>
            </div>

            {/* Login Link */}
            <p className="text-center text-sm text-gray-600">
              已有账户？{' '}
              <Link href="/login" className="text-blue-600 hover:text-blue-700 hover:underline font-medium">
                立即登录
              </Link>
            </p>
          </form>

          {/* Mobile Brand */}
          <div className="lg:hidden text-center text-sm text-gray-500 mt-6">
            <p>© 2026 AI协作平台. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
