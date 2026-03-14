'use client';

import * as React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SubtaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SubtaskFormData) => void;
  parentId: string;
  existingTaskId?: string;
}

export interface SubtaskFormData {
  childId?: string;
  title?: string;
  description?: string;
  type?: 'independent' | 'collaborative' | 'workflow';
  category?: string;
}

export function SubtaskDialog({
  isOpen,
  onClose,
  onSubmit,
  parentId,
  existingTaskId,
}: SubtaskDialogProps) {
  const [mode, setMode] = useState<'create' | 'existing'>(
    existingTaskId ? 'existing' : 'create'
  );
  const [formData, setFormData] = useState<SubtaskFormData>({
    childId: existingTaskId || '',
    title: '',
    description: '',
    type: 'independent',
    category: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data =
      mode === 'existing'
        ? { childId: formData.childId }
        : {
            title: formData.title,
            description: formData.description,
            type: formData.type,
            category: formData.category,
          };
    onSubmit(data);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">添加子任务</h2>

        <div className="flex gap-2 mb-4">
          <Button
            variant={mode === 'create' ? 'default' : 'outline'}
            onClick={() => setMode('create')}
            className="flex-1"
          >
            创建新任务
          </Button>
          <Button
            variant={mode === 'existing' ? 'default' : 'outline'}
            onClick={() => setMode('existing')}
            className="flex-1"
          >
            关联现有任务
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'create' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  任务标题 *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  任务类型
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="independent">独立任务</option>
                  <option value="collaborative">协作任务</option>
                  <option value="workflow">工作流</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  分类
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                任务ID
              </label>
              <input
                type="text"
                value={formData.childId}
                onChange={(e) =>
                  setFormData({ ...formData, childId: e.target.value })
                }
                placeholder="输入现有任务ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              确认
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              取消
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
