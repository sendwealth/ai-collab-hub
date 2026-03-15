'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { cn } from '@/lib/utils';
import { 
  Play, 
  Square, 
  FileText, 
  GitBranch, 
  GitMerge, 
  Clock 
} from 'lucide-react';

// Base styles for all nodes
const baseNodeStyles = 'px-4 py-3 rounded-lg shadow-md border-2 min-w-[120px] flex items-center gap-3 transition-all';

// Start Node (Green)
export const StartNode = memo(({ data }: NodeProps) => {
  return (
    <div className={cn(baseNodeStyles, 'bg-green-50 border-green-500')}>
      <div className="bg-green-500 p-2 rounded">
        <Play className="w-4 h-4 text-white" />
      </div>
      <div>
        <div className="font-semibold text-green-900">Start</div>
        <div className="text-xs text-green-700">{data?.label || '开始'}</div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-green-500" />
    </div>
  );
});

StartNode.displayName = 'StartNode';

// End Node (Red)
export const EndNode = memo(({ data }: NodeProps) => {
  return (
    <div className={cn(baseNodeStyles, 'bg-red-50 border-red-500')}>
      <Handle type="target" position={Position.Top} className="!bg-red-500" />
      <div className="bg-red-500 p-2 rounded">
        <Square className="w-4 h-4 text-white" />
      </div>
      <div>
        <div className="font-semibold text-red-900">End</div>
        <div className="text-xs text-red-700">{data?.label || '结束'}</div>
      </div>
    </div>
  );
});

EndNode.displayName = 'EndNode';

// Task Node (Blue)
export const TaskNode = memo(({ data }: NodeProps) => {
  return (
    <div className={cn(baseNodeStyles, 'bg-blue-50 border-blue-500')}>
      <Handle type="target" position={Position.Top} className="!bg-blue-500" />
      <div className="bg-blue-500 p-2 rounded">
        <FileText className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1">
        <div className="font-semibold text-blue-900">Task</div>
        <div className="text-xs text-blue-700">{data?.label || '任务'}</div>
        {data?.description && (
          <div className="text-xs text-blue-600 mt-1">{data.description}</div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-blue-500" />
    </div>
  );
});

TaskNode.displayName = 'TaskNode';

// Condition Node (Orange)
export const ConditionNode = memo(({ data }: NodeProps) => {
  return (
    <div className={cn(baseNodeStyles, 'bg-orange-50 border-orange-500')}>
      <Handle type="target" position={Position.Top} className="!bg-orange-500" />
      <div className="bg-orange-500 p-2 rounded">
        <GitBranch className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1">
        <div className="font-semibold text-orange-900">Condition</div>
        <div className="text-xs text-orange-700">{data?.label || '条件判断'}</div>
        {data?.condition && (
          <div className="text-xs text-orange-600 mt-1">{data.condition}</div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} id="true" className="!bg-orange-500" style={{ left: '30%' }} />
      <Handle type="source" position={Position.Bottom} id="false" className="!bg-orange-500" style={{ left: '70%' }} />
    </div>
  );
});

ConditionNode.displayName = 'ConditionNode';

// Parallel Node (Purple)
export const ParallelNode = memo(({ data }: NodeProps) => {
  return (
    <div className={cn(baseNodeStyles, 'bg-purple-50 border-purple-500')}>
      <Handle type="target" position={Position.Top} className="!bg-purple-500" />
      <div className="bg-purple-500 p-2 rounded">
        <GitMerge className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1">
        <div className="font-semibold text-purple-900">Parallel</div>
        <div className="text-xs text-purple-700">{data?.label || '并行执行'}</div>
      </div>
      <Handle type="source" position={Position.Bottom} id="branch1" className="!bg-purple-500" style={{ left: '30%' }} />
      <Handle type="source" position={Position.Bottom} id="branch2" className="!bg-purple-500" style={{ left: '70%' }} />
    </div>
  );
});

ParallelNode.displayName = 'ParallelNode';

// Delay Node (Gray)
export const DelayNode = memo(({ data }: NodeProps) => {
  return (
    <div className={cn(baseNodeStyles, 'bg-gray-50 border-gray-500')}>
      <Handle type="target" position={Position.Top} className="!bg-gray-500" />
      <div className="bg-gray-500 p-2 rounded">
        <Clock className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1">
        <div className="font-semibold text-gray-900">Delay</div>
        <div className="text-xs text-gray-700">{data?.label || '延迟'}</div>
        {data?.duration && (
          <div className="text-xs text-gray-600 mt-1">{data.duration}</div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-gray-500" />
    </div>
  );
});

DelayNode.displayName = 'DelayNode';

// Node types mapping
export const nodeTypes = {
  start: StartNode,
  end: EndNode,
  task: TaskNode,
  condition: ConditionNode,
  parallel: ParallelNode,
  delay: DelayNode,
};
