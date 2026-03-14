import { Test, TestingModule } from '@nestjs/testing';
import { CreditsController } from './credits.controller';
import { CreditsService } from './credits.service';
import { AgentAuthGuard } from '../auth/guards/agent-auth.guard';
import { TransactionType } from './dto/create-credit.dto';

describe('CreditsController', () => {
  let controller: CreditsController;
  let service: any;

  const mockCreditsService = {
    getBalance: jest.fn(),
    deposit: jest.fn(),
    withdraw: jest.fn(),
    transfer: jest.fn(),
    getTransactionHistory: jest.fn(),
  };

  const mockAgentAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CreditsController],
      providers: [
        {
          provide: CreditsService,
          useValue: mockCreditsService,
        },
        {
          provide: AgentAuthGuard,
          useValue: mockAgentAuthGuard,
        },
      ],
    })
      .overrideGuard(AgentAuthGuard)
      .useValue(mockAgentAuthGuard)
      .compile();

    controller = module.get<CreditsController>(CreditsController);
    service = module.get(CreditsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getBalance', () => {
    it('should return balance for authenticated agent', async () => {
      const mockBalance = {
        balance: 1000,
        frozenBalance: 200,
        availableBalance: 800,
        totalEarned: 5000,
        totalSpent: 4000,
      };

      mockCreditsService.getBalance.mockResolvedValue(mockBalance);

      const result = await controller.getBalance('agent-1');

      expect(result).toEqual(mockBalance);
      expect(service.getBalance).toHaveBeenCalledWith('agent-1');
    });

    it('should handle zero balance', async () => {
      const mockBalance = {
        balance: 0,
        frozenBalance: 0,
        availableBalance: 0,
        totalEarned: 0,
        totalSpent: 0,
      };

      mockCreditsService.getBalance.mockResolvedValue(mockBalance);

      const result = await controller.getBalance('agent-new');

      expect(result.balance).toBe(0);
      expect(result.availableBalance).toBe(0);
    });

    it('should pass agent id from decorator', async () => {
      const mockBalance = {
        balance: 500,
        frozenBalance: 0,
        availableBalance: 500,
        totalEarned: 500,
        totalSpent: 0,
      };

      mockCreditsService.getBalance.mockResolvedValue(mockBalance);

      await controller.getBalance('test-agent-id');

      expect(service.getBalance).toHaveBeenCalledWith('test-agent-id');
    });
  });

  describe('deposit', () => {
    it('should deposit credits successfully', async () => {
      const depositDto = {
        amount: 100,
        description: 'Test deposit',
      };

      const mockResult = {
        transactionId: 'tx-1',
        amount: 100,
        newBalance: 600,
      };

      mockCreditsService.deposit.mockResolvedValue(mockResult);

      const result = await controller.deposit('agent-1', depositDto);

      expect(result).toEqual(mockResult);
      expect(service.deposit).toHaveBeenCalledWith('agent-1', depositDto);
    });

    it('should deposit without description', async () => {
      const depositDto = {
        amount: 200,
      };

      const mockResult = {
        transactionId: 'tx-2',
        amount: 200,
        newBalance: 700,
      };

      mockCreditsService.deposit.mockResolvedValue(mockResult);

      const result = await controller.deposit('agent-1', depositDto);

      expect(result).toEqual(mockResult);
    });

    it('should handle large deposit amount', async () => {
      const depositDto = {
        amount: 1000000,
        description: 'Large deposit',
      };

      const mockResult = {
        transactionId: 'tx-3',
        amount: 1000000,
        newBalance: 1000500,
      };

      mockCreditsService.deposit.mockResolvedValue(mockResult);

      const result = await controller.deposit('agent-1', depositDto);

      expect(result.amount).toBe(1000000);
    });

    it('should pass agent id from decorator', async () => {
      const depositDto = { amount: 100 };

      mockCreditsService.deposit.mockResolvedValue({ transactionId: 'tx-1' });

      await controller.deposit('custom-agent-id', depositDto);

      expect(service.deposit).toHaveBeenCalledWith('custom-agent-id', depositDto);
    });
  });

  describe('withdraw', () => {
    it('should withdraw credits successfully', async () => {
      const withdrawDto = {
        amount: 50,
        description: 'Test withdraw',
      };

      const mockResult = {
        transactionId: 'tx-1',
        amount: 50,
        newBalance: 450,
      };

      mockCreditsService.withdraw.mockResolvedValue(mockResult);

      const result = await controller.withdraw('agent-1', withdrawDto);

      expect(result).toEqual(mockResult);
      expect(service.withdraw).toHaveBeenCalledWith('agent-1', withdrawDto);
    });

    it('should withdraw without description', async () => {
      const withdrawDto = {
        amount: 100,
      };

      const mockResult = {
        transactionId: 'tx-2',
        amount: 100,
        newBalance: 400,
      };

      mockCreditsService.withdraw.mockResolvedValue(mockResult);

      const result = await controller.withdraw('agent-1', withdrawDto);

      expect(result).toEqual(mockResult);
    });

    it('should handle withdrawal of available balance', async () => {
      const withdrawDto = {
        amount: 500,
      };

      const mockResult = {
        transactionId: 'tx-3',
        amount: 500,
        newBalance: 0,
      };

      mockCreditsService.withdraw.mockResolvedValue(mockResult);

      const result = await controller.withdraw('agent-1', withdrawDto);

      expect(result.newBalance).toBe(0);
    });

    it('should pass agent id from decorator', async () => {
      const withdrawDto = { amount: 50 };

      mockCreditsService.withdraw.mockResolvedValue({ transactionId: 'tx-1' });

      await controller.withdraw('test-agent', withdrawDto);

      expect(service.withdraw).toHaveBeenCalledWith('test-agent', withdrawDto);
    });
  });

  describe('transfer', () => {
    it('should transfer credits successfully', async () => {
      const transferDto = {
        toAgentId: 'agent-2',
        amount: 100,
        description: 'Test transfer',
      };

      const mockResult = {
        transactionId: 'tx-1',
        amount: 100,
        senderNewBalance: 400,
        receiverNewBalance: 300,
      };

      mockCreditsService.transfer.mockResolvedValue(mockResult);

      const result = await controller.transfer('agent-1', transferDto);

      expect(result).toEqual(mockResult);
      expect(service.transfer).toHaveBeenCalledWith('agent-1', transferDto);
    });

    it('should transfer without description', async () => {
      const transferDto = {
        toAgentId: 'agent-2',
        amount: 50,
      };

      const mockResult = {
        transactionId: 'tx-2',
        amount: 50,
        senderNewBalance: 450,
        receiverNewBalance: 250,
      };

      mockCreditsService.transfer.mockResolvedValue(mockResult);

      const result = await controller.transfer('agent-1', transferDto);

      expect(result).toEqual(mockResult);
    });

    it('should handle transfer to different agents', async () => {
      const transferDto1 = {
        toAgentId: 'agent-2',
        amount: 100,
      };

      const transferDto2 = {
        toAgentId: 'agent-3',
        amount: 50,
      };

      mockCreditsService.transfer.mockResolvedValue({ transactionId: 'tx-1' });

      await controller.transfer('agent-1', transferDto1);
      await controller.transfer('agent-1', transferDto2);

      expect(service.transfer).toHaveBeenCalledTimes(2);
      expect(service.transfer).toHaveBeenNthCalledWith(1, 'agent-1', transferDto1);
      expect(service.transfer).toHaveBeenNthCalledWith(2, 'agent-1', transferDto2);
    });

    it('should pass fromAgentId from decorator', async () => {
      const transferDto = {
        toAgentId: 'agent-receiver',
        amount: 100,
      };

      mockCreditsService.transfer.mockResolvedValue({ transactionId: 'tx-1' });

      await controller.transfer('sender-agent', transferDto);

      expect(service.transfer).toHaveBeenCalledWith('sender-agent', transferDto);
    });
  });

  describe('getTransactionHistory', () => {
    it('should return transaction history with default pagination', async () => {
      const query = {};

      const mockResult = {
        transactions: [
          {
            id: 'tx-1',
            type: 'deposit',
            amount: 100,
            balance: 100,
            createdAt: new Date(),
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };

      mockCreditsService.getTransactionHistory.mockResolvedValue(mockResult);

      const result = await controller.getTransactionHistory('agent-1', query);

      expect(result).toEqual(mockResult);
      expect(service.getTransactionHistory).toHaveBeenCalledWith('agent-1', query);
    });

    it('should filter by transaction type', async () => {
      const query = {
        type: TransactionType.DEPOSIT,
      };

      const mockResult = {
        transactions: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      };

      mockCreditsService.getTransactionHistory.mockResolvedValue(mockResult);

      const result = await controller.getTransactionHistory('agent-1', query);

      expect(result).toEqual(mockResult);
      expect(service.getTransactionHistory).toHaveBeenCalledWith('agent-1', query);
    });

    it('should filter by date range', async () => {
      const query = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };

      const mockResult = {
        transactions: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      };

      mockCreditsService.getTransactionHistory.mockResolvedValue(mockResult);

      const result = await controller.getTransactionHistory('agent-1', query);

      expect(result).toEqual(mockResult);
    });

    it('should handle custom pagination', async () => {
      const query = {
        page: 2,
        limit: 10,
      };

      const mockResult = {
        transactions: [],
        total: 15,
        page: 2,
        limit: 10,
        totalPages: 2,
      };

      mockCreditsService.getTransactionHistory.mockResolvedValue(mockResult);

      const result = await controller.getTransactionHistory('agent-1', query);

      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
    });

    it('should return empty array for no transactions', async () => {
      const query = {};

      const mockResult = {
        transactions: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      };

      mockCreditsService.getTransactionHistory.mockResolvedValue(mockResult);

      const result = await controller.getTransactionHistory('agent-new', query);

      expect(result.transactions).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should combine multiple filters', async () => {
      const query = {
        type: TransactionType.TRANSFER,
        startDate: '2024-01-01',
        page: 1,
        limit: 50,
      };

      const mockResult = {
        transactions: [
          {
            id: 'tx-1',
            type: 'transfer',
            amount: -100,
          },
        ],
        total: 1,
        page: 1,
        limit: 50,
        totalPages: 1,
      };

      mockCreditsService.getTransactionHistory.mockResolvedValue(mockResult);

      const result = await controller.getTransactionHistory('agent-1', query);

      expect(result.transactions).toHaveLength(1);
      expect(service.getTransactionHistory).toHaveBeenCalledWith('agent-1', query);
    });

    it('should pass agent id from decorator', async () => {
      const query = {};

      mockCreditsService.getTransactionHistory.mockResolvedValue({
        transactions: [],
        total: 0,
      });

      await controller.getTransactionHistory('custom-agent', query);

      expect(service.getTransactionHistory).toHaveBeenCalledWith('custom-agent', query);
    });
  });

  describe('Guard integration', () => {
    it('should have AgentAuthGuard applied', () => {
      const guards = Reflect.getMetadata('__guards__', CreditsController);
      expect(guards).toBeDefined();
      expect(guards).toContain(AgentAuthGuard);
    });
  });

  describe('Error propagation', () => {
    it('should propagate service errors for deposit', async () => {
      const depositDto = { amount: 100 };

      mockCreditsService.deposit.mockRejectedValue(new Error('Service error'));

      await expect(controller.deposit('agent-1', depositDto)).rejects.toThrow(
        'Service error',
      );
    });

    it('should propagate service errors for withdraw', async () => {
      const withdrawDto = { amount: 100 };

      mockCreditsService.withdraw.mockRejectedValue(new Error('Insufficient balance'));

      await expect(controller.withdraw('agent-1', withdrawDto)).rejects.toThrow(
        'Insufficient balance',
      );
    });

    it('should propagate service errors for transfer', async () => {
      const transferDto = {
        toAgentId: 'agent-2',
        amount: 100,
      };

      mockCreditsService.transfer.mockRejectedValue(new Error('Transfer failed'));

      await expect(controller.transfer('agent-1', transferDto)).rejects.toThrow(
        'Transfer failed',
      );
    });

    it('should propagate service errors for getBalance', async () => {
      mockCreditsService.getBalance.mockRejectedValue(new Error('Database error'));

      await expect(controller.getBalance('agent-1')).rejects.toThrow('Database error');
    });

    it('should propagate service errors for getTransactionHistory', async () => {
      mockCreditsService.getTransactionHistory.mockRejectedValue(
        new Error('Query failed'),
      );

      await expect(
        controller.getTransactionHistory('agent-1', {}),
      ).rejects.toThrow('Query failed');
    });
  });
});
