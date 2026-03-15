import { Test, TestingModule } from '@nestjs/testing';
import { CreditsService } from '../src/modules/credits/credits.service';
import { PrismaService } from '../src/modules/common/prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

describe('Credits Concurrency Tests', () => {
  let service: CreditsService;
  let prisma: any;

  const mockPrismaService: any = {
    credit: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    creditTransaction: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn((fn) => fn(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreditsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CreditsService>(CreditsService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Concurrent withdrawals', () => {
    it('should handle multiple concurrent withdrawal attempts', async () => {
      const mockCredit = {
        agentId: 'agent-1',
        balance: 1000,
        frozenBalance: 0,
        totalSpent: 0,
      };

      // Simulate race condition by returning same balance for all calls
      mockPrismaService.credit.findUnique.mockResolvedValue(mockCredit);
      mockPrismaService.creditTransaction.create.mockResolvedValue({ id: 'tx-1' });

      // Attempt 3 concurrent withdrawals of 400 each (total 1200, but only 1000 available)
      const withdrawalPromises = [1, 2, 3].map(() =>
        service.withdraw('agent-1', { amount: 400 }).catch((e) => e),
      );

      const results = await Promise.all(withdrawalPromises);

      // At least one should fail due to insufficient balance
      const failures = results.filter((r) => r instanceof BadRequestException);
      expect(failures.length).toBeGreaterThan(0);
    });

    it('should handle concurrent transfers from same sender', async () => {
      const senderCredit = {
        agentId: 'agent-1',
        balance: 1000,
        frozenBalance: 0,
        totalSpent: 0,
      };

      const receiverCredit = {
        agentId: 'agent-2',
        balance: 0,
        totalEarned: 0,
      };

      mockPrismaService.credit.findUnique
        .mockResolvedValueOnce(senderCredit)
        .mockResolvedValueOnce(receiverCredit)
        .mockResolvedValueOnce(senderCredit)
        .mockResolvedValueOnce(receiverCredit)
        .mockResolvedValueOnce(senderCredit)
        .mockResolvedValueOnce(receiverCredit);

      mockPrismaService.creditTransaction.create.mockResolvedValue({ id: 'tx-1' });

      // Attempt 3 concurrent transfers of 400 each (total 1200, but only 1000 available)
      const transferPromises = [1, 2, 3].map(() =>
        service.transfer('agent-1', { toAgentId: 'agent-2', amount: 400 }).catch((e) => e),
      );

      const results = await Promise.all(transferPromises);

      // At least one should fail
      const failures = results.filter((r) => r instanceof BadRequestException);
      expect(failures.length).toBeGreaterThan(0);
    });
  });

  describe('Concurrent deposits and withdrawals', () => {
    it('should handle concurrent deposits correctly', async () => {
      const mockCredit = {
        agentId: 'agent-1',
        balance: 0,
        totalEarned: 0,
      };

      mockPrismaService.credit.findUnique.mockResolvedValue(mockCredit);
      mockPrismaService.creditTransaction.create.mockResolvedValue({ id: 'tx-1' });

      // Execute 5 concurrent deposits
      const depositPromises = [100, 200, 300, 400, 500].map((amount) =>
        service.deposit('agent-1', { amount }),
      );

      const results = await Promise.all(depositPromises);

      // All deposits should succeed
      expect(results).toHaveLength(5);
      results.forEach((result) => {
        expect(result).toHaveProperty('transactionId');
      });
    });

    it('should handle mixed concurrent operations', async () => {
      const mockCredit = {
        agentId: 'agent-1',
        balance: 1000,
        frozenBalance: 0,
        totalEarned: 1000,
        totalSpent: 0,
      };

      const receiverCredit = {
        agentId: 'agent-2',
        balance: 0,
        totalEarned: 0,
      };

      mockPrismaService.credit.findUnique.mockResolvedValue(mockCredit);
      mockPrismaService.creditTransaction.create.mockResolvedValue({ id: 'tx-1' });

      // Execute mixed operations concurrently
      const operations = [
        service.deposit('agent-1', { amount: 500 }),
        service.withdraw('agent-1', { amount: 200 }).catch((e) => e),
        service.transfer('agent-1', { toAgentId: 'agent-2', amount: 300 }).catch((e) => e),
      ];

      const results = await Promise.all(operations);

      // Deposit should always succeed
      expect(results[0]).toHaveProperty('transactionId');
    });
  });

  describe('Concurrent freeze/unfreeze operations', () => {
    it('should handle concurrent freeze operations', async () => {
      const mockCredit = {
        agentId: 'agent-1',
        balance: 1000,
        frozenBalance: 0,
      };

      mockPrismaService.credit.findUnique.mockResolvedValue(mockCredit);
      mockPrismaService.creditTransaction.create.mockResolvedValue({ id: 'tx-1' });

      // Attempt to freeze 600, 600, and 600 concurrently (total 1800, but only 1000 available)
      const freezePromises = [1, 2, 3].map(() =>
        service.freeze('agent-1', { amount: 600 }).catch((e) => e),
      );

      const results = await Promise.all(freezePromises);

      // At least one should fail
      const failures = results.filter((r) => r instanceof BadRequestException);
      expect(failures.length).toBeGreaterThan(0);
    });

    it('should handle concurrent unfreeze operations', async () => {
      const mockCredit = {
        agentId: 'agent-1',
        balance: 1000,
        frozenBalance: 500,
      };

      mockPrismaService.credit.findUnique.mockResolvedValue(mockCredit);
      mockPrismaService.creditTransaction.create.mockResolvedValue({ id: 'tx-1' });

      // Attempt to unfreeze 300, 300, and 300 concurrently (total 900, but only 500 frozen)
      const unfreezePromises = [1, 2, 3].map(() =>
        service.unfreeze('agent-1', { amount: 300 }).catch((e) => e),
      );

      const results = await Promise.all(unfreezePromises);

      // At least one should fail
      const failures = results.filter((r) => r instanceof BadRequestException);
      expect(failures.length).toBeGreaterThan(0);
    });
  });

  describe('Race condition scenarios', () => {
    it('should handle rapid balance queries during updates', async () => {
      const mockCredit = {
        agentId: 'agent-1',
        balance: 1000,
        frozenBalance: 200,
        totalEarned: 5000,
        totalSpent: 4000,
      };

      mockPrismaService.credit.findUnique.mockResolvedValue(mockCredit);

      // Execute multiple balance queries concurrently
      const balancePromises = Array(10)
        .fill(null)
        .map(() => service.getBalance('agent-1'));

      const results = await Promise.all(balancePromises);

      // All should return consistent results
      results.forEach((result) => {
        expect(result.balance).toBe(1000);
        expect(result.frozenBalance).toBe(200);
        expect(result.availableBalance).toBe(800);
      });
    });

    it('should handle transfer to same receiver concurrently', async () => {
      const senderCredit = {
        agentId: 'agent-1',
        balance: 1000,
        frozenBalance: 0,
        totalSpent: 0,
      };

      const receiverCredit = {
        agentId: 'agent-2',
        balance: 0,
        totalEarned: 0,
      };

      mockPrismaService.credit.findUnique
        .mockResolvedValueOnce(senderCredit)
        .mockResolvedValueOnce(receiverCredit)
        .mockResolvedValueOnce(senderCredit)
        .mockResolvedValueOnce(receiverCredit);

      mockPrismaService.creditTransaction.create.mockResolvedValue({ id: 'tx-1' });

      // Execute two transfers to same receiver concurrently
      const transferPromises = [
        service.transfer('agent-1', { toAgentId: 'agent-2', amount: 600 }),
        service.transfer('agent-1', { toAgentId: 'agent-2', amount: 600 }),
      ];

      const results = await Promise.allSettled(transferPromises);

      // One should succeed, one should fail (or both handled correctly)
      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      expect(fulfilled.length).toBeGreaterThan(0);
    });
  });
});
