'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Agent {
  id: string;
  name: string;
  trustScore?: number;
}

interface TransferDialogProps {
  open: boolean;
  onClose: () => void;
  onTransfer: (toAgentId: string, amount: number, description?: string) => Promise<void>;
  availableBalance: number;
}

export default function TransferDialog({ 
  open, 
  onClose, 
  onTransfer, 
  availableBalance 
}: TransferDialogProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (open) {
      fetchAgents();
    }
  }, [open]);

  const fetchAgents = async () => {
    try {
      const response = await fetch('http://localhost:3007/api/v1/agents');
      if (!response.ok) throw new Error('Failed to fetch agents');
      const data = await response.json();
      setAgents(data.agents || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  if (!open) return null;

  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedAgent) {
      setError('请选择收款方');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('请输入有效的转账金额');
      return;
    }

    if (numAmount < 1) {
      setError('最低转账金额为 ¥1');
      return;
    }

    if (numAmount > availableBalance) {
      setError(`可用余额不足，当前可用余额: ¥${availableBalance.toFixed(2)}`);
      return;
    }

    setLoading(true);
    try {
      await onTransfer(selectedAgent, numAmount, description);
      setAmount('');
      setDescription('');
      setSelectedAgent('');
      setSearchTerm('');
      onClose();
    } catch (err) {
      setError('转账失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAmount('');
    setDescription('');
    setSelectedAgent('');
    setSearchTerm('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold">转账</h2>
          <p className="text-gray-600 mt-1">将积分转账给其他 Agent</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Recipient Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              收款方
            </label>
            <Input
              type="text"
              placeholder="搜索 Agent..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={loading}
              className="mb-2"
            />
            <div className="border rounded-lg max-h-48 overflow-y-auto">
              {filteredAgents.length > 0 ? (
                filteredAgents.map((agent) => (
                  <div
                    key={agent.id}
                    onClick={() => {
                      setSelectedAgent(agent.id);
                      setSearchTerm(agent.name);
                    }}
                    className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedAgent === agent.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                  >
                    <div className="font-medium">{agent.name}</div>
                    {agent.trustScore !== undefined && (
                      <div className="text-sm text-gray-500">
                        信任度: {agent.trustScore}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-3 text-center text-gray-500">
                  {searchTerm ? '未找到匹配的 Agent' : '加载中...'}
                </div>
              )}
            </div>
          </div>

          {/* Amount Input */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                转账金额
              </label>
              <span className="text-sm text-gray-500">
                可用: ¥{availableBalance.toFixed(2)}
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">¥</span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="pl-8"
                disabled={loading}
                max={availableBalance}
              />
            </div>
          </div>

          {/* Description */}
          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              备注（可选）
            </label>
            <Input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="转账说明"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="bg-purple-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-purple-900 mb-2">转账说明</h3>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>• 最低转账金额: ¥1</li>
              <li>• 转账金额不能超过可用余额</li>
              <li>• 转账即时到账</li>
              <li>• 请确认收款方信息无误</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1"
            >
              取消
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? '处理中...' : '确认转账'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
