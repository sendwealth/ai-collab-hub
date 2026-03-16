import { Test, TestingModule } from '@nestjs/testing';
import { DepositService } from '../deposit.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('DepositService', () => {
  let service: DepositService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    agentDeposit: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      aggregate: jest.fn(),
      count: jest.fn(),
    },
    agentDepositTransaction: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    agent: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DepositService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<DepositService>(DepositService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getBalance', () => {
    it('should return existing deposit balance', async () => {
      const mockDeposit = {
        agentId: 'agent-123',
        balance: 1000,
        frozenBalance: 200,
        totalDeposited: 1500,
        totalDeducted: 300,
        totalRefunded: 0,
      };

      mockPrismaService.agentDeposit.findUnique.mockResolvedValue(mockDeposit);

      const result = await service.getBalance('agent-123');

      expect(result.agentId).toBe('agent-123');
      expect(result.balance).toBe(1000);
      expect(result.availableBalance).toBe(800);
    });

    it('should create new deposit if not exists', async () => {
      mockPrismaService.agentDeposit.findUnique.mockResolvedValue(null);
      mockPrismaService.agentDeposit.create.mockResolvedValue({
        agentId: 'agent-123',
        balance: 0,
        frozenBalance: 0,
        totalDeposited: 0,
        totalDeducted: 0,
        totalRefunded: 0,
      });

      const result = await service.getBalance('agent-123');

      expect(result.balance).toBe(0);
      expect(mockPrismaService.agentDeposit.create).toHaveBeenCalled();
    });
  });

  describe('deposit', () => {
    it('should deposit funds successfully', async () => {
      const agentId = 'agent-123';
      const amount = 500;

      mockPrismaService.agentDeposit.findUnique.mockResolvedValue({
        id: 'deposit-1',
        agentId,
        balance: 1000,
        frozenBalance: 200,
        totalDeposited: 1500,
        totalDeducted: 300,
        totalRefunded: 0,
      });

      mockPrismaService.agentDeposit.update.mockResolvedValue({
        agentId,
        balance: 1500,
        totalDeposited: 2000,
      });

      mockPrismaService.agentDepositTransaction.create.mockResolvedValue({
        id: 'txn-1',
        amount,
        balance: 1500,
        createdAt: new Date(),
      });

      const result = await service.deposit(agentId, amount, 'Test deposit');

      expect(result.amount).toBe(500);
      expect(result.newBalance).toBe(1500);
      expect(mockPrismaService.agentDeposit.update).toHaveBeenCalledWith({
        where: { agentId },
        data: {
          balance: 1500,
          totalDeposited: 2000,
        },
      });
    });

    it('should throw BadRequestException for invalid amount', async () => {
      await expect(service.deposit('agent-123', 0)).rejects.toThrow(BadRequestException);
      await expect(service.deposit('agent-123', -100)).rejects.toThrow(BadRequestException);
    });

    it('should create new deposit account if not exists', async () => {
      mockPrismaService.agentDeposit.findUnique.mockResolvedValue(null);
      mockPrismaService.agentDeposit.create.mockResolvedValue({
        id: 'deposit-1',
        agentId: 'agent-123',
        balance: 500,
        totalDeposited: 500,
      });

      mockPrismaService.agentDepositTransaction.create.mockResolvedValue({
        id: 'txn-1',
        amount: 500,
        balance: 500,
        createdAt: new Date(),
      });

      const result = await service.deposit('agent-123', 500);

      expect(result.newBalance).toBe(500);
      expect(mockPrismaService.agentDeposit.create).toHaveBeenCalled();
    });
  });

  describe('deduct', () => {
    it('should deduct funds successfully', async () => {
      const agentId = 'agent-123';
      const amount = 100;

      mockPrismaService.agentDeposit.findUnique.mockResolvedValue({
        id: 'deposit-1',
        agentId,
        balance: 1000,
        frozenBalance: 200,
        totalDeducted: 300,
      });

      mockPrismaService.agentDeposit.update.mockResolvedValue({
        agentId,
        balance: 900,
        totalDeducted: 400,
      });

      mockPrismaService.agentDepositTransaction.create.mockResolvedValue({
        id: 'txn-1',
        amount: -100,
        balance: 900,
        createdAt: new Date(),
      });

      const result = await service.deduct(agentId, amount, 'quality', 'task-1');

      expect(result.amount).toBe(100);
      expect(result.newBalance).toBe(900);
      expect(result.reason).toBe('quality');
      expect(result.taskId).toBe('task-1');
    });

    it('should throw NotFoundException for non-existent deposit', async () => {
      mockPrismaService.agentDeposit.findUnique.mockResolvedValue(null);

      await expect(
        service.deduct('agent-123', 100, 'quality'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for insufficient balance', async () => {
      mockPrismaService.agentDeposit.findUnique.mockResolvedValue({
        id: 'deposit-1',
        agentId: 'agent-123',
        balance: 100,
        frozenBalance: 50,
        totalDeducted: 0,
      });

      await expect(
        service.deduct('agent-123', 100, 'quality'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('refund', () => {
    it('should refund funds successfully', async () => {
      const agentId = 'agent-123';
      const amount = 100;

      mockPrismaService.agentDeposit.findUnique.mockResolvedValue({
        id: 'deposit-1',
        agentId,
        balance: 1000,
        totalRefunded: 0,
      });

      mockPrismaService.agentDeposit.update.mockResolvedValue({
        agentId,
        balance: 1100,
        totalRefunded: 100,
      });

      mockPrismaService.agentDepositTransaction.create.mockResolvedValue({
        id: 'txn-1',
        amount: 100,
        balance: 1100,
        createdAt: new Date(),
      });

      const result = await service.refund(agentId, amount, 'Task cancelled', 'task-1');

      expect(result.amount).toBe(100);
      expect(result.newBalance).toBe(1100);
      expect(result.reason).toBe('Task cancelled');
    });
  });

  describe('freeze and unfreeze', () => {
    it('should freeze funds successfully', async () => {
      const agentId = 'agent-123';
      const amount = 200;

      mockPrismaService.agentDeposit.findUnique.mockResolvedValue({
        id: 'deposit-1',
        agentId,
        balance: 1000,
        frozenBalance: 100,
      });

      mockPrismaService.agentDeposit.update.mockResolvedValue({
        agentId,
        frozenBalance: 300,
      });

      mockPrismaService.agentDepositTransaction.create.mockResolvedValue({
        id: 'txn-1',
      });

      const result = await service.freeze(agentId, amount);

      expect(result.frozenAmount).toBe(200);
      expect(result.totalFrozen).toBe(300);
      expect(result.availableBalance).toBe(700);
    });

    it('should unfreeze funds successfully', async () => {
      const agentId = 'agent-123';
      const amount = 200;

      mockPrismaService.agentDeposit.findUnique.mockResolvedValue({
        id: 'deposit-1',
        agentId,
        balance: 1000,
        frozenBalance: 300,
      });

      mockPrismaService.agentDeposit.update.mockResolvedValue({
        agentId,
        frozenBalance: 100,
      });

      mockPrismaService.agentDepositTransaction.create.mockResolvedValue({
        id: 'txn-1',
      });

      const result = await service.unfreeze(agentId, amount);

      expect(result.unfrozenAmount).toBe(200);
      expect(result.totalFrozen).toBe(100);
      expect(result.availableBalance).toBe(900);
    });
  });

  describe('calculateQualityDeduction', () => {
    it('should calculate correct deductions based on quality score', () => {
      expect(service.calculateQualityDeduction(95, 1000)).toBe(0);
      expect(service.calculateQualityDeduction(85, 1000)).toBe(100);
      expect(service.calculateQualityDeduction(70, 1000)).toBe(250);
      expect(service.calculateQualityDeduction(50, 1000)).toBe(400);
      expect(service.calculateQualityDeduction(30, 1000)).toBe(500);
    });
  });

  describe('calculateTimeoutDeduction', () => {
    it('should calculate correct deductions based on days late', () => {
      expect(service.calculateTimeoutDeduction(0, 1000)).toBe(0);
      expect(service.calculateTimeoutDeduction(1, 1000)).toBe(50);
      expect(service.calculateTimeoutDeduction(2, 1000)).toBe(100);
      expect(service.calculateTimeoutDeduction(5, 1000)).toBe(150);
      expect(service.calculateTimeoutDeduction(10, 1000)).toBe(200);
    });
  });

  describe('getTransactionHistory', () => {
    it('should return paginated transaction history', async () => {
      const mockTransactions = [
        {
          id: 'txn-1',
          type: 'deposit',
          amount: 500,
          balance: 1500,
          reason: 'Deposit',
          taskId: null,
          metadata: null,
          createdAt: new Date(),
        },
      ];

      mockPrismaService.agentDepositTransaction.findMany.mockResolvedValue(mockTransactions);
      mockPrismaService.agentDepositTransaction.count.mockResolvedValue(1);

      const result = await service.getTransactionHistory('agent-123', {
        page: 1,
        limit: 20,
      });

      expect(result.transactions).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it('should filter by transaction type', async () => {
      mockPrismaService.agentDepositTransaction.findMany.mockResolvedValue([]);
      mockPrismaService.agentDepositTransaction.count.mockResolvedValue(0);

      await service.getTransactionHistory('agent-123', {
        type: 'deposit',
        page: 1,
        limit: 20,
      });

      expect(mockPrismaService.agentDepositTransaction.findMany).toHaveBeenCalledWith({
        where: { agentId: 'agent-123', type: 'deposit' },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      });
    });
  });

  describe('getStats', () => {
    it('should return aggregate statistics', async () => {
      mockPrismaService.agentDeposit.aggregate
        .mockResolvedValueOnce({ _sum: { totalDeposited: 10000 } })
        .mockResolvedValueOnce({ _sum: { totalDeducted: 2000 } })
        .mockResolvedValueOnce({ _sum: { totalRefunded: 500 } })
        .mockResolvedValueOnce({ _sum: { balance: 8000 } })
        .mockResolvedValueOnce({ _sum: { frozenBalance: 1000 } });

      const result = await service.getStats();

      expect(result.totalDeposited).toBe(10000);
      expect(result.totalDeducted).toBe(2000);
      expect(result.totalRefunded).toBe(500);
      expect(result.totalBalance).toBe(8000);
      expect(result.totalFrozen).toBe(1000);
    });
  });

  describe('getTopHolders', () => {
    it('should return top deposit holders', async () => {
      const mockDeposits = [
        {
          id: 'deposit-1',
          agentId: 'agent-1',
          balance: 5000,
          frozenBalance: 500,
          totalDeposited: 10000,
          totalDeducted: 1000,
        },
        {
          id: 'deposit-2',
          agentId: 'agent-2',
          balance: 3000,
          frozenBalance: 0,
          totalDeposited: 5000,
          totalDeducted: 500,
        },
      ];

      const mockAgents = [
        { id: 'agent-1', name: 'Agent One', description: 'Top performer' },
        { id: 'agent-2', name: 'Agent Two', description: 'Good performer' },
      ];

      mockPrismaService.agentDeposit.findMany.mockResolvedValue(mockDeposits);
      mockPrismaService.agent.findMany.mockResolvedValue(mockAgents);

      const result = await service.getTopHolders(10);

      expect(result.topHolders).toHaveLength(2);
      expect(result.topHolders[0].rank).toBe(1);
      expect(result.topHolders[0].agentName).toBe('Agent One');
      expect(result.topHolders[1].rank).toBe(2);
    });
  });
});
