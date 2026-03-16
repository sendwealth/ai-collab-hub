'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar, User, DollarSign, Tag, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  category?: string;
  type?: string;
  budget?: number;
  deadline?: string;
  requirements?: string;
  creator?: {
    id: string;
    name: string;
    trustScore: number;
  };
  assignee?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [bidding, setBidding] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchTask();
    }
  }, [params.id]);

  const fetchTask = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/v1/tasks/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setTask(data.task || data);
      } else {
        console.error('Task not found');
        router.push('/tasks');
      }
    } catch (error) {
      console.error('Error fetching task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBid = async () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    if (!token) {
      router.push('/login');
      return;
    }

    setBidding(true);
    try {
      // TODO: Implement bid API
      alert('竞标功能即将上线！');
    } catch (error) {
      console.error('Error bidding:', error);
    } finally {
      setBidding(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'assigned':
        return 'bg-yellow-100 text-yellow-800';
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      open: '开放中',
      assigned: '已分配',
      completed: '已完成',
      cancelled: '已取消',
      reviewing: '审核中',
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">任务不存在</h2>
          <Link href="/tasks">
            <Button>返回任务列表</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container max-w-4xl mx-auto px-4">
        {/* Back button */}
        <Link 
          href="/tasks" 
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回任务列表
        </Link>

        {/* Main content */}
        <div className="space-y-6">
          {/* Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge className={getStatusColor(task.status)}>
                      {getStatusText(task.status)}
                    </Badge>
                    {task.category && (
                      <Badge variant="outline">{task.category}</Badge>
                    )}
                    {task.type && (
                      <Badge variant="outline">{task.type}</Badge>
                    )}
                  </div>
                  <CardTitle className="text-2xl">{task.title}</CardTitle>
                </div>
                {task.status === 'open' && (
                  <Button onClick={handleBid} disabled={bidding}>
                    {bidding ? '竞标中...' : '立即竞标'}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">
                {task.description || '暂无详细描述'}
              </p>
            </CardContent>
          </Card>

          {/* Task Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">任务信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {task.budget !== undefined && (
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">预算</p>
                      <p className="font-semibold">¥{task.budget}</p>
                    </div>
                  </div>
                )}

                {task.deadline && (
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">截止日期</p>
                      <p className="font-semibold">
                        {new Date(task.deadline).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center">
                  <Tag className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">任务ID</p>
                    <p className="font-mono text-sm">{task.id}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">参与者</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {task.creator && (
                  <div className="flex items-center">
                    <User className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">创建者</p>
                      <p className="font-semibold">{task.creator.name}</p>
                      {task.creator.trustScore !== undefined && (
                        <p className="text-xs text-gray-500">
                          信任分: {task.creator.trustScore}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {task.assignee && (
                  <div className="flex items-center">
                    <User className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">执行者</p>
                      <p className="font-semibold">{task.assignee.name}</p>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <p className="text-xs text-gray-500">
                    创建时间: {new Date(task.createdAt).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    更新时间: {new Date(task.updatedAt).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Requirements */}
          {task.requirements && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">任务要求</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg">
                  {task.requirements}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          {task.status === 'open' && (
            <Card>
              <CardContent className="py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">对这个任务感兴趣？</h3>
                    <p className="text-sm text-gray-500">立即竞标，开始工作</p>
                  </div>
                  <Button onClick={handleBid} disabled={bidding} size="lg">
                    {bidding ? '竞标中...' : '立即竞标'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
