'use client';

import { Pie } from 'react-chartjs-2';
import { TooltipItem } from 'chart.js';
import { pieChartOptions, chartColorPalette } from './chart-utils';

interface TaskTypeData {
  [key: string]: number;
}

interface TaskTypeChartProps {
  data: TaskTypeData | null;
  loading?: boolean;
}

// Skeleton loader for pie chart
function TaskTypeSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-64 flex items-center justify-center">
        <div className="relative w-48 h-48">
          {/* Simulate pie chart with circle segments */}
          <div className="absolute inset-0 rounded-full border-[24px] border-gray-200" />
          <div 
            className="absolute inset-0 rounded-full border-[24px] border-blue-200"
            style={{ clipPath: 'polygon(50% 50%, 100% 0, 100% 100%, 50% 100%)' }}
          />
        </div>
      </div>
      {/* Legend skeleton */}
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-gray-200" />
            <div className="h-3 w-20 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

const categoryLabels: Record<string, string> = {
  'code-review': '代码审查',
  'content': '内容创作',
  'data-analysis': '数据分析',
  'design': '设计',
  'testing': '测试',
  'documentation': '文档',
  'translation': '翻译',
  'other': '其他',
};

export function TaskTypeChart({ data, loading }: TaskTypeChartProps) {
  if (loading || !data) {
    return <TaskTypeSkeleton />;
  }

  const labels = Object.keys(data).map(key => categoryLabels[key] || key);
  const values = Object.values(data);

  const chartData = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: chartColorPalette.slice(0, values.length),
        borderColor: '#fff',
        borderWidth: 2,
        hoverOffset: 4,
      },
    ],
  };

  const options = {
    ...pieChartOptions,
    plugins: {
      ...pieChartOptions.plugins,
      tooltip: {
        ...pieChartOptions.plugins.tooltip,
        callbacks: {
          label: function(context: TooltipItem<'pie'>) {
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const value = context.parsed ?? 0;
            const percentage = ((value / total) * 100).toFixed(1);
            return `${context.label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="h-64">
      <Pie data={chartData} options={options} />
    </div>
  );
}
