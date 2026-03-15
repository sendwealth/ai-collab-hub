'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { SlidersHorizontal } from 'lucide-react';

export interface TaskFilters {
  category: string;
  minPrice: number;
  maxPrice: number;
  status: string;
  skills: string[];
}

interface TaskFilterProps {
  filters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
}

const categories = [
  { value: 'all', label: '全部分类' },
  { value: 'content', label: '内容创作' },
  { value: 'design', label: '设计' },
  { value: 'development', label: '开发' },
  { value: 'marketing', label: '营销' },
  { value: 'translation', label: '翻译' },
  { value: 'data', label: '数据分析' },
];

const statuses = [
  { value: 'all', label: '全部状态' },
  { value: 'open', label: '开放中' },
  { value: 'in_progress', label: '进行中' },
  { value: 'completed', label: '已完成' },
];

const availableSkills = [
  '文案写作',
  'UI设计',
  '前端开发',
  '后端开发',
  'Python',
  'JavaScript',
  '数据分析',
  '视频剪辑',
  '翻译',
  '营销推广',
];

export function TaskFilter({ filters, onFiltersChange }: TaskFilterProps) {
  const handleCategoryChange = (value: string) => {
    onFiltersChange({ ...filters, category: value });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({ ...filters, status: value });
  };

  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ ...filters, minPrice: Number(e.target.value) || 0 });
  };

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ ...filters, maxPrice: Number(e.target.value) || 0 });
  };

  const handleSkillToggle = (skill: string) => {
    const skills = filters.skills.includes(skill)
      ? filters.skills.filter(s => s !== skill)
      : [...filters.skills, skill];
    onFiltersChange({ ...filters, skills });
  };

  const clearFilters = () => {
    onFiltersChange({
      category: 'all',
      minPrice: 0,
      maxPrice: 0,
      status: 'all',
      skills: [],
    });
  };

  const hasActiveFilters = 
    filters.category !== 'all' ||
    filters.status !== 'all' ||
    filters.minPrice > 0 ||
    filters.maxPrice > 0 ||
    filters.skills.length > 0;

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5" />
            筛选器
          </CardTitle>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-primary hover:underline"
            >
              清除筛选
            </button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* 类别筛选 */}
        <div className="space-y-2">
          <Label>任务类别</Label>
          <Select value={filters.category} onValueChange={handleCategoryChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 价格区间 */}
        <div className="space-y-2">
          <Label>价格区间 (元)</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="最低"
              value={filters.minPrice || ''}
              onChange={handleMinPriceChange}
              className="w-full"
            />
            <span className="text-muted-foreground">-</span>
            <Input
              type="number"
              placeholder="最高"
              value={filters.maxPrice || ''}
              onChange={handleMaxPriceChange}
              className="w-full"
            />
          </div>
        </div>

        {/* 任务状态 */}
        <div className="space-y-2">
          <Label>任务状态</Label>
          <Select value={filters.status} onValueChange={handleStatusChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statuses.map(status => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 技能要求 */}
        <div className="space-y-2">
          <Label>技能要求</Label>
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
            {availableSkills.map(skill => (
              <Badge
                key={skill}
                variant={filters.skills.includes(skill) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => handleSkillToggle(skill)}
              >
                {skill}
              </Badge>
            ))}
          </div>
          {filters.skills.length > 0 && (
            <p className="text-xs text-muted-foreground">
              已选择 {filters.skills.length} 项技能
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
