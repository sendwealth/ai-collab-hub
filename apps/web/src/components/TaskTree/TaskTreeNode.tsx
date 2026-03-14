'use client';

import * as React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ProgressBar } from './ProgressBar';
import { cn } from '@/lib/utils';

export interface TaskNode {
  id: string;
  title: string;
  description?: string;
  status: string;
  type: string;
  category?: string;
  progress: {
    total: number;
    completed: number;
    percentage: number;
  };
  children?: TaskNode[];
  creator?: {
    id: string;
    name: string;
  };
  assignee?: {
    id: string;
    name: string;
  };
}

interface TaskTreeNodeProps {
  node: TaskNode;
  depth?: number;
  onAddSubtask?: (taskId: string) => void;
  onRemoveSubtask?: (parentId: string, childId: string) => void;
  onViewTask?: (taskId: string) => void;
}

export function TaskTreeNode({
  node,
  depth = 0,
  onAddSubtask,
  onRemoveSubtask,
  onViewTask,
}: TaskTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'reviewing':
        return 'bg-purple-100 text-purple-800';
      case 'assigned':
        return 'bg-blue-100 text-blue-800';
      case 'open':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'reviewing':
        return '👁';
      case 'assigned':
        return '👤';
      case 'open':
        return '○';
      case 'cancelled':
        return '✗';
      default:
        return '○';
    }
  };

  return (
    <div className="select-none">
      <div
        className={cn(
          'flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors',
          depth === 0 && 'bg-blue-50 border border-blue-200'
        )}
      >
        {/* 展开/折叠按钮 */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            'flex-shrink-0 w-6 h-6 flex items-center justify-center rounded transition-transform',
            hasChildren ? 'hover:bg-gray-200' : 'opacity-30'
          )}
        >
          {hasChildren ? (
            <span
              className={cn(
                'inline-block transition-transform',
                isExpanded && 'rotate-90'
              )}
            >
              ▶
            </span>
          ) : (
            <span>•</span>
          )}
        </button>

        {/* 任务内容 */}
        <div className="flex-grow min-w-0">
          <div className="flex items-start gap-2 mb-1">
            <span className="text-lg">{getStatusIcon(node.status)}</span>
            <div className="flex-grow">
              <h4 className="font-semibold text-gray-900 truncate">
                {node.title}
              </h4>
              {node.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {node.description}
                </p>
              )}
            </div>
            <span
              className={cn(
                'flex-shrink-0 px-2 py-1 rounded text-xs font-medium',
                getStatusColor(node.status)
              )}
            >
              {node.status}
            </span>
          </div>

          {/* 元信息 */}
          <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-2">
            <span>类型: {node.type}</span>
            {node.category && <span>分类: {node.category}</span>}
            {node.creator && <span>创建者: {node.creator.name}</span>}
            {node.assignee && <span>执行者: {node.assignee.name}</span>}
          </div>

          {/* 进度条 */}
          {node.progress.total > 1 && (
            <div className="mt-3">
              <ProgressBar progress={node.progress} />
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-2 mt-3">
            {onViewTask && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onViewTask(node.id)}
              >
                查看详情
              </Button>
            )}
            {onAddSubtask && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onAddSubtask(node.id)}
              >
                + 添加子任务
              </Button>
            )}
            {depth > 0 && onRemoveSubtask && (
              <Button
                size="sm"
                variant="ghost"
                className="text-red-600 hover:text-red-700"
                onClick={() => onRemoveSubtask(node.id, node.id)}
              >
                移除
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 子节点 */}
      {hasChildren && isExpanded && (
        <div className="ml-6 mt-1 border-l-2 border-gray-200 pl-2">
          {node.children!.map((child) => (
            <TaskTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              onAddSubtask={onAddSubtask}
              onRemoveSubtask={onRemoveSubtask}
              onViewTask={onViewTask}
            />
          ))}
        </div>
      )}
    </div>
  );
}
