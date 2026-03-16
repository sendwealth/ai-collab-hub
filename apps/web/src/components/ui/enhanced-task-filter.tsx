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
import { Button } from '@/components/ui/button';
import { SlidersHorizontal, X, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TaskFilters {
  category: string;
  minPrice: number;
  maxPrice: number;
  status: string;
  skills: string[];
}

interface EnhancedTaskFilterProps {
  filters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
  className?: string;
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

export function EnhancedTaskFilter({
  filters,
  onFiltersChange,
  className,
}: EnhancedTaskFilterProps) {
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
      ? filters.skills.filter((s) => s !== skill)
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

  const activeFilterCount = [
    filters.category !== 'all',
    filters.status !== 'all',
    filters.minPrice > 0 || filters.maxPrice > 0,
    filters.skills.length > 0,
  ].filter(Boolean).length;

  return (
    <Card className={cn('sticky top-4 shadow-sm', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5" />
            筛选器
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount}
              </Badge>
            )}
          </CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-sm text-primary hover:text-primary/80"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              重置
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 类别筛选 */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">任务类别</Label>
          <Select value={filters.category} onValueChange={handleCategoryChange}>
            <SelectTrigger className="hover:border-primary/50 transition-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem
                  key={cat.value}
                  value={cat.value}
                  className="cursor-pointer"
                >
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 价格区间 */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">价格区间 (元)</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="最低"
              value={filters.minPrice || ''}
              onChange={handleMinPriceChange}
              className="w-full hover:border-primary/50 transition-colors"
            />
            <span className="text-muted-foreground">-</span>
            <Input
              type="number"
              placeholder="最高"
              value={filters.maxPrice || ''}
              onChange={handleMaxPriceChange}
              className="w-full hover:border-primary/50 transition-colors"
            />
          </div>
        </div>

        {/* 任务状态 */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">任务状态</Label>
          <Select value={filters.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="hover:border-primary/50 transition-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((status) => (
                <SelectItem
                  key={status.value}
                  value={status.value}
                  className="cursor-pointer"
                >
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 技能要求 */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">技能要求</Label>
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
            {availableSkills.map((skill) => (
              <Badge
                key={skill}
                variant={filters.skills.includes(skill) ? 'default' : 'outline'}
                className={cn(
                  'cursor-pointer transition-all hover:scale-105',
                  filters.skills.includes(skill)
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'hover:border-primary hover:text-primary'
                )}
                onClick={() => handleSkillToggle(skill)}
              >
                {skill}
                {filters.skills.includes(skill) && (
                  <X className="h-3 w-3 ml-1" />
                )}
              </Badge>
            ))}
          </div>
          {filters.skills.length > 0 && (
            <p className="text-xs text-muted-foreground">
              已选择 {filters.skills.length} 项技能
            </p>
          )}
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-2">当前筛选:</p>
            <div className="flex flex-wrap gap-1">
              {filters.category !== 'all' && (
                <Badge variant="secondary" className="text-xs">
                  {categories.find((c) => c.value === filters.category)?.label}
                  <button
                    onClick={() => handleCategoryChange('all')}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.status !== 'all' && (
                <Badge variant="secondary" className="text-xs">
                  {statuses.find((s) => s.value === filters.status)?.label}
                  <button
                    onClick={() => handleStatusChange('all')}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {(filters.minPrice > 0 || filters.maxPrice > 0) && (
                <Badge variant="secondary" className="text-xs">
                  ¥{filters.minPrice || 0} - ¥{filters.maxPrice || '∞'}
                  <button
                    onClick={() =>
                      onFiltersChange({
                        ...filters,
                        minPrice: 0,
                        maxPrice: 0,
                      })
                    }
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.skills.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {filters.skills.length} 技能
                  <button
                    onClick={() =>
                      onFiltersChange({ ...filters, skills: [] })
                    }
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
