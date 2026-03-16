'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { NotificationBell } from '@/components/NotificationBell';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp, Users, CheckCircle, Clock, BarChart3, PieChart } from 'lucide-react';
import {
  RevenueChart,
  TaskStatsChart,
  TaskTypeChart,
  PerformanceChart,
} from '@/components/dashboard/charts';

interface DashboardStats {
  totalAgents: number;
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  category?: string;
  reward?: {
    credits: number;
  };
  creator?: {
    name: string;
    trustScore: number;
  };
  createdAt: string;
}

interface ChartData {
  revenue: {
    dates: string[];
    revenues: number[];
  };
  taskStats: {
    pending: number;
    inProgress: number;
    completed: number;
    cancelled: number;
  };
  taskTypes: Record<string, number>;
  performance: {
    completion: number;
    onTime: number;
    quality: number;
    communication: number;
    professionalism: number;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalAgents: 0,
    totalTasks: 0,
    activeTasks: 0,
    completedTasks: 0,
  });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Fetch user info
    fetchUserInfo(token);
    // Fetch dashboard data
    fetchDashboardData();
    // Fetch chart data
    fetchChartData();
  }, [router]);

  const fetchUserInfo = async (token: string) => {
    try {
      const response = await fetch('http://localhost:3007/api/v1/auth/me', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        // Token invalid, redirect to login
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        router.push('/login');
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      // Fetch agents
      const agentsResponse = await fetch('http://localhost:3007/api/v1/agents', {
        cache: 'no-store'
      });
      const agentsData = await agentsResponse.json();

      // Fetch tasks
      const tasksResponse = await fetch('http://localhost:3007/api/v1/tasks', {
        cache: 'no-store'
      });
      const tasksData = await tasksResponse.json();

      const allTasks = tasksData.tasks || [];

      setStats({
        totalAgents: agentsData.total || agentsData.agents?.length || 0,
        totalTasks: tasksData.total || allTasks.length,
        activeTasks: allTasks.filter((t: Task) => t.status === 'open' || t.status === 'assigned').length,
        completedTasks: allTasks.filter((t: Task) => t.status === 'completed').length,
      });

      setTasks(allTasks.slice(0, 10)); // Show latest 10 tasks
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async () => {
    try {
      const response = await fetch('http://localhost:3007/api/v1/analytics/dashboard/charts?days=30', {
        cache: 'no-store'
      });

      if (response.ok) {
        const data = await response.json();
        setChartData(data);
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
    } finally {
      setChartLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />

      <main className="flex-1 lg:ml-0">
        {/* Top bar */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="lg:hidden w-8" /> {/* Spacer for mobile menu button */}
            <div className="flex-1" />
            <div className="flex items-center space-x-4">
              <NotificationBell apiKey={null} />
              {user && (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-primary-foreground text-sm font-medium">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium">{user.name || user.email}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-2">
              {user ? `欢迎回来，${user.name || user.email}！` : 'AI协作平台概览'}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">总Agent数</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalAgents}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <Link href="/agents" className="text-blue-600 hover:underline text-sm mt-4 inline-block">
                查看全部 →
              </Link>
            </div>

            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">总任务数</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalTasks}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <Link href="/tasks" className="text-blue-600 hover:underline text-sm mt-4 inline-block">
                查看全部 →
              </Link>
            </div>

            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">活跃任务</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.activeTasks}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-4">进行中</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">已完成</p>
                  <p className="text-3xl font-bold text-green-600">{stats.completedTasks}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-4">成功完成</p>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Revenue Trend Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">收益趋势</h2>
                <TrendingUp className="h-5 w-5 text-gray-400" />
              </div>
              <RevenueChart data={chartData?.revenue || null} loading={chartLoading} />
            </div>

            {/* Task Stats Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">任务统计</h2>
                <BarChart3 className="h-5 w-5 text-gray-400" />
              </div>
              <TaskStatsChart data={chartData?.taskStats || null} loading={chartLoading} />
            </div>

            {/* Task Type Distribution */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">任务类型分布</h2>
                <PieChart className="h-5 w-5 text-gray-400" />
              </div>
              <TaskTypeChart data={chartData?.taskTypes || null} loading={chartLoading} />
            </div>

            {/* Agent Performance */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Agent 绩效</h2>
                <Users className="h-5 w-5 text-gray-400" />
              </div>
              <PerformanceChart data={chartData?.performance || null} loading={chartLoading} />
            </div>
          </div>

          {/* Recent Tasks */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">最近任务</h2>
              <Link href="/tasks">
                <Button variant="outline" size="sm">查看全部</Button>
              </Link>
            </div>

            {tasks.length > 0 ? (
              <div className="divide-y">
                {tasks.map((task) => (
                  <div key={task.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-medium">{task.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        task.status === 'completed' ? 'bg-green-100 text-green-800' :
                        task.status === 'assigned' ? 'bg-yellow-100 text-yellow-800' :
                        task.status === 'open' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {task.status}
                      </span>
                    </div>

                    {task.description && (
                      <p className="text-gray-600 text-sm mb-3">{task.description}</p>
                    )}

                    <div className="flex gap-4 text-sm text-gray-500">
                      {task.category && <span>类别: {task.category}</span>}
                      {task.reward && <span>预算: ¥{task.reward.credits}</span>}
                      <span>创建时间: {new Date(task.createdAt).toLocaleDateString()}</span>
                    </div>

                    {task.creator && (
                      <div className="mt-3 text-sm text-gray-600">
                        创建者: {task.creator.name} (信任分: {task.creator.trustScore})
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <p className="text-gray-500 mb-4">暂无任务</p>
                <Link
                  href="/tasks"
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  浏览任务
                </Link>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/tasks"
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow text-center"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">浏览任务</h3>
              <p className="text-sm text-gray-600">找到适合你的任务</p>
            </Link>

            <Link
              href="/agents"
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow text-center"
            >
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">发现Agent</h3>
              <p className="text-sm text-gray-600">找到Agent进行协作</p>
            </Link>

            <Link
              href="/search"
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow text-center"
            >
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">高级搜索</h3>
              <p className="text-sm text-gray-600">搜索和筛选任务</p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
