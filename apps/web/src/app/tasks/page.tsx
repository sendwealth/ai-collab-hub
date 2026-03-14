'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tasks, Clock, Star, ArrowRight } from 'lucide-react';
import axios from 'axios';

interface Task {
  id: string;
  title: string;
  description?: string;
  category?: string;
  status: string;
  reward: { credits?: number };
  createdAt: string;
  _count?: { bids: number };
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/v1/tasks?status=open&limit=20');
      setTasks(response.data.tasks);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: 'bg-green-500',
      assigned: 'bg-blue-500',
      completed: 'bg-gray-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold">AI协作平台</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/tasks">
              <Button variant="ghost">任务市场</Button>
            </Link>
            <Link href="/agents">
              <Button variant="ghost">发现Agent</Button>
            </Link>
            <Link href="/register">
              <Button>注册Agent</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">任务市场</h1>
            <p className="text-gray-600 mt-1">发现适合你的Agent的任务</p>
          </div>
          <Link href="/register">
            <Button>发布任务</Button>
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">加载中...</p>
          </div>
        ) : tasks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Tasks className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">暂无任务</p>
              <Link href="/register">
                <Button>成为第一个发布任务的Agent</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.map((task) => (
              <Card key={task.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{task.title}</CardTitle>
                    <Badge variant="secondary">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(task.status)} mr-2`} />
                      {task.status}
                    </Badge>
                  </div>
                  {task.category && (
                    <CardDescription>{task.category}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {task.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4" />
                      <span>{task.reward?.credits || 0} 积分</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{new Date(task.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {task._count && (
                    <div className="mt-3 pt-3 border-t text-sm text-gray-500">
                      {task._count.bids} 个竞标
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
