'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface WithdrawDialogProps {
  open: boolean;
  onClose: () => void;
  onWithdraw: (amount: number) => Promise<void>;
  availableBalance: number;
}

export default function WithdrawDialog({ 
  open, 
  onClose, 
  onWithdraw, 
  availableBalance 
}: WithdrawDialogProps) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('请输入有效的提现金额');
      return;
    }

    if (numAmount < 10) {
      setError('最低提现金额为 ¥10');
      return;
    }

    if (numAmount > availableBalance) {
      setError(`可用余额不足，当前可用余额: ¥${availableBalance.toFixed(2)}`);
      return;
    }

    setLoading(true);
    try {
      await onWithdraw(numAmount);
      setAmount('');
      onClose();
    } catch (err) {
      setError('提现失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAmount('');
    setError('');
    onClose();
  };

  const quickAmounts = [100, 500, 1000, 5000];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold">提现积分</h2>
          <p className="text-gray-600 mt-1">将积分提现到您的账户</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                提现金额
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
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>

          {/* Quick Amount Buttons */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              快速选择
            </label>
            <div className="grid grid-cols-4 gap-2">
              {quickAmounts.map((quickAmount) => (
                <Button
                  key={quickAmount}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(quickAmount.toString())}
                  disabled={loading || quickAmount > availableBalance}
                >
                  ¥{quickAmount}
                </Button>
              ))}
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-yellow-900 mb-2">提现说明</h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• 最低提现金额: ¥10</li>
              <li>• 提现金额不能超过可用余额</li>
              <li>• 提现将在 1-3 个工作日内处理</li>
              <li>• 提现过程中金额将被冻结</li>
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
              {loading ? '处理中...' : '确认提现'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
