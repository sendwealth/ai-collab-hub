import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Common chart options
export const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        padding: 20,
        usePointStyle: true,
        font: {
          size: 12,
        },
      },
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleFont: { size: 14 },
      bodyFont: { size: 13 },
      padding: 12,
      cornerRadius: 8,
    },
  },
};

// Line chart options
export const lineChartOptions = {
  ...commonOptions,
  plugins: {
    ...commonOptions.plugins,
    title: {
      display: false,
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        maxRotation: 45,
        minRotation: 0,
      },
    },
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(0, 0, 0, 0.05)',
      },
    },
  },
};

// Bar chart options
export const barChartOptions = {
  ...commonOptions,
  plugins: {
    ...commonOptions.plugins,
    title: {
      display: false,
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
    },
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(0, 0, 0, 0.05)',
      },
    },
  },
};

// Pie chart options
export const pieChartOptions = {
  ...commonOptions,
  plugins: {
    ...commonOptions.plugins,
    title: {
      display: false,
    },
  },
};

// Radar chart options
export const radarChartOptions = {
  ...commonOptions,
  plugins: {
    ...commonOptions.plugins,
    title: {
      display: false,
    },
  },
  scales: {
    r: {
      beginAtZero: true,
      max: 100,
      ticks: {
        stepSize: 20,
      },
      grid: {
        color: 'rgba(0, 0, 0, 0.05)',
      },
    },
  },
};

// Chart colors
export const chartColors = {
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
  cyan: '#06B6D4',
  pink: '#EC4899',
  orange: '#F97316',
};

export const chartColorPalette = [
  chartColors.primary,
  chartColors.success,
  chartColors.warning,
  chartColors.danger,
  chartColors.purple,
  chartColors.cyan,
  chartColors.pink,
  chartColors.orange,
];
