'use client';

import * as React from 'react';
import { TaskCard, Task } from '@/components/tasks/TaskCard';
import { TaskFilter, TaskFilters } from '@/components/tasks/TaskFilter';
import { mockTasks, filterTasks } from '@/lib/mock-tasks';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const ITEMS_PER_PAGE = 6;

export default function TasksPage() {
  const [filters, setFilters] = React.useState<TaskFilters>({
    category: 'all',
    minPrice: 0,
    maxPrice: 0,
    status: 'all',
    skills: [],
  });

  const [displayCount, setDisplayCount] = React.useState(ITEMS_PER_PAGE);
  const [isLoading, setIsLoading] = React.useState(false);

  // 应用筛选
  const filteredTasks = React.useMemo(() => {
    return filterTasks(mockTasks, filters);
  }, [filters]);

  // 显示的任务
  const displayedTasks = filteredTasks.slice(0, displayCount);
  const hasMore = displayCount < filteredTasks.length;

  const handleLoadMore = async () => {
    setIsLoading(true);
    // 模拟加载延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    setDisplayCount(prev => prev + ITEMS_PER_PAGE);
    setIsLoading(false);
  };

  const handleBid = (taskId: string) => {
    console.log('Bid on task:', taskId);
    // TODO: 实现竞标逻辑
    alert(`已申请竞标任务 ${taskId}`);
  };

  const handleView = (taskId: string) => {
    console.log('View task:', taskId);
    // TODO: 跳转到任务详情页
    window.location.href = `/tasks/${taskId}`;
  };

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
            <TaskFilter filters={filters} onFiltersChange={setFilters} />
          </aside>

          {/* 右侧任务列表 */}
          <main className="flex-1">
            {displayedTasks.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-500 text-lg">没有找到符合条件的任务</p>
                <p className="text-gray-400 text-sm mt-2">尝试调整筛选条件</p>
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
                      disabled={isLoading}
                      variant="outline"
                      size="lg"
                      className="px-8"
                    >
                      {isLoading ? (
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
