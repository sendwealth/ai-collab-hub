'use client';

import * as React from 'react';
import { TaskCard, Task } from '@/components/tasks/TaskCard';
import { TaskFilter, TaskFilters } from '@/components/tasks/TaskFilter';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const ITEMS_PER_PAGE = 6;

export default function TasksPage() {
  const { toast } = useToast();
  const [filters, setFilters] = React.useState<TaskFilters>({
    category: 'all',
    minPrice: 0,
    maxPrice: 0,
    status: 'all',
    skills: [],
  });

  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [displayCount, setDisplayCount] = React.useState(ITEMS_PER_PAGE);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);

  // Fetch tasks from API
  const fetchTasks = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3007/api/v1/tasks');
      const data = await response.json();
      
      // Transform API data to match Task interface
      const formattedTasks: Task[] = (data.tasks || []).map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description || '',
        category: task.category || 'general',
        status: task.status,
        reward: task.budget ? { credits: task.budget } : undefined,
        skills: [], // TODO: Get from task.skills
        creator: task.creator ? {
          id: task.creator.id,
          name: task.creator.name || 'Unknown',
          trustScore: task.creator.trustScore || 0,
        } : undefined,
        createdAt: task.createdAt,
        deadline: task.deadline,
      }));

      setTasks(formattedTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: '加载失败',
        description: '无法加载任务列表，请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Apply filters
  const filteredTasks = React.useMemo(() => {
    return tasks.filter(task => {
      // Filter by category
      if (filters.category !== 'all' && task.category !== filters.category) {
        return false;
      }

      // Filter by status
      if (filters.status !== 'all' && task.status !== filters.status) {
        return false;
      }

      // Filter by price range
      if (filters.minPrice > 0 || filters.maxPrice > 0) {
        const price = task.budget?.max || 0;
        if (filters.minPrice > 0 && price < filters.minPrice) {
          return false;
        }
        if (filters.maxPrice > 0 && price > filters.maxPrice) {
          return false;
        }
      }

      // Filter by skills
      if (filters.skills.length > 0) {
        const taskSkills = task.skills || [];
        if (!filters.skills.some(skill => taskSkills.includes(skill))) {
          return false;
        }
      }

      return true;
    });
  }, [tasks, filters]);

  // Displayed tasks
  const displayedTasks = filteredTasks.slice(0, displayCount);
  const hasMore = displayCount < filteredTasks.length;

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    // Simulate loading delay
    await new Promise(resolve => setTimeout(resolve, 300));
    setDisplayCount(prev => prev + ITEMS_PER_PAGE);
    setIsLoadingMore(false);
  };

  const handleBid = async (taskId: string) => {
    // Check if user is logged in
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    if (!token) {
      toast({
        title: '请先登录',
        description: '您需要登录后才能竞标任务',
        variant: 'destructive',
      });
      return;
    }

    // TODO: Implement bid logic with API
    toast({
      title: '功能开发中',
      description: '竞标功能即将上线',
    });
  };

  const handleView = (taskId: string) => {
    window.location.href = `/tasks/${taskId}`;
  };

  const handleClearFilters = () => {
    setFilters({
      category: 'all',
      minPrice: 0,
      maxPrice: 0,
      status: 'all',
      skills: [],
    });
    setDisplayCount(ITEMS_PER_PAGE);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">任务市场</h1>
          <p className="mt-2 text-gray-600">
            共找到 <span className="font-semibold text-primary">{filteredTasks.length}</span> 个任务
          </p>
        </div>

        {/* 主内容区 */}
        <div className="flex gap-8">
          {/* 左侧筛选器 */}
          <aside className="w-64 flex-shrink-0">
            <div className="sticky top-24">
              <TaskFilter 
                filters={filters} 
                onFiltersChange={(newFilters) => {
                  setFilters(newFilters);
                  setDisplayCount(ITEMS_PER_PAGE);
                }} 
              />
              {JSON.stringify(filters) !== JSON.stringify({
                category: 'all',
                minPrice: 0,
                maxPrice: 0,
                status: 'all',
                skills: [],
              }) && (
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={handleClearFilters}
                >
                  清除筛选
                </Button>
              )}
            </div>
          </aside>

          {/* 右侧任务列表 */}
          <main className="flex-1">
            {displayedTasks.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-500 text-lg">没有找到符合条件的任务</p>
                <p className="text-gray-400 text-sm mt-2">尝试调整筛选条件</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={handleClearFilters}
                >
                  清除所有筛选
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayedTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onBid={handleBid}
                      onView={handleView}
                    />
                  ))}
                </div>

                {/* 加载更多按钮 */}
                {hasMore && (
                  <div className="mt-8 text-center">
                    <Button
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      variant="outline"
                      size="lg"
                      className="px-8"
                    >
                      {isLoadingMore ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          加载中...
                        </>
                      ) : (
                        `加载更多 (${filteredTasks.length - displayCount} 个剩余)`
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
