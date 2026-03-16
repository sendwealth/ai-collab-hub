'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface DepositInfo {
  balance: number;
  frozenAmount: number;
  availableBalance: number;
  currency: string;
  requirement: {
    level: string;
    minDeposit: number;
    currentDeposit: number;
    status: 'sufficient' | 'insufficient';
  };
}

interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'lock' | 'unlock';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  description?: string;
  createdAt: string;
  reference?: string;
}

export default function DepositPage() {
  const [deposit, setDeposit] = useState<DepositInfo | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchDepositInfo();
    fetchTransactions();
  }, []);

  const fetchDepositInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3007/api/v1/deposit/balance');
      if (!response.ok) {
        throw new Error('Failed to fetch deposit information');
      }
      const data = await response.json();
      // Map backend response to frontend interface
      setDeposit({
        balance: data.balance || 0,
        frozenAmount: data.frozenBalance || 0,
        availableBalance: data.availableBalance || 0,
        currency: 'CNY',
        requirement: {
          level: 'Bronze',
          minDeposit: 100,
          currentDeposit: data.balance || 0,
          status: (data.balance || 0) >= 100 ? 'sufficient' : 'insufficient',
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch deposit information');
      console.error('Error fetching deposit:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch('http://localhost:3007/api/v1/deposit/transactions');
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      const data = await response.json();
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch('http://localhost:3007/api/v1/deposit/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(depositAmount) }),
      });
      if (!response.ok) {
        throw new Error('Deposit failed');
      }
      await fetchDepositInfo();
      await fetchTransactions();
      setShowDepositDialog(false);
      setDepositAmount('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deposit failed');
      console.error('Error depositing:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (!deposit || parseFloat(withdrawAmount) > deposit.availableBalance) {
      alert('Insufficient available balance');
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch('http://localhost:3007/api/v1/deposit/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(withdrawAmount) }),
      });
      if (!response.ok) {
        throw new Error('Withdraw failed');
      }
      await fetchDepositInfo();
      await fetchTransactions();
      setShowWithdrawDialog(false);
      setWithdrawAmount('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Withdraw failed');
      console.error('Error withdrawing:', err);
    } finally {
      setProcessing(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return '↓';
      case 'withdraw':
        return '↑';
      case 'lock':
        return '🔒';
      case 'unlock':
        return '🔓';
      default:
        return '•';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'text-green-600 bg-green-50';
      case 'withdraw':
        return 'text-red-600 bg-red-50';
      case 'lock':
        return 'text-yellow-600 bg-yellow-50';
      case 'unlock':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">{error}</p>
            <Button onClick={() => setError(null)} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Deposit Management</h1>
          <p className="text-gray-600 mt-2">Manage your security deposit and transaction history</p>
        </div>

        {/* Deposit Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardDescription>Total Balance</CardDescription>
              <CardTitle className="text-3xl">
                ¥{deposit?.balance.toFixed(2) || '0.00'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">Total deposit amount</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Frozen Amount</CardDescription>
              <CardTitle className="text-3xl text-yellow-600">
                ¥{deposit?.frozenAmount.toFixed(2) || '0.00'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">Locked in active tasks</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Available Balance</CardDescription>
              <CardTitle className="text-3xl text-green-600">
                ¥{deposit?.availableBalance.toFixed(2) || '0.00'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">Available for withdrawal</p>
            </CardContent>
          </Card>
        </div>

        {/* Requirement Status */}
        {deposit?.requirement && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Certification Requirement</CardTitle>
              <CardDescription>Current deposit status for your certification level</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold">{deposit.requirement.level} Level</h3>
                    <Badge className={
                      deposit.requirement.status === 'sufficient'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }>
                      {deposit.requirement.status === 'sufficient' ? 'Sufficient' : 'Insufficient'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    Required: ¥{deposit.requirement.minDeposit} |
                    Current: ¥{deposit.requirement.currentDeposit}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 mb-1">Deposit Progress</p>
                  <p className="text-2xl font-bold">
                    {Math.min(100, Math.round((deposit.requirement.currentDeposit / deposit.requirement.minDeposit) * 100))}%
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      deposit.requirement.status === 'sufficient'
                        ? 'bg-green-600'
                        : 'bg-red-600'
                    }`}
                    style={{
                      width: `${Math.min(100, (deposit.requirement.currentDeposit / deposit.requirement.minDeposit) * 100)}%`
                    }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <Button onClick={() => setShowDepositDialog(true)} size="lg">
            Deposit Funds
          </Button>
          <Button
            onClick={() => setShowWithdrawDialog(true)}
            variant="outline"
            size="lg"
            disabled={!deposit || deposit.availableBalance <= 0}
          >
            Withdraw Funds
          </Button>
        </div>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>Your deposit transaction records</CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No transactions yet
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getTransactionColor(transaction.type)}`}>
                        <span className="text-lg">{getTransactionIcon(transaction.type)}</span>
                      </div>
                      <div>
                        <p className="font-medium capitalize">{transaction.type}</p>
                        <p className="text-sm text-gray-500">
                          {transaction.description || new Date(transaction.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-semibold ${
                        transaction.type === 'deposit' || transaction.type === 'unlock'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {transaction.type === 'deposit' || transaction.type === 'unlock' ? '+' : '-'}
                        ¥{transaction.amount.toFixed(2)}
                      </p>
                      <div className="flex items-center gap-2 justify-end">
                        <Badge className={getStatusColor(transaction.status)}>
                          {transaction.status}
                        </Badge>
                        {transaction.reference && (
                          <span className="text-xs text-gray-500">
                            {transaction.reference}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Deposit Requirements Info */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Deposit Requirements</CardTitle>
            <CardDescription>Understanding deposit requirements by certification level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">🥉</span>
                  <h3 className="font-semibold">Bronze Level</h3>
                </div>
                <p className="text-2xl font-bold mb-2">¥100</p>
                <p className="text-sm text-gray-600">
                  Minimum deposit to operate at Bronze certification level
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">🥈</span>
                  <h3 className="font-semibold">Silver Level</h3>
                </div>
                <p className="text-2xl font-bold mb-2">¥500</p>
                <p className="text-sm text-gray-600">
                  Minimum deposit to operate at Silver certification level
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">🥇</span>
                  <h3 className="font-semibold">Gold Level</h3>
                </div>
                <p className="text-2xl font-bold mb-2">¥1,000</p>
                <p className="text-sm text-gray-600">
                  Minimum deposit to operate at Gold certification level
                </p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold mb-2">Important Notes</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• Deposit is frozen when you accept tasks and released upon completion</li>
                <li>• Higher certification levels require higher deposits but offer better opportunities</li>
                <li>• Withdrawal requests are processed within 1-3 business days</li>
                <li>• Maintain sufficient deposit to remain certified at your current level</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Deposit Dialog */}
        {showDepositDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="max-w-md w-full mx-4">
              <CardHeader>
                <CardTitle>Deposit Funds</CardTitle>
                <CardDescription>Add funds to your deposit balance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Amount (¥)</label>
                    <input
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                      placeholder="Enter amount"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={handleDeposit}
                      disabled={processing || !depositAmount}
                      className="flex-1"
                    >
                      {processing ? 'Processing...' : 'Deposit'}
                    </Button>
                    <Button
                      onClick={() => {
                        setShowDepositDialog(false);
                        setDepositAmount('');
                      }}
                      variant="outline"
                      disabled={processing}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Withdraw Dialog */}
        {showWithdrawDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="max-w-md w-full mx-4">
              <CardHeader>
                <CardTitle>Withdraw Funds</CardTitle>
                <CardDescription>Withdraw available funds from your deposit</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Available Balance</p>
                    <p className="text-xl font-bold text-green-600">
                      ¥{deposit?.availableBalance.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Amount (¥)</label>
                    <input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                      placeholder="Enter amount"
                      min="0"
                      max={deposit?.availableBalance || 0}
                      step="0.01"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={handleWithdraw}
                      disabled={processing || !withdrawAmount}
                      className="flex-1"
                    >
                      {processing ? 'Processing...' : 'Withdraw'}
                    </Button>
                    <Button
                      onClick={() => {
                        setShowWithdrawDialog(false);
                        setWithdrawAmount('');
                      }}
                      variant="outline"
                      disabled={processing}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
