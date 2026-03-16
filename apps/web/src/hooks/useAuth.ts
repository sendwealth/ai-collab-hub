/**
 * 认证 Hook
 * 提供认证状态管理和操作方法
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  getTokenFromClient,
  setToken,
  clearToken,
  isAuthenticated as checkAuth,
  getUser,
  setUser,
  isTokenExpired,
} from '@/lib/auth';

interface User {
  id: string;
  username: string;
  email: string;
  role?: 'agent' | 'publisher';
  avatar?: string;
}

interface UseAuthReturn {
  // 状态
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;

  // 方法
  login: (token: string, user: User, rememberMe?: boolean) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export function useAuth(): UseAuthReturn {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUserState] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 初始化认证状态
  useEffect(() => {
    const initAuth = () => {
      const storedToken = getTokenFromClient();
      const storedUser = getUser();

      if (storedToken && storedUser) {
        // 检查 Token 是否过期
        if (!isTokenExpired(storedToken)) {
          setTokenState(storedToken);
          setUserState(storedUser);
          setIsAuthenticated(true);
        } else {
          // Token 过期，清除认证信息
          clearToken();
        }
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  // 登录
  const login = useCallback((newToken: string, newUser: User, rememberMe: boolean = false) => {
    setToken(newToken, rememberMe);
    setUser(newUser, rememberMe);
    setTokenState(newToken);
    setUserState(newUser);
    setIsAuthenticated(true);
  }, []);

  // 登出
  const logout = useCallback(() => {
    clearToken();
    setTokenState(null);
    setUserState(null);
    setIsAuthenticated(false);
    router.push('/');
  }, [router]);

  // 更新用户信息
  const updateUser = useCallback((updates: Partial<User>) => {
    setUserState(prev => {
      if (!prev) return null;
      const updatedUser = { ...prev, ...updates };
      setUser(updatedUser);
      return updatedUser;
    });
  }, []);

  return {
    isAuthenticated,
    user,
    token,
    loading,
    login,
    logout,
    updateUser,
  };
}

/**
 * 需要认证的 Hook
 * 用于保护需要登录的页面
 */
export function useRequireAuth(redirectUrl?: string) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      const currentPath = window.location.pathname;
      const redirect = redirectUrl || `/login?redirect=${encodeURIComponent(currentPath)}`;
      router.push(redirect);
    }
  }, [isAuthenticated, loading, router, redirectUrl]);

  return { isAuthenticated, loading };
}

/**
 * 已认证用户重定向 Hook
 * 用于登录/注册页面，已登录用户自动跳转
 */
export function useRedirectIfAuthenticated(redirectUrl: string = '/dashboard') {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push(redirectUrl);
    }
  }, [isAuthenticated, loading, router, redirectUrl]);

  return { isAuthenticated, loading };
}
