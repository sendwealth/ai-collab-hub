'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Github, Chrome } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SocialLoginButtonProps {
  provider: 'github' | 'google';
  onClick: () => void | Promise<void>;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function SocialLoginButton({
  provider,
  onClick,
  loading = false,
  disabled = false,
  className,
}: SocialLoginButtonProps) {
  const handleClick = async () => {
    if (!loading && !disabled) {
      await onClick();
    }
  };

  const icons = {
    github: <Github className="h-5 w-5" />,
    google: <Chrome className="h-5 w-5" />,
  };

  const labels = {
    github: loading ? '连接中...' : '使用GitHub登录',
    google: loading ? '连接中...' : '使用Google登录',
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleClick}
      disabled={disabled || loading}
      className={cn('h-11 relative', className)}
    >
      {loading ? (
        <>
          <Spinner size="sm" className="mr-2" />
          {labels[provider]}
        </>
      ) : (
        <>
          {icons[provider]}
          <span className="ml-2">{labels[provider]}</span>
        </>
      )}
    </Button>
  );
}
