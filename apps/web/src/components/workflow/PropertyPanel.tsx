'use client';

import { useState } from 'react';
import { Node } from 'reactflow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X } from 'lucide-react';

interface PropertyPanelProps {
  selectedNode: Node | null;
  onUpdateNode: (nodeId: string, data: any) => void;
  onClose: () => void;
}

export function PropertyPanel({ selectedNode, onUpdateNode, onClose }: PropertyPanelProps) {
  const [label, setLabel] = useState(selectedNode?.data?.label || '');
  const [description, setDescription] = useState(selectedNode?.data?.description || '');
  const [condition, setCondition] = useState(selectedNode?.data?.condition || '');
  const [duration, setDuration] = useState(selectedNode?.data?.duration || '');

  if (!selectedNode) {
    return (
      <div className="h-48 bg-white border-t border-gray-200 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="text-sm">选择一个节点查看属性</p>
          <p className="text-xs mt-1">点击画布中的节点进行编辑</p>
        </div>
      </div>
    );
  }

  const handleSave = () => {
    const updateData: any = { label };
    
    if (selectedNode.type === 'task') {
      updateData.description = description;
    } else if (selectedNode.type === 'condition') {
      updateData.condition = condition;
    } else if (selectedNode.type === 'delay') {
      updateData.duration = duration;
    }

    onUpdateNode(selectedNode.id, updateData);
  };

  const getNodeTitle = () => {
    switch (selectedNode.type) {
      case 'start':
        return '开始节点';
      case 'end':
        return '结束节点';
      case 'task':
        return '任务节点';
      case 'condition':
        return '条件节点';
      case 'parallel':
        return '并行节点';
      case 'delay':
        return '延迟节点';
      default:
        return '节点属性';
    }
  };

  return (
    <div className="h-48 bg-white border-t border-gray-200 overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">{getNodeTitle()}</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-3">
          <div>
            <Label htmlFor="label" className="text-xs">节点名称</Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="输入节点名称"
              className="h-8 mt-1"
            />
          </div>

          {selectedNode.type === 'task' && (
            <div>
              <Label htmlFor="description" className="text-xs">任务描述</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="输入任务描述"
                className="mt-1 min-h-[60px]"
              />
            </div>
          )}

          {selectedNode.type === 'condition' && (
            <div>
              <Label htmlFor="condition" className="text-xs">条件表达式</Label>
              <Textarea
                id="condition"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                placeholder="输入条件表达式，例如: status === 'success'"
                className="mt-1 min-h-[60px]"
              />
            </div>
          )}

          {selectedNode.type === 'delay' && (
            <div>
              <Label htmlFor="duration" className="text-xs">延迟时间</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="h-8 mt-1">
                  <SelectValue placeholder="选择延迟时间" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1s">1秒</SelectItem>
                  <SelectItem value="5s">5秒</SelectItem>
                  <SelectItem value="10s">10秒</SelectItem>
                  <SelectItem value="30s">30秒</SelectItem>
                  <SelectItem value="1m">1分钟</SelectItem>
                  <SelectItem value="5m">5分钟</SelectItem>
                  <SelectItem value="10m">10分钟</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button size="sm" onClick={handleSave} className="flex-1">
              保存
            </Button>
            <Button size="sm" variant="outline" onClick={onClose} className="flex-1">
              取消
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
