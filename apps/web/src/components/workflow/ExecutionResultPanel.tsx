'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  X,
  CheckCircle,
  XCircle,
  Clock,
  Play,
  Download,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NodeExecutionResult {
  nodeId: string;
  nodeType: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  output?: Record<string, any>;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  duration?: number;
}

interface ExecutionResult {
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime?: string;
  endTime?: string;
  totalDuration?: number;
  steps: NodeExecutionResult[];
  context?: Record<string, any>;
  error?: string;
}

interface ExecutionResultPanelProps {
  result: ExecutionResult | null;
  isLoading?: boolean;
  onClose?: () => void;
}

export function ExecutionResultPanel({
  result,
  isLoading,
  onClose,
}: ExecutionResultPanelProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [showContext, setShowContext] = useState(false);

  if (!result && !isLoading) return null;

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const exportLog = () => {
    if (!result) return;

    const log = {
      exportedAt: new Date().toISOString(),
      execution: result,
    };

    const blob = new Blob([JSON.stringify(log, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workflow-execution-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'running':
        return <Play className="w-4 h-4 text-blue-500 animate-pulse" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'failed':
        return 'bg-red-50 border-red-200';
      case 'running':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatTime = (time?: string) => {
    if (!time) return '-';
    return new Date(time).toLocaleTimeString('zh-CN');
  };

  return (
    <div className="w-96 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">执行结果</h3>
        <div className="flex items-center gap-2">
          {result && (
            <Button variant="ghost" size="sm" onClick={exportLog}>
              <Download className="w-4 h-4" />
            </Button>
          )}
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4" />
            <p className="text-gray-500">正在执行工作流...</p>
          </div>
        ) : result ? (
          <div className="space-y-4">
            {/* Status Summary */}
            <div
              className={cn(
                'p-4 rounded-lg border',
                getStatusColor(result.status)
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                {getStatusIcon(result.status)}
                <span className="font-medium capitalize">
                  {result.status === 'completed'
                    ? '执行成功'
                    : result.status === 'failed'
                    ? '执行失败'
                    : result.status}
                </span>
              </div>

              {result.error && (
                <p className="text-sm text-red-600 mt-2">{result.error}</p>
              )}

              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">开始时间:</span>
                  <span className="ml-2">{formatTime(result.startTime)}</span>
                </div>
                <div>
                  <span className="text-gray-500">结束时间:</span>
                  <span className="ml-2">{formatTime(result.endTime)}</span>
                </div>
                <div>
                  <span className="text-gray-500">总耗时:</span>
                  <span className="ml-2">
                    {formatDuration(result.totalDuration)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">执行步骤:</span>
                  <span className="ml-2">{result.steps.length}</span>
                </div>
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-2">
              <h4 className="font-medium text-gray-700">执行步骤</h4>
              {result.steps.map((step, index) => (
                <div
                  key={step.nodeId}
                  className={cn(
                    'border rounded-lg overflow-hidden',
                    getStatusColor(step.status)
                  )}
                >
                  <button
                    className="w-full p-3 flex items-center gap-2 text-left hover:bg-black/5"
                    onClick={() => toggleNode(step.nodeId)}
                  >
                    {expandedNodes.has(step.nodeId) ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                    {getStatusIcon(step.status)}
                    <span className="flex-1 font-medium">
                      {index + 1}. {step.nodeId}
                    </span>
                    <span className="text-xs text-gray-500">
                      {step.nodeType}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDuration(step.duration)}
                    </span>
                  </button>

                  {expandedNodes.has(step.nodeId) && (
                    <div className="px-4 pb-3 border-t border-gray-100">
                      {step.error && (
                        <div className="mt-2 p-2 bg-red-100 rounded text-sm text-red-700">
                          {step.error}
                        </div>
                      )}

                      {step.output && (
                        <div className="mt-2">
                          <span className="text-xs text-gray-500">输出:</span>
                          <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                            {JSON.stringify(step.output, null, 2)}
                          </pre>
                        </div>
                      )}

                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-500">
                        <div>开始: {formatTime(step.startedAt)}</div>
                        <div>结束: {formatTime(step.completedAt)}</div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Context */}
            {result.context && Object.keys(result.context).length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <button
                  className="w-full p-3 flex items-center gap-2 text-left hover:bg-gray-50 bg-gray-50"
                  onClick={() => setShowContext(!showContext)}
                >
                  {showContext ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                  <span className="font-medium">执行上下文</span>
                </button>

                {showContext && (
                  <div className="p-3 border-t border-gray-100">
                    <pre className="text-xs overflow-x-auto">
                      {JSON.stringify(result.context, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
