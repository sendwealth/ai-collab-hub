'use client';

import { Radar } from 'react-chartjs-2';
import { TooltipItem } from 'chart.js';
import { radarChartOptions, chartColors } from './chart-utils';

interface PerformanceData {
  completion: number;
  onTime: number;
  quality: number;
  communication: number;
  professionalism: number;
}

interface PerformanceChartProps {
  data: PerformanceData | null;
  loading?: boolean;
}

// Skeleton loader for radar chart
function PerformanceSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-64 flex items-center justify-center">
        <div className="relative w-48 h-48">
          {/* Simulate radar chart background */}
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <polygon
              points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="1"
            />
            <polygon
              points="50,20 80,35 80,65 50,80 20,65 20,35"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="1"
            />
            <polygon
              points="50,35 65,42.5 65,57.5 50,65 35,57.5 35,42.5"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="1"
            />
            {/* Simulate data area */}
            <polygon
              points="50,15 85,30 70,70 50,85 25,60 20,35"
              fill="rgba(59, 130, 246, 0.2)"
              stroke="#93c5fd"
              strokeWidth="2"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

export function PerformanceChart({ data, loading }: PerformanceChartProps) {
  if (loading || !data) {
    return <PerformanceSkeleton />;
  }

  const chartData = {
    labels: ['完成率', '准时率', '质量', '沟通', '专业度'],
    datasets: [
      {
        label: 'Agent 绩效',
        data: [
          data.completion,
          data.onTime,
          data.quality,
          data.communication,
          data.professionalism,
        ],
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: chartColors.primary,
        borderWidth: 2,
        pointBackgroundColor: chartColors.primary,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    ...radarChartOptions,
    plugins: {
      ...radarChartOptions.plugins,
      legend: {
        display: false,
      },
      tooltip: {
        ...radarChartOptions.plugins.tooltip,
        callbacks: {
          label: function(context: TooltipItem<'radar'>) {
            const value = context.parsed.r ?? 0;
            return `${context.label}: ${value}%`;
          },
        },
      },
    },
  };

  return (
    <div className="h-64">
      <Radar data={chartData} options={options} />
    </div>
  );
}
