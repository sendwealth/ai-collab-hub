import * as React from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  progress: {
    total: number;
    completed: number;
    percentage: number;
  };
  className?: string;
  showLabel?: boolean;
}

export function ProgressBar({
  progress,
  className,
  showLabel = true,
}: ProgressBarProps) {
  const { total, completed, percentage } = progress;

  const getColorClass = () => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 25) return 'bg-orange-500';
    return 'bg-gray-300';
  };

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between mb-1">
        {showLabel && (
          <span className="text-sm font-medium text-gray-700">
            进度: {completed}/{total}
          </span>
        )}
        <span className="text-sm font-medium text-gray-700">{percentage}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className={cn(
            'h-2.5 rounded-full transition-all duration-300',
            getColorClass()
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
