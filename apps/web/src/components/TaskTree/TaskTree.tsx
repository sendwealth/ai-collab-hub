'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { TaskTreeNode, TaskNode } from './TaskTreeNode';
import { SubtaskDialog, SubtaskFormData } from './SubtaskDialog';
import { ProgressBar } from './ProgressBar';
import { Button } from '@/components/ui/button';

interface TaskTreeProps {
  taskId: string;
  apiBaseUrl?: string;
}

export function TaskTree({ taskId, apiBaseUrl = 'http://localhost:3007/api/v1' }: TaskTreeProps) {
  const [treeData, setTreeData] = useState<TaskNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);

  // 获取任务树数据
  const fetchTaskTree = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiBaseUrl}/tasks/${taskId}/tree`);
      if (!response.ok) {
        throw new Error('Failed to fetch task tree');
      }
      const data = await response.json();
      setTreeData(data.tree);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskTree();
  }, [taskId, apiBaseUrl]);

  // 添加子任务
  const handleAddSubtask = async (data: SubtaskFormData) => {
    if (!selectedParentId) return;

    try {
      const response = await fetch(
        `${apiBaseUrl}/tasks/${selectedParentId}/subtasks`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to add subtask');
      }

      // 刷新树
      await fetchTaskTree();
    } catch (err) {
      console.error('Error adding subtask:', err);
      alert('添加子任务失败');
    }
  };

  // 移除子任务
  const handleRemoveSubtask = async (parentId: string, childId: string) => {
    if (!confirm('确定要移除此子任务关系吗？')) return;

    try {
      const response = await fetch(
        `${apiBaseUrl}/tasks/${parentId}/subtasks/${childId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to remove subtask');
      }

      // 刷新树
      await fetchTaskTree();
    } catch (err) {
      console.error('Error removing subtask:', err);
      alert('移除子任务失败');
    }
  };

  // 查看任务详情
  const handleViewTask = (taskId: string) => {
    window.location.href = `/tasks/${taskId}`;
  };

  // 打开添加子任务对话框
  const openAddSubtaskDialog = (parentId: string) => {
    setSelectedParentId(parentId);
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-500 mb-4">错误: {error}</div>
        <Button onClick={fetchTaskTree}>重试</Button>
      </div>
    );
  }

  if (!treeData) {
    return <div className="text-gray-500 p-8">未找到任务</div>;
  }

  return (
    <div className="space-y-4">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">任务树</h2>
        <Button onClick={() => openAddSubtaskDialog(taskId)}>
          添加子任务
        </Button>
      </div>

      {/* 总体进度 */}
      {treeData.progress && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">总体进度</h3>
          <ProgressBar progress={treeData.progress} />
        </div>
      )}

      {/* 任务树 */}
      <div className="border rounded-lg p-4">
        <TaskTreeNode
          node={treeData}
          onAddSubtask={openAddSubtaskDialog}
          onRemoveSubtask={handleRemoveSubtask}
          onViewTask={handleViewTask}
        />
      </div>

      {/* 添加子任务对话框 */}
      <SubtaskDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedParentId(null);
        }}
        onSubmit={handleAddSubtask}
        parentId={selectedParentId || ''}
      />
    </div>
  );
}
