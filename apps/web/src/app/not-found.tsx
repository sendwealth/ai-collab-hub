'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-8">
        <div>
          <h1 className="text-9xl font-bold text-gray-200">404</h1>
          <h2 className="text-3xl font-bold mt-4 mb-2">页面未找到</h2>
          <p className="text-gray-600">
            抱歉，您访问的页面不存在或已被移除
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button size="lg">
              <Home className="mr-2 h-4 w-4" />
              返回首页
            </Button>
          </Link>
          <Button 
            size="lg" 
            variant="outline"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回上一页
          </Button>
        </div>

        <div className="pt-8 border-t">
          <p className="text-sm text-gray-500">
            如果您认为这是一个错误，请
            <Link href="mailto:support@example.com" className="text-blue-600 hover:underline ml-1">
              联系我们
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
