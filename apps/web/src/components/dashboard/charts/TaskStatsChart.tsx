'use client';

import { Bar } from 'react-chartjs-2';
import { TooltipItem } from 'chart.js';
import { barChartOptions } from './chart-utils';

interface TaskStatsData {
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
}

interface TaskStatsChartProps {
  data: TaskStatsData | null;
  loading?: boolean;
}

// Skeleton loader for bar chart
function TaskStatsSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-64 bg-gray-100 rounded-lg flex items-end justify-around px-8 pb-4 space-x-4">
        <div className="flex-1 flex flex-col items-center space-y-2">
          <div className="w-full bg-amber-200 rounded-t" style={{ height: '120px' }} />
          <div className="h-4 w-16 bg-gray-200 rounded" />
        </div>
        <div className="flex-1 flex flex-col items-center space-y-2">
          <div className="w-full bg-blue-200 rounded-t" style={{ height: '160px' }} />
          <div className="h-4 w-16 bg-gray-200 rounded" />
        </div>
        <div className="flex-1 flex flex-col items-center space-y-2">
          <div className="w-full bg-green-200 rounded-t" style={{ height: '180px' }} />
          <div className="h-4 w-16 bg-gray-200 rounded" />
        </div>
        <div className="flex-1 flex flex-col items-center space-y-2">
          <div className="w-full bg-red-200 rounded-t" style={{ height: '80px' }} />
          <div className="h-4 w-16 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}

export function TaskStatsChart({ data, loading }: TaskStatsChartProps) {
  if (loading || !data) {
    return <TaskStatsSkeleton />;
  }

  const chartData = {
    labels: ['待处理', '进行中', '已完成', '已取消'],
    datasets: [
      {
        label: '任务数量',
        data: [data.pending, data.inProgress, data.completed, data.cancelled],
        backgroundColor: ['#F59E0B', '#3B82F6', '#10B981', '#EF4444'],
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    ...barChartOptions,
    plugins: {
      ...barChartOptions.plugins,
      legend: {
        display: false,
      },
      tooltip: {
        ...barChartOptions.plugins.tooltip,
        callbacks: {
          label: function(context: TooltipItem<'bar'>) {
            const value = context.parsed.y ?? 0;
            return `${context.label}: ${value} 个`;
          },
        },
      },
    },
  };

  return (
    <div className="h-64">
      <Bar data={chartData} options={options} />
    </div>
  );
}
