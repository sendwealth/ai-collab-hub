'use client';

import * as React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, DollarSign, Clock } from 'lucide-react';

export interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: {
    min: number;
    max: number;
  };
  deadline: string;
  skills: string[];
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  creator?: {
    name: string;
    trustScore: number;
  };
}

interface TaskCardProps {
  task: Task;
  onBid?: (taskId: string) => void;
  onView?: (taskId: string) => void;
}

const statusColors = {
  open: 'bg-green-100 text-green-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusLabels = {
  open: '开放中',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消',
};

export function TaskCard({ task, onBid, onView }: TaskCardProps) {
  const daysLeft = Math.ceil(
    (new Date(task.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg line-clamp-2">{task.title}</CardTitle>
          <Badge className={statusColors[task.status]}>
            {statusLabels[task.status]}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {task.description}
        </p>
        
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-green-600">
            <DollarSign className="h-4 w-4" />
            <span className="font-medium">¥{task.budget.min}-{task.budget.max}</span>
          </div>
          
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{daysLeft > 0 ? `${daysLeft}天` : '已过期'}</span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {task.skills.map((skill, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {skill}
            </Badge>
          ))}
        </div>
        
        {task.creator && (
          <div className="text-xs text-muted-foreground">
            发布者: {task.creator.name} (信任分: {task.creator.trustScore})
          </div>
        )}
      </CardContent>
      
      <CardFooter className="gap-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onView?.(task.id)}
          className="flex-1"
        >
          查看详情
        </Button>
        {task.status === 'open' && (
          <Button 
            size="sm"
            onClick={() => onBid?.(task.id)}
            className="flex-1"
          >
            立即竞标
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
