import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { DepositDto, WithdrawDto, TransferDto, GetTransactionHistoryDto, FreezeDto } from './dto/create-credit.dto';

@Injectable()
export class CreditsService {
  constructor(private readonly prisma: PrismaService) {}

  async getBalance(agentId: string) {
    let credit = await this.prisma.credit.findUnique({
      where: { agentId },
    });

    if (!credit) {
      // Create credit account if not exists
      credit = await this.prisma.credit.create({
        data: { agentId, balance: 0 },
      });
    }

    return {
      balance: credit.balance,
      frozenBalance: credit.frozenBalance,
      availableBalance: credit.balance - credit.frozenBalance,
      totalEarned: credit.totalEarned,
      totalSpent: credit.totalSpent,
    };
  }

  async deposit(agentId: string, depositDto: DepositDto) {
    const { amount, description } = depositDto;

    return this.prisma.$transaction(async (tx) => {
      // Get current balance
      const credit = await tx.credit.findUnique({
        where: { agentId },
      });

      if (!credit) {
        throw new NotFoundException('Credit account not found');
      }

      const newBalance = credit.balance + amount;

      // Update balance
      await tx.credit.update({
        where: { agentId },
        data: {
          balance: newBalance,
          totalEarned: credit.totalEarned + amount,
        },
      });

      // Create transaction record
      const transaction = await tx.creditTransaction.create({
        data: {
          agentId,
          type: 'deposit',
          amount,
          balance: newBalance,
          description: description || 'Deposit',
        },
      });

      return {
        transactionId: transaction.id,
        amount,
        newBalance,
      };
    });
  }

  async withdraw(agentId: string, withdrawDto: WithdrawDto) {
    const { amount, description } = withdrawDto;

    return this.prisma.$transaction(async (tx) => {
      const credit = await tx.credit.findUnique({
        where: { agentId },
      });

      if (!credit) {
        throw new NotFoundException('Credit account not found');
      }

      const availableBalance = credit.balance - credit.frozenBalance;
      if (availableBalance < amount) {
        throw new BadRequestException('Insufficient balance');
      }

      const newBalance = credit.balance - amount;

      await tx.credit.update({
        where: { agentId },
        data: {
          balance: newBalance,
          totalSpent: credit.totalSpent + amount,
        },
      });

      const transaction = await tx.creditTransaction.create({
        data: {
          agentId,
          type: 'withdraw',
          amount: -amount,
          balance: newBalance,
          description: description || 'Withdraw',
        },
      });

      return {
        transactionId: transaction.id,
        amount,
        newBalance,
      };
    });
  }

  async transfer(fromAgentId: string, transferDto: TransferDto) {
    const { toAgentId, amount, description } = transferDto;

    if (fromAgentId === toAgentId) {
      throw new BadRequestException('Cannot transfer to yourself');
    }

    return this.prisma.$transaction(async (tx) => {
      // Check sender balance
      const senderCredit = await tx.credit.findUnique({
        where: { agentId: fromAgentId },
      });

      if (!senderCredit) {
        throw new NotFoundException('Sender credit account not found');
      }

      const availableBalance = senderCredit.balance - senderCredit.frozenBalance;
      if (availableBalance < amount) {
        throw new BadRequestException('Insufficient balance');
      }

      // Check receiver exists
      const receiverCredit = await tx.credit.findUnique({
        where: { agentId: toAgentId },
      });

      if (!receiverCredit) {
        throw new NotFoundException('Receiver credit account not found');
      }

      // Update sender balance
      const senderNewBalance = senderCredit.balance - amount;
      await tx.credit.update({
        where: { agentId: fromAgentId },
        data: {
          balance: senderNewBalance,
          totalSpent: senderCredit.totalSpent + amount,
        },
      });

      // Create sender transaction
      await tx.creditTransaction.create({
        data: {
          agentId: fromAgentId,
          type: 'transfer',
          amount: -amount,
          balance: senderNewBalance,
          description: description || `Transfer to ${toAgentId}`,
          metadata: JSON.stringify({ toAgentId }),
        },
      });

      // Update receiver balance
      const receiverNewBalance = receiverCredit.balance + amount;
      await tx.credit.update({
        where: { agentId: toAgentId },
        data: {
          balance: receiverNewBalance,
          totalEarned: receiverCredit.totalEarned + amount,
        },
      });

      // Create receiver transaction
      const transaction = await tx.creditTransaction.create({
        data: {
          agentId: toAgentId,
          type: 'transfer',
          amount,
          balance: receiverNewBalance,
          description: description || `Transfer from ${fromAgentId}`,
          metadata: JSON.stringify({ fromAgentId }),
        },
      });

      return {
        transactionId: transaction.id,
        amount,
        senderNewBalance,
        receiverNewBalance,
      };
    });
  }

  async freeze(agentId: string, freezeDto: FreezeDto) {
    const { amount, description } = freezeDto;

    return this.prisma.$transaction(async (tx) => {
      const credit = await tx.credit.findUnique({
        where: { agentId },
      });

      if (!credit) {
        throw new NotFoundException('Credit account not found');
      }

      const availableBalance = credit.balance - credit.frozenBalance;
      if (availableBalance < amount) {
        throw new BadRequestException('Insufficient available balance to freeze');
      }

      const newFrozenBalance = credit.frozenBalance + amount;

      await tx.credit.update({
        where: { agentId },
        data: {
          frozenBalance: newFrozenBalance,
        },
      });

      const transaction = await tx.creditTransaction.create({
        data: {
          agentId,
          type: 'freeze',
          amount: -amount,
          balance: credit.balance,
          description: description || 'Freeze credits',
          metadata: JSON.stringify({ frozenAmount: amount }),
        },
      });

      return {
        transactionId: transaction.id,
        frozenAmount: amount,
        totalFrozen: newFrozenBalance,
        availableBalance: credit.balance - newFrozenBalance,
      };
    });
  }

  async unfreeze(agentId: string, freezeDto: FreezeDto) {
    const { amount, description } = freezeDto;

    return this.prisma.$transaction(async (tx) => {
      const credit = await tx.credit.findUnique({
        where: { agentId },
      });

      if (!credit) {
        throw new NotFoundException('Credit account not found');
      }

      if (credit.frozenBalance < amount) {
        throw new BadRequestException('Insufficient frozen balance to unfreeze');
      }

      const newFrozenBalance = credit.frozenBalance - amount;

      await tx.credit.update({
        where: { agentId },
        data: {
          frozenBalance: newFrozenBalance,
        },
      });

      const transaction = await tx.creditTransaction.create({
        data: {
          agentId,
          type: 'unfreeze',
          amount,
          balance: credit.balance,
          description: description || 'Unfreeze credits',
          metadata: JSON.stringify({ unfrozenAmount: amount }),
        },
      });

      return {
        transactionId: transaction.id,
        unfrozenAmount: amount,
        totalFrozen: newFrozenBalance,
        availableBalance: credit.balance - newFrozenBalance,
      };
    });
  }

  async getTransactionHistory(
    agentId: string,
    query: GetTransactionHistoryDto,
  ) {
    const { type, startDate, endDate, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = { agentId };
    if (type) {
      where.type = type;
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const [transactions, total] = await Promise.all([
      this.prisma.creditTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.creditTransaction.count({ where }),
    ]);

    return {
      transactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async rewardAgent(agentId: string, amount: number, taskId: string, description?: string) {
    return this.prisma.$transaction(async (tx) => {
      const credit = await tx.credit.findUnique({
        where: { agentId },
      });

      if (!credit) {
        // Create credit account
        await tx.credit.create({
          data: { agentId, balance: amount, totalEarned: amount },
        });
      } else {
        await tx.credit.update({
          where: { agentId },
          data: {
            balance: credit.balance + amount,
            totalEarned: credit.totalEarned + amount,
          },
        });
      }

      const transaction = await tx.creditTransaction.create({
        data: {
          agentId,
          type: 'earn',
          amount,
          balance: (credit?.balance || 0) + amount,
          taskId,
          description: description || 'Task reward',
        },
      });

      return transaction;
    });
  }
}
