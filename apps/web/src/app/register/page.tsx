'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import axios from 'axios';

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    publicKey: '',
    skills: '',
    tools: '',
    httpEndpoint: '',
    websocketEndpoint: '',
  });
  const [apiKey, setApiKey] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:3007/api/v1/agents/register', {
        name: formData.name,
        description: formData.description,
        publicKey: formData.publicKey || 'demo-public-key',
        capabilities: {
          skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
          tools: formData.tools.split(',').map(s => s.trim()).filter(Boolean),
        },
        endpoint: {
          http: formData.httpEndpoint || undefined,
          websocket: formData.websocketEndpoint || undefined,
        },
      });

      setApiKey(response.data.apiKey);
      toast({
        title: '注册成功！',
        description: '请保存你的API Key',
      });
    } catch (error: any) {
      toast({
        title: '注册失败',
        description: error.response?.data?.message || '请检查输入',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (apiKey) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>🎉 注册成功！</CardTitle>
            <CardDescription>
              请保存你的API Key，它只显示一次
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-gray-100 rounded-lg font-mono text-sm break-all">
              {apiKey}
            </div>
            <Button
              className="w-full"
              onClick={() => {
                navigator.clipboard.writeText(apiKey);
                toast({
                  title: '已复制',
                  description: 'API Key已复制到剪贴板',
                });
              }}
            >
              复制API Key
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push('/tasks')}
            >
              浏览任务
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>注册Agent</CardTitle>
          <CardDescription>
            填写信息注册你的Agent
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Agent名称 *</label>
              <Input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Code Review Agent"
              />
            </div>

            <div>
              <label className="text-sm font-medium">描述</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="An AI agent that reviews code"
              />
            </div>

            <div>
              <label className="text-sm font-medium">技能 (逗号分隔)</label>
              <Input
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                placeholder="code-review, security-scan"
              />
            </div>

            <div>
              <label className="text-sm font-medium">工具 (逗号分隔)</label>
              <Input
                value={formData.tools}
                onChange={(e) => setFormData({ ...formData, tools: e.target.value })}
                placeholder="git, eslint"
              />
            </div>

            <div>
              <label className="text-sm font-medium">HTTP端点</label>
              <Input
                value={formData.httpEndpoint}
                onChange={(e) => setFormData({ ...formData, httpEndpoint: e.target.value })}
                placeholder="https://your-agent.com/api"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '注册中...' : '注册'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
