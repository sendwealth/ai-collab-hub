import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';

describe('TasksService', () => {
  let service: TasksService;
  let prisma: PrismaService;

  const mockPrismaService = {
    task: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    bid: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    agent: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn((fn) => fn(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a task successfully', async () => {
      const createDto = {
        title: 'Test Task',
        description: 'Test Description',
        category: 'testing',
        reward: { credits: 100 },
      };

      const mockAgent = {
        id: 'creator-id',
        name: 'Test Agent',
        trustScore: 50,
      };

      const mockTask = {
        id: 'task-id',
        ...createDto,
        creatorId: 'creator-id',
        status: 'open',
        createdAt: new Date(),
      };

      mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);
      mockPrismaService.task.create.mockResolvedValue(mockTask);

      const result = await service.create('creator-id', createDto);

      expect(result).toEqual(mockTask);
      expect(prisma.task.create).toHaveBeenCalledWith({
        data: {
          ...createDto,
          creatorId: 'creator-id',
          status: 'open',
        },
        include: {
          creator: true,
        },
      });
    });

    it('should throw NotFoundException if creator not found', async () => {
      mockPrismaService.agent.findUnique.mockResolvedValue(null);

      await expect(
        service.create('invalid-id', { title: 'Test' })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return all tasks with pagination', async () => {
      const mockTasks = [
        { id: 'task-1', title: 'Task 1' },
        { id: 'task-2', title: 'Task 2' },
      ];

      mockPrismaService.task.findMany.mockResolvedValue(mockTasks);

      const result = await service.findAll({});

      expect(result).toHaveLength(2);
      expect(prisma.task.findMany).toHaveBeenCalled();
    });

    it('should filter tasks by status', async () => {
      const mockTasks = [{ id: 'task-1', status: 'open' }];

      mockPrismaService.task.findMany.mockResolvedValue(mockTasks);

      const result = await service.findAll({ status: 'open' });

      expect(result).toHaveLength(1);
      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'open' },
        })
      );
    });

    it('should filter tasks by category', async () => {
      const mockTasks = [{ id: 'task-1', category: 'development' }];

      mockPrismaService.task.findMany.mockResolvedValue(mockTasks);

      const result = await service.findAll({ category: 'development' });

      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return a task by id', async () => {
      const mockTask = {
        id: 'task-id',
        title: 'Test Task',
        creator: { name: 'Creator' },
        bids: [],
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);

      const result = await service.findOne('task-id');

      expect(result).toEqual(mockTask);
      expect(prisma.task.findUnique).toHaveBeenCalledWith({
        where: { id: 'task-id' },
        include: {
          creator: true,
          assignee: true,
          bids: {
            include: {
              agent: true,
            },
          },
        },
      });
    });

    it('should throw NotFoundException if task not found', async () => {
      mockPrismaService.task.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('bidTask', () => {
    it('should create a bid successfully', async () => {
      const bidDto = {
        proposal: 'I can do this',
        estimatedTime: 3600,
        estimatedCost: 100,
      };

      const mockTask = {
        id: 'task-id',
        status: 'open',
        creatorId: 'creator-id',
      };

      const mockAgent = {
        id: 'agent-id',
        trustScore: 50,
      };

      const mockBid = {
        id: 'bid-id',
        taskId: 'task-id',
        agentId: 'agent-id',
        ...bidDto,
        status: 'pending',
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);
      mockPrismaService.bid.create.mockResolvedValue(mockBid);

      const result = await service.bidTask('task-id', 'agent-id', bidDto);

      expect(result).toHaveProperty('bidId');
      expect(prisma.bid.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if task not found', async () => {
      mockPrismaService.task.findUnique.mockResolvedValue(null);

      await expect(
        service.bidTask('invalid-id', 'agent-id', { proposal: 'Test' })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if task is not open', async () => {
      const mockTask = {
        id: 'task-id',
        status: 'assigned',
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);

      await expect(
        service.bidTask('task-id', 'agent-id', { proposal: 'Test' })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if agent bids on own task', async () => {
      const mockTask = {
        id: 'task-id',
        status: 'open',
        creatorId: 'agent-id',
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);

      await expect(
        service.bidTask('task-id', 'agent-id', { proposal: 'Test' })
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('acceptBid', () => {
    it('should accept a bid successfully', async () => {
      const mockTask = {
        id: 'task-id',
        creatorId: 'creator-id',
        status: 'open',
      };

      const mockBid = {
        id: 'bid-id',
        taskId: 'task-id',
        agentId: 'agent-id',
        status: 'pending',
      };

      const mockAgent = {
        id: 'agent-id',
        trustScore: 50,
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockPrismaService.bid.findUnique.mockResolvedValue(mockBid);
      mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);
      mockPrismaService.task.update.mockResolvedValue({
        ...mockTask,
        status: 'assigned',
        assigneeId: 'agent-id',
      });
      mockPrismaService.bid.update.mockResolvedValue({
        ...mockBid,
        status: 'accepted',
      });

      const result = await service.acceptBid(
        'creator-id',
        'task-id',
        'bid-id'
      );

      expect(result.task.status).toBe('assigned');
      expect(result.bid.status).toBe('accepted');
    });

    it('should throw ForbiddenException if not task creator', async () => {
      const mockTask = {
        id: 'task-id',
        creatorId: 'other-id',
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);

      await expect(
        service.acceptBid('wrong-creator', 'task-id', 'bid-id')
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('submitTask', () => {
    it('should submit task result successfully', async () => {
      const submitDto = {
        result: { code: 'completed', files: ['test.js'] },
      };

      const mockTask = {
        id: 'task-id',
        assigneeId: 'agent-id',
        status: 'assigned',
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockPrismaService.task.update.mockResolvedValue({
        ...mockTask,
        status: 'reviewing',
        result: submitDto.result,
      });

      const result = await service.submitTask(
        'task-id',
        'agent-id',
        submitDto
      );

      expect(result.task.status).toBe('reviewing');
    });

    it('should throw ForbiddenException if not assignee', async () => {
      const mockTask = {
        id: 'task-id',
        assigneeId: 'other-agent',
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);

      await expect(
        service.submitTask('task-id', 'wrong-agent', { result: {} })
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('completeTask', () => {
    it('should complete task with rating', async () => {
      const completeDto = {
        rating: 5,
      };

      const mockTask = {
        id: 'task-id',
        creatorId: 'creator-id',
        assigneeId: 'agent-id',
        status: 'reviewing',
        reward: { credits: 100 },
      };

      const mockAgent = {
        id: 'agent-id',
        trustScore: 50,
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);
      mockPrismaService.task.update.mockResolvedValue({
        ...mockTask,
        status: 'completed',
        rating: 5,
      });
      mockPrismaService.agent.update.mockResolvedValue({
        ...mockAgent,
        trustScore: 60,
      });

      const result = await service.completeTask(
        'task-id',
        'creator-id',
        completeDto
      );

      expect(result.task.status).toBe('completed');
    });

    it('should throw ForbiddenException if not task creator', async () => {
      const mockTask = {
        id: 'task-id',
        creatorId: 'other-id',
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);

      await expect(
        service.completeTask('task-id', 'wrong-creator', { rating: 5 })
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if task not in reviewing status', async () => {
      const mockTask = {
        id: 'task-id',
        creatorId: 'creator-id',
        status: 'assigned',
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);

      await expect(
        service.completeTask('task-id', 'creator-id', { rating: 5 })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getMyTasks', () => {
    it('should return tasks created by agent', async () => {
      const mockTasks = [
        { id: 'task-1', title: 'Task 1' },
        { id: 'task-2', title: 'Task 2' },
      ];

      mockPrismaService.task.findMany.mockResolvedValue(mockTasks);

      const result = await service.getMyTasks('agent-id', { role: 'creator' });

      expect(result.total).toBe(2);
      expect(result.tasks).toHaveLength(2);
    });

    it('should return tasks assigned to agent', async () => {
      const mockTasks = [{ id: 'task-1', assigneeId: 'agent-id' }];

      mockPrismaService.task.findMany.mockResolvedValue(mockTasks);

      const result = await service.getMyTasks('agent-id', { role: 'assignee' });

      expect(result.total).toBe(1);
    });

    it('should filter tasks by status', async () => {
      const mockTasks = [{ id: 'task-1', status: 'completed' }];

      mockPrismaService.task.findMany.mockResolvedValue(mockTasks);

      const result = await service.getMyTasks('agent-id', {
        status: 'completed',
      });

      expect(result.total).toBe(1);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockPrismaService.task.findUnique.mockRejectedValue(
        new Error('Database error')
      );

      await expect(service.findOne('task-id')).rejects.toThrow();
    });

    it('should validate input data', async () => {
      const invalidDto = {
        title: '',
        description: '',
      };

      await expect(service.create('creator-id', invalidDto)).rejects.toThrow();
    });

    it('should handle concurrent bids', async () => {
      const mockTask = {
        id: 'task-id',
        status: 'open',
        creatorId: 'creator-id',
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockPrismaService.bid.create.mockResolvedValue({ id: 'bid-id' });

      // Simulate concurrent bids
      const bids = await Promise.all([
        service.bidTask('task-id', 'agent-1', { proposal: 'Bid 1' }),
        service.bidTask('task-id', 'agent-2', { proposal: 'Bid 2' }),
      ]);

      expect(bids).toHaveLength(2);
    });
  });
});
