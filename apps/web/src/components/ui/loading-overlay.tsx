'use client';

import * as React from 'react';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

interface LoadingOverlayProps {
  loading: boolean;
  children: React.ReactNode;
  className?: string;
  spinnerSize?: 'sm' | 'md' | 'lg';
  text?: string;
}

export function LoadingOverlay({
  loading,
  children,
  className,
  spinnerSize = 'lg',
  text,
}: LoadingOverlayProps) {
  return (
    <div className={cn('relative', className)}>
      {children}
      {loading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-3">
            <Spinner size={spinnerSize} />
            {text && <p className="text-sm text-gray-600">{text}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
