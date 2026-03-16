/**
 * 认证工具函数
 * 提供统一的认证相关操作
 */

import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

/**
 * Token 配置
 */
export const TOKEN_KEY = 'token';
export const USER_KEY = 'user';

/**
 * 受保护的路由路径
 */
export const PROTECTED_PATHS = [
  '/dashboard',
  '/tasks/create',
  '/tasks/bid',
  '/profile',
  '/settings',
  '/credits',
];

/**
 * 公开路由（无需认证）
 */
export const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/user-register',
  '/tasks',
  '/agents',
  '/search',
];

/**
 * 检查路径是否需要认证
 */
export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some(path => pathname.startsWith(path));
}

/**
 * 检查路径是否为公开路径
 */
export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(path => pathname === path || pathname.startsWith(path));
}

/**
 * 从请求中获取 Token（服务端）
 */
export function getTokenFromRequest(request: NextRequest): string | null {
  // 1. 从 Cookie 中获取
  const cookieToken = request.cookies.get(TOKEN_KEY)?.value;
  if (cookieToken) return cookieToken;

  // 2. 从 Authorization Header 中获取
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

/**
 * 从客户端存储中获取 Token
 */
export function getTokenFromClient(): string | null {
  if (typeof window === 'undefined') return null;

  // 优先从 localStorage 获取（记住我）
  const localToken = localStorage.getItem(TOKEN_KEY);
  if (localToken) return localToken;

  // 其次从 sessionStorage 获取
  const sessionToken = sessionStorage.getItem(TOKEN_KEY);
  if (sessionToken) return sessionToken;

  return null;
}

/**
 * 设置 Token 到客户端存储
 */
export function setToken(token: string, rememberMe: boolean = false): void {
  if (typeof window === 'undefined') return;

  if (rememberMe) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    sessionStorage.setItem(TOKEN_KEY, token);
  }
}

/**
 * 清除 Token
 */
export function clearToken(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(USER_KEY);
}

/**
 * 检查用户是否已认证（客户端）
 */
export function isAuthenticated(): boolean {
  return !!getTokenFromClient();
}

/**
 * 解析 JWT Token（不验证签名，仅用于提取信息）
 */
export function parseJwt(token: string): any {
  try {
    const base64Payload = token.split('.')[1];
    const payload = atob(base64Payload);
    return JSON.parse(payload);
  } catch (e) {
    return null;
  }
}

/**
 * 检查 Token 是否过期
 */
export function isTokenExpired(token: string): boolean {
  const payload = parseJwt(token);
  if (!payload || !payload.exp) return true;

  const expirationTime = payload.exp * 1000; // 转换为毫秒
  return Date.now() >= expirationTime;
}

/**
 * 获取用户信息
 */
export function getUser(): any {
  if (typeof window === 'undefined') return null;

  const userJson = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
  if (!userJson) return null;

  try {
    return JSON.parse(userJson);
  } catch (e) {
    return null;
  }
}

/**
 * 设置用户信息
 */
export function setUser(user: any, rememberMe: boolean = false): void {
  if (typeof window === 'undefined') return;

  const userJson = JSON.stringify(user);
  if (rememberMe) {
    localStorage.setItem(USER_KEY, userJson);
  } else {
    sessionStorage.setItem(USER_KEY, userJson);
  }
}

/**
 * 获取重定向 URL
 */
export function getRedirectUrl(currentPath: string): string {
  return `/login?redirect=${encodeURIComponent(currentPath)}`;
}

/**
 * 验证 Token 有效性（需要调用后端 API）
 */
export async function validateToken(token: string): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:3007/api/v1/auth/validate', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    return response.ok;
  } catch (error) {
    console.error('Token validation failed:', error);
    return false;
  }
}
