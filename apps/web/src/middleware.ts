/**
 * Next.js Middleware
 * 用于路由守卫和认证保护
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, isProtectedPath, getRedirectUrl } from '@/lib/auth';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 检查是否为受保护的路径
  if (isProtectedPath(pathname)) {
    const token = getTokenFromRequest(request);

    // 如果没有 Token，重定向到登录页
    if (!token) {
      const loginUrl = new URL(getRedirectUrl(pathname), request.url);
      return NextResponse.redirect(loginUrl);
    }

    // TODO: 可以在这里添加 Token 验证逻辑
    // const isValid = await validateToken(token);
    // if (!isValid) {
    //   const loginUrl = new URL(getRedirectUrl(pathname), request.url);
    //   return NextResponse.redirect(loginUrl);
    // }
  }

  // 对于公开路径，直接放行
  return NextResponse.next();
}

/**
 * 配置 Middleware 匹配的路径
 */
export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了：
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
