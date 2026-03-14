'use client';

import { useState } from 'react';

interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'transfer_in' | 'transfer_out';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  description?: string;
  fromAgent?: {
    id: string;
    name: string;
  };
  toAgent?: {
    id: string;
    name: string;
  };
  createdAt: string;
}

interface TransactionListProps {
  transactions: Transaction[];
  onRefresh: (page?: number, limit?: number) => void;
}

export default function TransactionList({ transactions, onRefresh }: TransactionListProps) {
  const [filter, setFilter] = useState<string>('all');

  const filteredTransactions = transactions.filter(t => {
    if (filter === 'all') return true;
    return t.type === filter;
  });

  const getTypeLabel = (type: string) => {
    const labels = {
      deposit: '充值',
      withdraw: '提现',
      transfer_in: '转入',
      transfer_out: '转出',
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      deposit: 'text-green-600',
      withdraw: 'text-blue-600',
      transfer_in: 'text-purple-600',
      transfer_out: 'text-orange-600',
    };
    return colors[type as keyof typeof colors] || 'text-gray-600';
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    };
    const labels = {
      pending: '处理中',
      completed: '已完成',
      failed: '失败',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  const formatAmount = (type: string, amount: number) => {
    const prefix = type === 'deposit' || type === 'transfer_in' ? '+' : '-';
    const color = type === 'deposit' || type === 'transfer_in' ? 'text-green-600' : 'text-red-600';
    return (
      <span className={`text-lg font-semibold ${color}`}>
        {prefix}¥{amount.toFixed(2)}
      </span>
    );
  };

  return (
    <div>
      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        {['all', 'deposit', 'withdraw', 'transfer_in', 'transfer_out'].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              filter === type
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {type === 'all' ? '全部' : getTypeLabel(type)}
          </button>
        ))}
      </div>

      {/* Transaction List */}
      {filteredTransactions.length > 0 ? (
        <div className="space-y-3">
          {filteredTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-medium ${getTypeColor(transaction.type)}`}>
                      {getTypeLabel(transaction.type)}
                    </span>
                    {getStatusBadge(transaction.status)}
                  </div>
                  
                  {/* Agent Info */}
                  {transaction.fromAgent && (
                    <div className="text-sm text-gray-600">
                      来自: {transaction.fromAgent.name}
                    </div>
                  )}
                  {transaction.toAgent && (
                    <div className="text-sm text-gray-600">
                      转至: {transaction.toAgent.name}
                    </div>
                  )}
                  
                  {/* Description */}
                  {transaction.description && (
                    <div className="text-sm text-gray-500 mt-1">
                      {transaction.description}
                    </div>
                  )}
                  
                  {/* Date */}
                  <div className="text-xs text-gray-400 mt-2">
                    {new Date(transaction.createdAt).toLocaleString('zh-CN')}
                  </div>
                </div>
                
                {/* Amount */}
                <div className="text-right">
                  {formatAmount(transaction.type, transaction.amount)}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 text-5xl mb-4">📝</div>
          <p className="text-gray-500 mb-2">暂无交易记录</p>
          <p className="text-sm text-gray-400">
            {filter === 'all' ? '您还没有任何交易' : `没有${getTypeLabel(filter)}记录`}
          </p>
        </div>
      )}

      {/* Summary Stats */}
      {filteredTransactions.length > 0 && (
        <div className="mt-6 pt-6 border-t">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {filteredTransactions
                  .filter(t => t.type === 'deposit' || t.type === 'transfer_in')
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toFixed(2)}
              </div>
              <div className="text-sm text-gray-500">总收入</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {filteredTransactions
                  .filter(t => t.type === 'withdraw' || t.type === 'transfer_out')
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toFixed(2)}
              </div>
              <div className="text-sm text-gray-500">总支出</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {filteredTransactions.length}
              </div>
              <div className="text-sm text-gray-500">交易笔数</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
