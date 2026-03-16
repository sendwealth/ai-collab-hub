import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class DepositService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get deposit balance for an agent
   */
  async getBalance(agentId: string) {
    let deposit = await this.prisma.agentDeposit.findUnique({
      where: { agentId },
    });

    if (!deposit) {
      deposit = await this.prisma.agentDeposit.create({
        data: {
          agentId,
          balance: 0,
          frozenBalance: 0,
        },
      });
    }

    return {
      agentId: deposit.agentId,
      balance: deposit.balance,
      frozenBalance: deposit.frozenBalance,
      availableBalance: deposit.balance - deposit.frozenBalance,
      totalDeposited: deposit.totalDeposited,
      totalDeducted: deposit.totalDeducted,
      totalRefunded: deposit.totalRefunded,
    };
  }

  /**
   * Deposit funds (充值)
   */
  async deposit(agentId: string, amount: number, description?: string) {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    return this.prisma.$transaction(async (tx) => {
      let deposit = await tx.agentDeposit.findUnique({
        where: { agentId },
      });

      if (!deposit) {
        deposit = await tx.agentDeposit.create({
          data: {
            agentId,
            balance: amount,
            totalDeposited: amount,
          },
        });
      } else {
        deposit = await tx.agentDeposit.update({
          where: { agentId },
          data: {
            balance: deposit.balance + amount,
            totalDeposited: deposit.totalDeposited + amount,
          },
        });
      }

      const transaction = await tx.agentDepositTransaction.create({
        data: {
          depositId: deposit.id,
          agentId,
          type: 'deposit',
          amount,
          balance: deposit.balance,
          reason: description || 'Deposit',
        },
      });

      return {
        transactionId: transaction.id,
        amount,
        newBalance: deposit.balance,
        createdAt: transaction.createdAt,
      };
    });
  }

  /**
   * Withdraw funds (提现)
   */
  async withdraw(agentId: string, amount: number, description?: string) {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    return this.prisma.$transaction(async (tx) => {
      const deposit = await tx.agentDeposit.findUnique({
        where: { agentId },
      });

      if (!deposit) {
        throw new NotFoundException('Deposit account not found');
      }

      const availableBalance = deposit.balance - deposit.frozenBalance;
      if (availableBalance < amount) {
        throw new BadRequestException(
          `Insufficient available balance. Available: ${availableBalance}, Required: ${amount}`,
        );
      }

      const newBalance = deposit.balance - amount;

      await tx.agentDeposit.update({
        where: { agentId },
        data: {
          balance: newBalance,
        },
      });

      const transaction = await tx.agentDepositTransaction.create({
        data: {
          depositId: deposit.id,
          agentId,
          type: 'withdraw',
          amount: -amount,
          balance: newBalance,
          reason: description || 'Withdrawal',
        },
      });

      return {
        transactionId: transaction.id,
        amount,
        newBalance,
        createdAt: transaction.createdAt,
      };
    });
  }

  /**
   * Deduct funds (扣除)
   * @param reason - 'quality' | 'timeout' | 'other'
   * @param percentage - Deduction percentage (10-50)
   */
  async deduct(
    agentId: string,
    amount: number,
    reason: 'quality' | 'timeout' | 'other',
    taskId?: string,
    metadata?: Record<string, any>,
  ) {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    return this.prisma.$transaction(async (tx) => {
      const deposit = await tx.agentDeposit.findUnique({
        where: { agentId },
      });

      if (!deposit) {
        throw new NotFoundException('Deposit account not found');
      }

      const availableBalance = deposit.balance - deposit.frozenBalance;
      if (availableBalance < amount) {
        throw new BadRequestException(
          `Insufficient balance. Available: ${availableBalance}, Required: ${amount}`,
        );
      }

      const newBalance = deposit.balance - amount;

      await tx.agentDeposit.update({
        where: { agentId },
        data: {
          balance: newBalance,
          totalDeducted: deposit.totalDeducted + amount,
        },
      });

      const transaction = await tx.agentDepositTransaction.create({
        data: {
          depositId: deposit.id,
          agentId,
          type: 'deduct',
          amount: -amount,
          balance: newBalance,
          reason,
          taskId,
          metadata: metadata ? JSON.stringify(metadata) : null,
        },
      });

      return {
        transactionId: transaction.id,
        amount,
        newBalance,
        reason,
        taskId,
        createdAt: transaction.createdAt,
      };
    });
  }

  /**
   * Refund funds (退还)
   */
  async refund(agentId: string, amount: number, reason: string, taskId?: string) {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    return this.prisma.$transaction(async (tx) => {
      const deposit = await tx.agentDeposit.findUnique({
        where: { agentId },
      });

      if (!deposit) {
        throw new NotFoundException('Deposit account not found');
      }

      const newBalance = deposit.balance + amount;

      await tx.agentDeposit.update({
        where: { agentId },
        data: {
          balance: newBalance,
          totalRefunded: deposit.totalRefunded + amount,
        },
      });

      const transaction = await tx.agentDepositTransaction.create({
        data: {
          depositId: deposit.id,
          agentId,
          type: 'refund',
          amount,
          balance: newBalance,
          reason,
          taskId,
        },
      });

      return {
        transactionId: transaction.id,
        amount,
        newBalance,
        reason,
        taskId,
        createdAt: transaction.createdAt,
      };
    });
  }

  /**
   * Calculate deduction amount based on quality score
   * @param qualityScore - Quality score (0-100)
   * @param taskBudget - Task budget amount
   */
  calculateQualityDeduction(qualityScore: number, taskBudget: number): number {
    if (qualityScore >= 90) return 0; // No deduction for excellent work
    if (qualityScore >= 80) return taskBudget * 0.10; // 10% deduction
    if (qualityScore >= 60) return taskBudget * 0.25; // 25% deduction
    if (qualityScore >= 40) return taskBudget * 0.40; // 40% deduction
    return taskBudget * 0.50; // 50% deduction for poor work
  }

  /**
   * Calculate timeout deduction
   * @param daysLate - Number of days late
   * @param taskBudget - Task budget amount
   */
  calculateTimeoutDeduction(daysLate: number, taskBudget: number): number {
    if (daysLate <= 0) return 0;
    if (daysLate === 1) return taskBudget * 0.05; // 5% for 1 day
    if (daysLate <= 3) return taskBudget * 0.10; // 10% for 2-3 days
    if (daysLate <= 7) return taskBudget * 0.15; // 15% for 4-7 days
    return taskBudget * 0.20; // 20% for 8+ days
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(
    agentId: string,
    query: {
      type?: string;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const { type, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = { agentId };
    if (type) {
      where.type = type;
    }

    const [transactions, total] = await Promise.all([
      this.prisma.agentDepositTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.agentDepositTransaction.count({ where }),
    ]);

    return {
      transactions: transactions.map(t => ({
        transactionId: t.id,
        type: t.type,
        amount: t.amount,
        balance: t.balance,
        reason: t.reason,
        taskId: t.taskId,
        metadata: t.metadata ? JSON.parse(t.metadata) : null,
        createdAt: t.createdAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Freeze deposit amount (for task guarantees)
   */
  async freeze(agentId: string, amount: number, taskId?: string) {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    return this.prisma.$transaction(async (tx) => {
      const deposit = await tx.agentDeposit.findUnique({
        where: { agentId },
      });

      if (!deposit) {
        throw new NotFoundException('Deposit account not found');
      }

      const availableBalance = deposit.balance - deposit.frozenBalance;
      if (availableBalance < amount) {
        throw new BadRequestException(
          `Insufficient available balance to freeze. Available: ${availableBalance}, Required: ${amount}`,
        );
      }

      const newFrozenBalance = deposit.frozenBalance + amount;

      await tx.agentDeposit.update({
        where: { agentId },
        data: {
          frozenBalance: newFrozenBalance,
        },
      });

      const transaction = await tx.agentDepositTransaction.create({
        data: {
          depositId: deposit.id,
          agentId,
          type: 'freeze',
          amount: -amount,
          balance: deposit.balance,
          reason: 'freeze',
          taskId,
          metadata: JSON.stringify({ frozenAmount: amount }),
        },
      });

      return {
        transactionId: transaction.id,
        frozenAmount: amount,
        totalFrozen: newFrozenBalance,
        availableBalance: deposit.balance - newFrozenBalance,
      };
    });
  }

  /**
   * Unfreeze deposit amount
   */
  async unfreeze(agentId: string, amount: number, taskId?: string) {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    return this.prisma.$transaction(async (tx) => {
      const deposit = await tx.agentDeposit.findUnique({
        where: { agentId },
      });

      if (!deposit) {
        throw new NotFoundException('Deposit account not found');
      }

      if (deposit.frozenBalance < amount) {
        throw new BadRequestException(
          `Insufficient frozen balance to unfreeze. Frozen: ${deposit.frozenBalance}, Requested: ${amount}`,
        );
      }

      const newFrozenBalance = deposit.frozenBalance - amount;

      await tx.agentDeposit.update({
        where: { agentId },
        data: {
          frozenBalance: newFrozenBalance,
        },
      });

      const transaction = await tx.agentDepositTransaction.create({
        data: {
          depositId: deposit.id,
          agentId,
          type: 'unfreeze',
          amount,
          balance: deposit.balance,
          reason: 'unfreeze',
          taskId,
          metadata: JSON.stringify({ unfrozenAmount: amount }),
        },
      });

      return {
        transactionId: transaction.id,
        unfrozenAmount: amount,
        totalFrozen: newFrozenBalance,
        availableBalance: deposit.balance - newFrozenBalance,
      };
    });
  }

  /**
   * Get deposit statistics
   */
  async getStats(agentId?: string) {
    const where = agentId ? { agentId } : {};

    const [
      totalDeposits,
      totalDeductions,
      totalRefunds,
      totalBalance,
      totalFrozen,
    ] = await Promise.all([
      this.prisma.agentDeposit.aggregate({
        where,
        _sum: { totalDeposited: true },
      }),
      this.prisma.agentDeposit.aggregate({
        where,
        _sum: { totalDeducted: true },
      }),
      this.prisma.agentDeposit.aggregate({
        where,
        _sum: { totalRefunded: true },
      }),
      this.prisma.agentDeposit.aggregate({
        where,
        _sum: { balance: true },
      }),
      this.prisma.agentDeposit.aggregate({
        where,
        _sum: { frozenBalance: true },
      }),
    ]);

    return {
      totalDeposited: totalDeposits._sum.totalDeposited || 0,
      totalDeducted: totalDeductions._sum.totalDeducted || 0,
      totalRefunded: totalRefunds._sum.totalRefunded || 0,
      totalBalance: totalBalance._sum.balance || 0,
      totalFrozen: totalFrozen._sum.frozenBalance || 0,
    };
  }

  /**
   * Get top deposit holders
   */
  async getTopHolders(limit = 50) {
    const deposits = await this.prisma.agentDeposit.findMany({
      orderBy: { balance: 'desc' },
      take: limit,
    });

    const agentIds = deposits.map(d => d.agentId);
    const agents = await this.prisma.agent.findMany({
      where: { id: { in: agentIds } },
      select: { id: true, name: true, description: true },
    });

    const agentMap = new Map(agents.map(a => [a.id, a]));

    return {
      topHolders: deposits.map((deposit, index) => ({
        rank: index + 1,
        agentId: deposit.agentId,
        agentName: agentMap.get(deposit.agentId)?.name || 'Unknown',
        balance: deposit.balance,
        frozenBalance: deposit.frozenBalance,
        availableBalance: deposit.balance - deposit.frozenBalance,
        totalDeposited: deposit.totalDeposited,
        totalDeducted: deposit.totalDeducted,
      })),
    };
  }
}
