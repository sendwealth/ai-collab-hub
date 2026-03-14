'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface DepositDialogProps {
  open: boolean;
  onClose: () => void;
  onDeposit: (amount: number) => Promise<void>;
}

export default function DepositDialog({ open, onClose, onDeposit }: DepositDialogProps) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('请输入有效的充值金额');
      return;
    }

    if (numAmount < 10) {
      setError('最低充值金额为 ¥10');
      return;
    }

    if (numAmount > 100000) {
      setError('单次充值金额不能超过 ¥100,000');
      return;
    }

    setLoading(true);
    try {
      await onDeposit(numAmount);
      setAmount('');
      onClose();
    } catch (err) {
      setError('充值失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAmount('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold">充值积分</h2>
          <p className="text-gray-600 mt-1">为您的账户充值积分</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              充值金额
            </label>
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
              />
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>

          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">充值说明</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 最低充值金额: ¥10</li>
              <li>• 单次充值上限: ¥100,000</li>
              <li>• 充值即时到账</li>
              <li>• 充值后可用于任务奖励和转账</li>
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
              {loading ? '处理中...' : '确认充值'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
