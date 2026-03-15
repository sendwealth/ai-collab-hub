'use client';

import { DragEvent } from 'react';
import { cn } from '@/lib/utils';
import { 
  Play, 
  Square, 
  FileText, 
  GitBranch, 
  GitMerge, 
  Clock 
} from 'lucide-react';

interface NodeItem {
  type: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
}

const nodeItems: NodeItem[] = [
  {
    type: 'start',
    label: '开始',
    icon: <Play className="w-4 h-4" />,
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-500',
  },
  {
    type: 'end',
    label: '结束',
    icon: <Square className="w-4 h-4" />,
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-500',
  },
  {
    type: 'task',
    label: '任务',
    icon: <FileText className="w-4 h-4" />,
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-500',
  },
  {
    type: 'condition',
    label: '条件',
    icon: <GitBranch className="w-4 h-4" />,
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-500',
  },
  {
    type: 'parallel',
    label: '并行',
    icon: <GitMerge className="w-4 h-4" />,
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-500',
  },
  {
    type: 'delay',
    label: '延迟',
    icon: <Clock className="w-4 h-4" />,
    color: 'text-gray-700',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-500',
  },
];

export function NodeLibrary() {
  const onDragStart = (event: DragEvent<HTMLDivElement>, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">节点库</h3>
        <div className="space-y-2">
          {nodeItems.map((item) => (
            <div
              key={item.type}
              draggable
              onDragStart={(e) => onDragStart(e, item.type)}
              className={cn(
                'p-3 rounded-lg border-2 cursor-grab active:cursor-grabbing transition-all hover:shadow-md',
                item.bgColor,
                item.borderColor
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn('p-2 rounded', item.borderColor.replace('border-', 'bg-'))}>
                  <div className="text-white">{item.icon}</div>
                </div>
                <div>
                  <div className={cn('font-medium text-sm', item.color)}>
                    {item.label}
                  </div>
                  <div className="text-xs text-gray-500">拖拽添加</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">使用说明</h3>
        <ul className="text-xs text-gray-600 space-y-2">
          <li>• 拖拽节点到画布</li>
          <li>• 连接节点创建流程</li>
          <li>• 点击节点编辑属性</li>
          <li>• 右键菜单更多操作</li>
        </ul>
      </div>
    </div>
  );
}
