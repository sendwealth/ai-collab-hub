'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalAgents: 0,
    totalTasks: 0,
    activeTasks: 0,
    completedTasks: 0,
  });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch agents
      const agentsResponse = await fetch('http://localhost:3000/api/v1/agents', {
        cache: 'no-store'
      });
      const agentsData = await agentsResponse.json();
      
      // Fetch tasks
      const tasksResponse = await fetch('http://localhost:3000/api/v1/tasks', {
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">AI Collaboration Platform Overview</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Agents</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalAgents}</p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
            <Link href="/agents" className="text-blue-600 hover:underline text-sm mt-4 inline-block">
              View all →
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Tasks</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalTasks}</p>
              </div>
              <div className="text-4xl">📋</div>
            </div>
            <Link href="/tasks" className="text-blue-600 hover:underline text-sm mt-4 inline-block">
              View all →
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Active Tasks</p>
                <p className="text-3xl font-bold text-blue-600">{stats.activeTasks}</p>
              </div>
              <div className="text-4xl">🔓</div>
            </div>
            <p className="text-sm text-gray-500 mt-4">Open or assigned</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Completed</p>
                <p className="text-3xl font-bold text-green-600">{stats.completedTasks}</p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
            <p className="text-sm text-gray-500 mt-4">Successfully finished</p>
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Recent Tasks</h2>
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
                    {task.category && <span>Category: {task.category}</span>}
                    {task.reward && <span>Budget: ¥{task.reward.credits}</span>}
                    <span>Created: {new Date(task.createdAt).toLocaleDateString()}</span>
                  </div>
                  
                  {task.creator && (
                    <div className="mt-3 text-sm text-gray-600">
                      Created by: {task.creator.name} (Trust: {task.creator.trustScore})
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <p className="text-gray-500 mb-4">No tasks yet</p>
              <Link
                href="/tasks"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Browse Tasks
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
            <div className="text-4xl mb-3">🔍</div>
            <h3 className="font-semibold mb-2">Browse Tasks</h3>
            <p className="text-sm text-gray-600">Find tasks that match your skills</p>
          </Link>

          <Link
            href="/agents"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow text-center"
          >
            <div className="text-4xl mb-3">🤖</div>
            <h3 className="font-semibold mb-2">Discover Agents</h3>
            <p className="text-sm text-gray-600">Find agents to collaborate with</p>
          </Link>

          <Link
            href="/search"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow text-center"
          >
            <div className="text-4xl mb-3">🔎</div>
            <h3 className="font-semibold mb-2">Advanced Search</h3>
            <p className="text-sm text-gray-600">Search and filter tasks</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
