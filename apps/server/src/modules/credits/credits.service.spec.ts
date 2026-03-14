import { Test, TestingModule } from '@nestjs/testing';
import { CreditsService } from './credits.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TransactionType } from './dto/create-credit.dto';

describe('CreditsService', () => {
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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getBalance', () => {
    it('should return balance for existing account', async () => {
      const mockCredit = {
        agentId: 'agent-1',
        balance: 1000,
        frozenBalance: 200,
        totalEarned: 5000,
        totalSpent: 4000,
      };

      mockPrismaService.credit.findUnique.mockResolvedValue(mockCredit);

      const result = await service.getBalance('agent-1');

      expect(result).toEqual({
        balance: 1000,
        frozenBalance: 200,
        availableBalance: 800,
        totalEarned: 5000,
        totalSpent: 4000,
      });
      expect(prisma.credit.findUnique).toHaveBeenCalledWith({
        where: { agentId: 'agent-1' },
      });
    });

    it('should create account and return zero balance for non-existing account', async () => {
      mockPrismaService.credit.findUnique.mockResolvedValue(null);
      mockPrismaService.credit.create.mockResolvedValue({
        agentId: 'agent-new',
        balance: 0,
        frozenBalance: 0,
        totalEarned: 0,
        totalSpent: 0,
      });

      const result = await service.getBalance('agent-new');

      expect(result).toEqual({
        balance: 0,
        frozenBalance: 0,
        availableBalance: 0,
        totalEarned: 0,
        totalSpent: 0,
      });
      expect(prisma.credit.create).toHaveBeenCalledWith({
        data: { agentId: 'agent-new', balance: 0 },
      });
    });

    it('should calculate availableBalance correctly when frozen', async () => {
      const mockCredit = {
        agentId: 'agent-1',
        balance: 500,
        frozenBalance: 300,
        totalEarned: 1000,
        totalSpent: 500,
      };

      mockPrismaService.credit.findUnique.mockResolvedValue(mockCredit);

      const result = await service.getBalance('agent-1');

      expect(result.availableBalance).toBe(200);
    });

    it('should handle zero frozen balance', async () => {
      const mockCredit = {
        agentId: 'agent-1',
        balance: 1000,
        frozenBalance: 0,
        totalEarned: 1000,
        totalSpent: 0,
      };

      mockPrismaService.credit.findUnique.mockResolvedValue(mockCredit);

      const result = await service.getBalance('agent-1');

      expect(result.availableBalance).toBe(1000);
    });
  });

  describe('deposit', () => {
    it('should deposit credits successfully', async () => {
      const depositDto = {
        amount: 100,
        description: 'Test deposit',
      };

      const mockCredit = {
        agentId: 'agent-1',
        balance: 500,
        totalEarned: 1000,
      };

      const mockTransaction = {
        id: 'tx-1',
        agentId: 'agent-1',
        type: 'deposit',
        amount: 100,
        balance: 600,
        description: 'Test deposit',
      };

      mockPrismaService.credit.findUnique.mockResolvedValue(mockCredit);
      mockPrismaService.credit.update.mockResolvedValue({
        ...mockCredit,
        balance: 600,
      });
      mockPrismaService.creditTransaction.create.mockResolvedValue(mockTransaction);

      const result = await service.deposit('agent-1', depositDto);

      expect(result).toEqual({
        transactionId: 'tx-1',
        amount: 100,
        newBalance: 600,
      });
      expect(prisma.credit.update).toHaveBeenCalledWith({
        where: { agentId: 'agent-1' },
        data: {
          balance: 600,
          totalEarned: 1100,
        },
      });
    });

    it('should throw NotFoundException for non-existing account', async () => {
      const depositDto = { amount: 100 };

      mockPrismaService.credit.findUnique.mockResolvedValue(null);

      await expect(service.deposit('agent-invalid', depositDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should use default description if not provided', async () => {
      const depositDto = { amount: 100 };

      const mockCredit = {
        agentId: 'agent-1',
        balance: 500,
        totalEarned: 1000,
      };

      mockPrismaService.credit.findUnique.mockResolvedValue(mockCredit);
      mockPrismaService.creditTransaction.create.mockResolvedValue({
        id: 'tx-1',
        description: 'Deposit',
      });

      await service.deposit('agent-1', depositDto);

      expect(prisma.creditTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          description: 'Deposit',
        }),
      });
    });

    it('should update totalEarned correctly', async () => {
      const depositDto = { amount: 500 };

      const mockCredit = {
        agentId: 'agent-1',
        balance: 1000,
        totalEarned: 2000,
      };

      mockPrismaService.credit.findUnique.mockResolvedValue(mockCredit);
      mockPrismaService.creditTransaction.create.mockResolvedValue({ id: 'tx-1' });

      await service.deposit('agent-1', depositDto);

      expect(prisma.credit.update).toHaveBeenCalledWith({
        where: { agentId: 'agent-1' },
        data: {
          balance: 1500,
          totalEarned: 2500,
        },
      });
    });

    it('should handle large deposit amounts', async () => {
      const depositDto = { amount: 1000000 };

      const mockCredit = {
        agentId: 'agent-1',
        balance: 0,
        totalEarned: 0,
      };

      mockPrismaService.credit.findUnique.mockResolvedValue(mockCredit);
      mockPrismaService.creditTransaction.create.mockResolvedValue({ id: 'tx-1' });

      const result = await service.deposit('agent-1', depositDto);

      expect(result.newBalance).toBe(1000000);
    });
  });

  describe('withdraw', () => {
    it('should withdraw credits successfully', async () => {
      const withdrawDto = {
        amount: 100,
        description: 'Test withdraw',
      };

      const mockCredit = {
        agentId: 'agent-1',
        balance: 500,
        frozenBalance: 0,
        totalSpent: 200,
      };

      const mockTransaction = {
        id: 'tx-1',
        agentId: 'agent-1',
        type: 'withdraw',
        amount: -100,
        balance: 400,
      };

      mockPrismaService.credit.findUnique.mockResolvedValue(mockCredit);
      mockPrismaService.credit.update.mockResolvedValue({
        ...mockCredit,
        balance: 400,
      });
      mockPrismaService.creditTransaction.create.mockResolvedValue(mockTransaction);

      const result = await service.withdraw('agent-1', withdrawDto);

      expect(result).toEqual({
        transactionId: 'tx-1',
        amount: 100,
        newBalance: 400,
      });
    });

    it('should throw BadRequestException for insufficient balance', async () => {
      const withdrawDto = { amount: 1000 };

      const mockCredit = {
        agentId: 'agent-1',
        balance: 500,
        frozenBalance: 0,
      };

      mockPrismaService.credit.findUnique.mockResolvedValue(mockCredit);

      await expect(service.withdraw('agent-1', withdrawDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.withdraw('agent-1', withdrawDto)).rejects.toThrow(
        'Insufficient balance',
      );
    });

    it('should throw BadRequestException when only frozen balance available', async () => {
      const withdrawDto = { amount: 100 };

      const mockCredit = {
        agentId: 'agent-1',
        balance: 500,
        frozenBalance: 500,
      };

      mockPrismaService.credit.findUnique.mockResolvedValue(mockCredit);

      await expect(service.withdraw('agent-1', withdrawDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException for non-existing account', async () => {
      const withdrawDto = { amount: 100 };

      mockPrismaService.credit.findUnique.mockResolvedValue(null);

      await expect(service.withdraw('agent-invalid', withdrawDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should use default description if not provided', async () => {
      const withdrawDto = { amount: 50 };

      const mockCredit = {
        agentId: 'agent-1',
        balance: 500,
        frozenBalance: 0,
        totalSpent: 0,
      };

      mockPrismaService.credit.findUnique.mockResolvedValue(mockCredit);
      mockPrismaService.creditTransaction.create.mockResolvedValue({ id: 'tx-1' });

      await service.withdraw('agent-1', withdrawDto);

      expect(prisma.creditTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          description: 'Withdraw',
        }),
      });
    });

    it('should update totalSpent correctly', async () => {
      const withdrawDto = { amount: 100 };

      const mockCredit = {
        agentId: 'agent-1',
        balance: 500,
        frozenBalance: 0,
        totalSpent: 300,
      };

      mockPrismaService.credit.findUnique.mockResolvedValue(mockCredit);
      mockPrismaService.creditTransaction.create.mockResolvedValue({ id: 'tx-1' });

      await service.withdraw('agent-1', withdrawDto);

      expect(prisma.credit.update).toHaveBeenCalledWith({
        where: { agentId: 'agent-1' },
        data: {
          balance: 400,
          totalSpent: 400,
        },
      });
    });

    it('should record negative amount in transaction', async () => {
      const withdrawDto = { amount: 100 };

      const mockCredit = {
        agentId: 'agent-1',
        balance: 500,
        frozenBalance: 0,
        totalSpent: 0,
      };

      mockPrismaService.credit.findUnique.mockResolvedValue(mockCredit);
      mockPrismaService.creditTransaction.create.mockResolvedValue({ id: 'tx-1' });

      await service.withdraw('agent-1', withdrawDto);

      expect(prisma.creditTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          amount: -100,
          type: 'withdraw',
        }),
      });
    });

    it('should withdraw exact available balance', async () => {
      const withdrawDto = { amount: 300 };

      const mockCredit = {
        agentId: 'agent-1',
        balance: 500,
        frozenBalance: 200,
        totalSpent: 0,
      };

      mockPrismaService.credit.findUnique.mockResolvedValue(mockCredit);
      mockPrismaService.creditTransaction.create.mockResolvedValue({ id: 'tx-1' });

      const result = await service.withdraw('agent-1', withdrawDto);

      expect(result.newBalance).toBe(200);
    });
  });

  describe('transfer', () => {
    it('should transfer credits successfully', async () => {
      const transferDto = {
        toAgentId: 'agent-2',
        amount: 100,
        description: 'Test transfer',
      };

      const senderCredit = {
        agentId: 'agent-1',
        balance: 500,
        frozenBalance: 0,
        totalSpent: 0,
      };

      const receiverCredit = {
        agentId: 'agent-2',
        balance: 200,
        totalEarned: 200,
      };

      mockPrismaService.credit.findUnique
        .mockResolvedValueOnce(senderCredit)
        .mockResolvedValueOnce(receiverCredit);
      mockPrismaService.creditTransaction.create.mockResolvedValue({ id: 'tx-1' });

      const result = await service.transfer('agent-1', transferDto);

      expect(result).toEqual({
        transactionId: 'tx-1',
        amount: 100,
        senderNewBalance: 400,
        receiverNewBalance: 300,
      });
    });

    it('should throw BadRequestException when transferring to self', async () => {
      const transferDto = {
        toAgentId: 'agent-1',
        amount: 100,
      };

      await expect(service.transfer('agent-1', transferDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.transfer('agent-1', transferDto)).rejects.toThrow(
        'Cannot transfer to yourself',
      );
    });

    it('should throw BadRequestException for insufficient balance', async () => {
      const transferDto = {
        toAgentId: 'agent-2',
        amount: 1000,
      };

      const senderCredit = {
        agentId: 'agent-1',
        balance: 500,
        frozenBalance: 0,
      };

      mockPrismaService.credit.findUnique.mockResolvedValue(senderCredit);

      await expect(service.transfer('agent-1', transferDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException for non-existing sender', async () => {
      const transferDto = {
        toAgentId: 'agent-2',
        amount: 100,
      };

      mockPrismaService.credit.findUnique.mockResolvedValue(null);

      await expect(service.transfer('agent-invalid', transferDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.transfer('agent-invalid', transferDto)).rejects.toThrow(
        'Sender credit account not found',
      );
    });

    it('should throw NotFoundException for non-existing receiver', async () => {
      const transferDto = {
        toAgentId: 'agent-invalid',
        amount: 100,
      };

      const senderCredit = {
        agentId: 'agent-1',
        balance: 500,
        frozenBalance: 0,
        totalSpent: 0,
      };

      // First call for sender, second call for receiver
      mockPrismaService.credit.findUnique
        .mockResolvedValueOnce(senderCredit) // sender check
        .mockResolvedValueOnce(null); // receiver check

      await expect(service.transfer('agent-1', transferDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should update both sender and receiver balances', async () => {
      const transferDto = {
        toAgentId: 'agent-2',
        amount: 100,
      };

      const senderCredit = {
        agentId: 'agent-1',
        balance: 500,
        frozenBalance: 0,
        totalSpent: 0,
      };

      const receiverCredit = {
        agentId: 'agent-2',
        balance: 200,
        totalEarned: 200,
      };

      mockPrismaService.credit.findUnique
        .mockResolvedValueOnce(senderCredit)
        .mockResolvedValueOnce(receiverCredit);
      mockPrismaService.creditTransaction.create.mockResolvedValue({ id: 'tx-1' });

      await service.transfer('agent-1', transferDto);

      expect(prisma.credit.update).toHaveBeenCalledTimes(2);
      expect(prisma.credit.update).toHaveBeenCalledWith({
        where: { agentId: 'agent-1' },
        data: {
          balance: 400,
          totalSpent: 100,
        },
      });
      expect(prisma.credit.update).toHaveBeenCalledWith({
        where: { agentId: 'agent-2' },
        data: {
          balance: 300,
          totalEarned: 300,
        },
      });
    });

    it('should create two transactions with correct metadata', async () => {
      const transferDto = {
        toAgentId: 'agent-2',
        amount: 100,
      };

      const senderCredit = {
        agentId: 'agent-1',
        balance: 500,
        frozenBalance: 0,
        totalSpent: 0,
      };

      const receiverCredit = {
        agentId: 'agent-2',
        balance: 200,
        totalEarned: 200,
      };

      mockPrismaService.credit.findUnique
        .mockResolvedValueOnce(senderCredit)
        .mockResolvedValueOnce(receiverCredit);
      mockPrismaService.creditTransaction.create.mockResolvedValue({ id: 'tx-1' });

      await service.transfer('agent-1', transferDto);

      expect(prisma.creditTransaction.create).toHaveBeenCalledTimes(2);
      expect(prisma.creditTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          agentId: 'agent-1',
          type: 'transfer',
          amount: -100,
          metadata: JSON.stringify({ toAgentId: 'agent-2' }),
        }),
      });
    });

    it('should use default descriptions when not provided', async () => {
      const transferDto = {
        toAgentId: 'agent-2',
        amount: 100,
      };

      const senderCredit = {
        agentId: 'agent-1',
        balance: 500,
        frozenBalance: 0,
        totalSpent: 0,
      };

      const receiverCredit = {
        agentId: 'agent-2',
        balance: 200,
        totalEarned: 200,
      };

      mockPrismaService.credit.findUnique
        .mockResolvedValueOnce(senderCredit)
        .mockResolvedValueOnce(receiverCredit);
      mockPrismaService.creditTransaction.create.mockResolvedValue({ id: 'tx-1' });

      await service.transfer('agent-1', transferDto);

      expect(prisma.creditTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            description: 'Transfer to agent-2',
          }),
        }),
      );
    });

    it('should handle transfer with frozen balance', async () => {
      const transferDto = {
        toAgentId: 'agent-2',
        amount: 250, // Try to transfer more than available (500 - 300 = 200 available)
      };

      const senderCredit = {
        agentId: 'agent-1',
        balance: 500,
        frozenBalance: 300,
        totalSpent: 0,
      };

      const receiverCredit = {
        agentId: 'agent-2',
        balance: 100,
        totalEarned: 100,
      };

      mockPrismaService.credit.findUnique
        .mockResolvedValueOnce(senderCredit)
        .mockResolvedValueOnce(receiverCredit);

      // Should fail because available balance is only 200, but trying to transfer 250
      await expect(service.transfer('agent-1', transferDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getTransactionHistory', () => {
    it('should return transaction history with pagination', async () => {
      const query = {
        page: 1,
        limit: 20,
      };

      const mockTransactions = [
        {
          id: 'tx-1',
          agentId: 'agent-1',
          type: 'deposit',
          amount: 100,
          balance: 100,
          createdAt: new Date(),
        },
        {
          id: 'tx-2',
          agentId: 'agent-1',
          type: 'withdraw',
          amount: -50,
          balance: 50,
          createdAt: new Date(),
        },
      ];

      mockPrismaService.creditTransaction.findMany.mockResolvedValue(mockTransactions);
      mockPrismaService.creditTransaction.count.mockResolvedValue(2);

      const result = await service.getTransactionHistory('agent-1', query);

      expect(result).toEqual({
        transactions: mockTransactions,
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });

    it('should filter by transaction type', async () => {
      const query = {
        type: TransactionType.DEPOSIT,
        page: 1,
        limit: 20,
      };

      const mockTransactions = [
        {
          id: 'tx-1',
          type: 'deposit',
          amount: 100,
        },
      ];

      mockPrismaService.creditTransaction.findMany.mockResolvedValue(mockTransactions);
      mockPrismaService.creditTransaction.count.mockResolvedValue(1);

      await service.getTransactionHistory('agent-1', query);

      expect(prisma.creditTransaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { agentId: 'agent-1', type: 'deposit' },
        }),
      );
    });

    it('should filter by date range', async () => {
      const query = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        page: 1,
        limit: 20,
      };

      mockPrismaService.creditTransaction.findMany.mockResolvedValue([]);
      mockPrismaService.creditTransaction.count.mockResolvedValue(0);

      await service.getTransactionHistory('agent-1', query);

      expect(prisma.creditTransaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            agentId: 'agent-1',
            createdAt: {
              gte: new Date('2024-01-01'),
              lte: new Date('2024-12-31'),
            },
          },
        }),
      );
    });

    it('should filter by start date only', async () => {
      const query = {
        startDate: '2024-01-01',
        page: 1,
        limit: 20,
      };

      mockPrismaService.creditTransaction.findMany.mockResolvedValue([]);
      mockPrismaService.creditTransaction.count.mockResolvedValue(0);

      await service.getTransactionHistory('agent-1', query);

      expect(prisma.creditTransaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            agentId: 'agent-1',
            createdAt: {
              gte: new Date('2024-01-01'),
            },
          },
        }),
      );
    });

    it('should filter by end date only', async () => {
      const query = {
        endDate: '2024-12-31',
        page: 1,
        limit: 20,
      };

      mockPrismaService.creditTransaction.findMany.mockResolvedValue([]);
      mockPrismaService.creditTransaction.count.mockResolvedValue(0);

      await service.getTransactionHistory('agent-1', query);

      expect(prisma.creditTransaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            agentId: 'agent-1',
            createdAt: {
              lte: new Date('2024-12-31'),
            },
          },
        }),
      );
    });

    it('should calculate totalPages correctly', async () => {
      const query = {
        page: 1,
        limit: 10,
      };

      mockPrismaService.creditTransaction.findMany.mockResolvedValue([]);
      mockPrismaService.creditTransaction.count.mockResolvedValue(25);

      const result = await service.getTransactionHistory('agent-1', query);

      expect(result.totalPages).toBe(3);
    });

    it('should handle empty result', async () => {
      const query = {
        page: 1,
        limit: 20,
      };

      mockPrismaService.creditTransaction.findMany.mockResolvedValue([]);
      mockPrismaService.creditTransaction.count.mockResolvedValue(0);

      const result = await service.getTransactionHistory('agent-1', query);

      expect(result.transactions).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('should handle pagination correctly', async () => {
      const query = {
        page: 2,
        limit: 10,
      };

      mockPrismaService.creditTransaction.findMany.mockResolvedValue([]);
      mockPrismaService.creditTransaction.count.mockResolvedValue(25);

      await service.getTransactionHistory('agent-1', query);

      expect(prisma.creditTransaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
    });

    it('should order by createdAt descending', async () => {
      const query = {
        page: 1,
        limit: 20,
      };

      mockPrismaService.creditTransaction.findMany.mockResolvedValue([]);
      mockPrismaService.creditTransaction.count.mockResolvedValue(0);

      await service.getTransactionHistory('agent-1', query);

      expect(prisma.creditTransaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
    });
  });

  describe('rewardAgent', () => {
    it('should reward existing agent', async () => {
      const mockCredit = {
        agentId: 'agent-1',
        balance: 500,
        totalEarned: 1000,
      };

      const mockTransaction = {
        id: 'tx-1',
        agentId: 'agent-1',
        type: 'earn',
        amount: 100,
        balance: 600,
        taskId: 'task-1',
      };

      // Clear previous mocks and set up fresh ones
      mockPrismaService.credit.findUnique.mockReset();
      mockPrismaService.credit.update.mockReset();
      mockPrismaService.creditTransaction.create.mockReset();
      
      mockPrismaService.credit.findUnique.mockResolvedValue(mockCredit);
      mockPrismaService.credit.update.mockResolvedValue({
        ...mockCredit,
        balance: 600,
        totalEarned: 1100,
      });
      mockPrismaService.creditTransaction.create.mockResolvedValue(mockTransaction);

      const result = await service.rewardAgent(
        'agent-1',
        100,
        'task-1',
        'Task completed',
      );

      expect(result).toEqual(mockTransaction);
      expect(prisma.credit.update).toHaveBeenCalledWith({
        where: { agentId: 'agent-1' },
        data: {
          balance: 600,
          totalEarned: 1100,
        },
      });
    });

    it('should create account and reward new agent', async () => {
      const mockTransaction = {
        id: 'tx-1',
        agentId: 'agent-new',
        type: 'earn',
        amount: 100,
        balance: 100,
        taskId: 'task-1',
      };

      mockPrismaService.credit.findUnique.mockResolvedValue(null);
      mockPrismaService.credit.create.mockResolvedValue({
        agentId: 'agent-new',
        balance: 100,
        totalEarned: 100,
      });
      mockPrismaService.creditTransaction.create.mockResolvedValue(mockTransaction);

      const result = await service.rewardAgent('agent-new', 100, 'task-1');

      expect(result.amount).toBe(100);
      expect(prisma.credit.create).toHaveBeenCalledWith({
        data: {
          agentId: 'agent-new',
          balance: 100,
          totalEarned: 100,
        },
      });
    });

    it('should use default description if not provided', async () => {
      const mockCredit = {
        agentId: 'agent-1',
        balance: 500,
        totalEarned: 1000,
      };

      mockPrismaService.credit.findUnique.mockResolvedValue(mockCredit);
      mockPrismaService.creditTransaction.create.mockResolvedValue({ id: 'tx-1' });

      await service.rewardAgent('agent-1', 100, 'task-1');

      expect(prisma.creditTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          description: 'Task reward',
        }),
      });
    });

    it('should include taskId in transaction', async () => {
      const mockCredit = {
        agentId: 'agent-1',
        balance: 500,
        totalEarned: 1000,
      };

      mockPrismaService.credit.findUnique.mockResolvedValue(mockCredit);
      mockPrismaService.creditTransaction.create.mockResolvedValue({ id: 'tx-1' });

      await service.rewardAgent('agent-1', 100, 'task-123');

      expect(prisma.creditTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          taskId: 'task-123',
        }),
      });
    });

    it('should create earn type transaction', async () => {
      const mockCredit = {
        agentId: 'agent-1',
        balance: 500,
        totalEarned: 1000,
      };

      mockPrismaService.credit.findUnique.mockResolvedValue(mockCredit);
      mockPrismaService.creditTransaction.create.mockResolvedValue({ id: 'tx-1' });

      await service.rewardAgent('agent-1', 100, 'task-1');

      expect(prisma.creditTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'earn',
        }),
      });
    });
  });

  describe('Transaction isolation', () => {
    it('should use transaction for deposit', async () => {
      const mockCredit = {
        agentId: 'agent-1',
        balance: 500,
        totalEarned: 1000,
      };

      mockPrismaService.credit.findUnique.mockResolvedValue(mockCredit);
      mockPrismaService.creditTransaction.create.mockResolvedValue({ id: 'tx-1' });

      await service.deposit('agent-1', { amount: 100 });

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should use transaction for withdraw', async () => {
      const mockCredit = {
        agentId: 'agent-1',
        balance: 500,
        frozenBalance: 0,
        totalSpent: 0,
      };

      mockPrismaService.credit.findUnique.mockResolvedValue(mockCredit);
      mockPrismaService.creditTransaction.create.mockResolvedValue({ id: 'tx-1' });

      await service.withdraw('agent-1', { amount: 100 });

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should use transaction for transfer', async () => {
      const senderCredit = {
        agentId: 'agent-1',
        balance: 500,
        frozenBalance: 0,
        totalSpent: 0,
      };

      const receiverCredit = {
        agentId: 'agent-2',
        balance: 200,
        totalEarned: 200,
      };

      mockPrismaService.credit.findUnique
        .mockResolvedValueOnce(senderCredit)
        .mockResolvedValueOnce(receiverCredit);
      mockPrismaService.creditTransaction.create.mockResolvedValue({ id: 'tx-1' });

      await service.transfer('agent-1', {
        toAgentId: 'agent-2',
        amount: 100,
      });

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should use transaction for reward', async () => {
      const mockCredit = {
        agentId: 'agent-1',
        balance: 500,
        totalEarned: 1000,
      };

      mockPrismaService.credit.findUnique.mockResolvedValue(mockCredit);
      mockPrismaService.creditTransaction.create.mockResolvedValue({ id: 'tx-1' });

      await service.rewardAgent('agent-1', 100, 'task-1');

      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should handle zero balance withdrawal attempt', async () => {
      const mockCredit = {
        agentId: 'agent-1',
        balance: 0,
        frozenBalance: 0,
      };

      mockPrismaService.credit.findUnique.mockResolvedValue(mockCredit);

      await expect(
        service.withdraw('agent-1', { amount: 1 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle maximum safe integer amounts', async () => {
      const mockCredit = {
        agentId: 'agent-1',
        balance: Number.MAX_SAFE_INTEGER,
        totalEarned: Number.MAX_SAFE_INTEGER,
      };

      mockPrismaService.credit.findUnique.mockResolvedValue(mockCredit);
      mockPrismaService.creditTransaction.create.mockResolvedValue({ id: 'tx-1' });

      const result = await service.deposit('agent-1', { amount: 1 });

      expect(result.newBalance).toBeGreaterThan(Number.MAX_SAFE_INTEGER);
    });

    it('should handle concurrent balance checks in getBalance', async () => {
      const mockCredit = {
        agentId: 'agent-1',
        balance: 1000,
        frozenBalance: 200,
        totalEarned: 5000,
        totalSpent: 4000,
      };

      mockPrismaService.credit.findUnique.mockResolvedValue(mockCredit);

      const results = await Promise.all([
        service.getBalance('agent-1'),
        service.getBalance('agent-1'),
        service.getBalance('agent-1'),
      ]);

      results.forEach((result) => {
        expect(result.balance).toBe(1000);
      });
    });
  });
});
