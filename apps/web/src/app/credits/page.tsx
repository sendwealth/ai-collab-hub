'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import DepositDialog from './components/DepositDialog';
import WithdrawDialog from './components/WithdrawDialog';
import TransferDialog from './components/TransferDialog';
import TransactionList from './components/TransactionList';

interface Balance {
  balance: number;
  frozenAmount: number;
  availableBalance: number;
}

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

export default function CreditsPage() {
  const [balance, setBalance] = useState<Balance>({
    balance: 0,
    frozenAmount: 0,
    availableBalance: 0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);

  useEffect(() => {
    fetchBalance();
    fetchTransactions();
  }, []);

  const fetchBalance = async () => {
    try {
      const response = await fetch('http://localhost:3007/api/v1/credits/balance');
      if (!response.ok) throw new Error('Failed to fetch balance');
      const data = await response.json();
      setBalance(data);
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const fetchTransactions = async (page = 1, limit = 10) => {
    try {
      const response = await fetch(
        `http://localhost:3007/api/v1/credits/transactions?page=${page}&limit=${limit}`
      );
      if (!response.ok) throw new Error('Failed to fetch transactions');
      const data = await response.json();
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async (amount: number) => {
    try {
      const response = await fetch('http://localhost:3007/api/v1/credits/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      if (!response.ok) throw new Error('Deposit failed');
      await fetchBalance();
      await fetchTransactions();
      setShowDepositDialog(false);
    } catch (error) {
      console.error('Error depositing:', error);
      throw error;
    }
  };

  const handleWithdraw = async (amount: number) => {
    try {
      const response = await fetch('http://localhost:3007/api/v1/credits/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      if (!response.ok) throw new Error('Withdraw failed');
      await fetchBalance();
      await fetchTransactions();
      setShowWithdrawDialog(false);
    } catch (error) {
      console.error('Error withdrawing:', error);
      throw error;
    }
  };

  const handleTransfer = async (toAgentId: string, amount: number, description?: string) => {
    try {
      const response = await fetch('http://localhost:3007/api/v1/credits/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toAgentId, amount, description }),
      });
      if (!response.ok) throw new Error('Transfer failed');
      await fetchBalance();
      await fetchTransactions();
      setShowTransferDialog(false);
    } catch (error) {
      console.error('Error transferring:', error);
      throw error;
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
          <h1 className="text-3xl font-bold text-gray-900">积分管理</h1>
          <p className="text-gray-600 mt-2">管理您的积分余额和交易记录</p>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardDescription>总余额</CardDescription>
              <CardTitle className="text-3xl">¥{balance.balance.toFixed(2)}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">账户总积分</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>冻结金额</CardDescription>
              <CardTitle className="text-3xl text-yellow-600">¥{balance.frozenAmount.toFixed(2)}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">正在处理的交易</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>可用余额</CardDescription>
              <CardTitle className="text-3xl text-green-600">¥{balance.availableBalance.toFixed(2)}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">可用于交易</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <Button onClick={() => setShowDepositDialog(true)} size="lg">
            充值
          </Button>
          <Button onClick={() => setShowWithdrawDialog(true)} variant="outline" size="lg">
            提现
          </Button>
          <Button onClick={() => setShowTransferDialog(true)} variant="outline" size="lg">
            转账
          </Button>
        </div>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle>交易历史</CardTitle>
            <CardDescription>您的积分交易记录</CardDescription>
          </CardHeader>
          <CardContent>
            <TransactionList 
              transactions={transactions} 
              onRefresh={fetchTransactions}
            />
          </CardContent>
        </Card>

        {/* Dialogs */}
        <DepositDialog
          open={showDepositDialog}
          onClose={() => setShowDepositDialog(false)}
          onDeposit={handleDeposit}
        />
        
        <WithdrawDialog
          open={showWithdrawDialog}
          onClose={() => setShowWithdrawDialog(false)}
          onWithdraw={handleWithdraw}
          availableBalance={balance.availableBalance}
        />
        
        <TransferDialog
          open={showTransferDialog}
          onClose={() => setShowTransferDialog(false)}
          onTransfer={handleTransfer}
          availableBalance={balance.availableBalance}
        />
      </div>
    </div>
  );
}
