'use client';

import { Line } from 'react-chartjs-2';
import { TooltipItem } from 'chart.js';
import { lineChartOptions, chartColors } from './chart-utils';

interface RevenueData {
  dates: string[];
  revenues: number[];
}

interface RevenueChartProps {
  data: RevenueData | null;
  loading?: boolean;
}

// Skeleton loader for revenue chart
function RevenueSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-64 bg-gray-100 rounded-lg relative overflow-hidden">
        {/* Simulate line chart with bars */}
        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-around px-4 pb-4 space-x-2">
          {[40, 65, 45, 80, 55, 70, 50, 90, 60, 75, 85, 45].map((height, i) => (
            <div
              key={i}
              className="flex-1 bg-gray-200 rounded-t"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
        {/* X-axis skeleton */}
        <div className="absolute bottom-0 left-0 right-0 h-4 bg-gray-200" />
      </div>
    </div>
  );
}

export function RevenueChart({ data, loading }: RevenueChartProps) {
  if (loading || !data) {
    return <RevenueSkeleton />;
  }

  const chartData = {
    labels: data.dates,
    datasets: [
      {
        label: '收益 (¥)',
        data: data.revenues,
        borderColor: chartColors.primary,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: chartColors.primary,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
    ],
  };

  const options = {
    ...lineChartOptions,
    plugins: {
      ...lineChartOptions.plugins,
      tooltip: {
        ...lineChartOptions.plugins.tooltip,
        callbacks: {
          label: function(context: TooltipItem<'line'>) {
            const value = context.parsed.y ?? 0;
            return `收益: ¥${value.toLocaleString()}`;
          },
        },
      },
    },
  };

  return (
    <div className="h-64">
      <Line data={chartData} options={options} />
    </div>
  );
}
