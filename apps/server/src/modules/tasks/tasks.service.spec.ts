import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';

describe('TasksService', () => {
  let service: TasksService;

  const mockPrismaService = {
    task: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    bid: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    agent: {
      update: jest.fn(),
    },
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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTask', () => {
    it('should create a task successfully', async () => {
      const creatorId = 'creator-id';
      const createTaskDto = {
        title: 'Test Task',
        description: 'Test description',
        category: 'code-review',
        reward: { credits: 50 },
      };

      mockPrismaService.task.create.mockResolvedValue({
        id: 'task-id',
        ...createTaskDto,
        createdById: creatorId,
        status: 'open',
      });

      const result = await service.createTask(creatorId, createTaskDto);

      expect(result).toHaveProperty('taskId');
      expect(result.task.title).toBe(createTaskDto.title);
    });

    it('should set default status to open', async () => {
      const createTaskDto = {
        title: 'Test Task',
      };

      mockPrismaService.task.create.mockResolvedValue({
        id: 'task-id',
        ...createTaskDto,
        status: 'open',
      });

      const result = await service.createTask('creator-id', createTaskDto);

      expect(result.task.status).toBe('open');
    });

    it('should accept all task types', async () => {
      const types: Array<'independent' | 'collaborative' | 'workflow'> = ['independent', 'collaborative', 'workflow'];

      for (const type of types) {
        mockPrismaService.task.create.mockResolvedValue({
          id: 'task-id',
          title: 'Test',
          type,
        });

        const result = await service.createTask('creator-id', { title: 'Test', type });
        expect(result.task.type).toBe(type);
      }
    });
  });

  describe('getTasks', () => {
    it('should return tasks with filters', async () => {
      const mockTasks = [
        {
          id: 'task-1',
          title: 'Task 1',
          status: 'open',
          bids: [],
          _count: { bids: 0 },
        },
      ];

      mockPrismaService.task.findMany.mockResolvedValue(mockTasks);
      mockPrismaService.task.count.mockResolvedValue(1);

      const result = await service.getTasks({ status: 'open' });

      expect(result.total).toBe(1);
      expect(result.tasks).toHaveLength(1);
    });

    it('should support pagination', async () => {
      mockPrismaService.task.findMany.mockResolvedValue([]);
      mockPrismaService.task.count.mockResolvedValue(0);

      await service.getTasks({ limit: 10, offset: 20 });

      expect(mockPrismaService.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 20,
        }),
      );
    });

    it('should include bid count', async () => {
      const mockTasks = [
        {
          id: 'task-1',
          title: 'Task 1',
          bids: [],
          _count: { bids: 5 },
        },
      ];

      mockPrismaService.task.findMany.mockResolvedValue(mockTasks);
      mockPrismaService.task.count.mockResolvedValue(1);

      const result = await service.getTasks({});

      expect(result.tasks[0]).toHaveProperty('bidCount', 5);
    });
  });

  describe('bidTask', () => {
    it('should create a bid successfully', async () => {
      const taskId = 'task-id';
      const agentId = 'agent-id';
      const bidDto = {
        proposal: 'I can do this',
        estimatedTime: 3600,
      };

      mockPrismaService.task.findUnique.mockResolvedValue({
        id: taskId,
        status: 'open',
      });
      mockPrismaService.bid.findFirst.mockResolvedValue(null);
      mockPrismaService.bid.create.mockResolvedValue({
        id: 'bid-id',
        taskId,
        agentId,
        ...bidDto,
        status: 'pending',
      });

      const result = await service.bidTask(agentId, taskId, bidDto);

      expect(result).toHaveProperty('bidId');
      expect(result.bid.proposal).toBe(bidDto.proposal);
    });

    it('should throw NotFoundException if task not found', async () => {
      mockPrismaService.task.findUnique.mockResolvedValue(null);

      await expect(
        service.bidTask('agent-id', 'non-existent', { proposal: 'test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if task is not open', async () => {
      mockPrismaService.task.findUnique.mockResolvedValue({
        id: 'task-id',
        status: 'assigned',
      });

      await expect(
        service.bidTask('agent-id', 'task-id', { proposal: 'test' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if agent already bid', async () => {
      mockPrismaService.task.findUnique.mockResolvedValue({
        id: 'task-id',
        status: 'open',
      });
      mockPrismaService.bid.findFirst.mockResolvedValue({
        id: 'existing-bid',
      });

      await expect(
        service.bidTask('agent-id', 'task-id', { proposal: 'test' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('acceptBid', () => {
    it('should accept a bid and assign task', async () => {
      const taskId = 'task-id';
      const bidId = 'bid-id';
      const creatorId = 'creator-id';
      const agentId = 'agent-id';

      mockPrismaService.task.findUnique.mockResolvedValue({
        id: taskId,
        createdById: creatorId,
        status: 'open',
      });
      mockPrismaService.bid.findUnique.mockResolvedValue({
        id: bidId,
        taskId,
        agentId,
      });
      mockPrismaService.task.update.mockResolvedValue({
        id: taskId,
        status: 'assigned',
        assigneeId: agentId,
      });
      mockPrismaService.bid.update.mockResolvedValue({});
      mockPrismaService.bid.updateMany.mockResolvedValue({});

      const result = await service.acceptBid(creatorId, taskId, bidId);

      expect(result.task.status).toBe('assigned');
    });

    it('should throw ForbiddenException if not creator', async () => {
      mockPrismaService.task.findUnique.mockResolvedValue({
        id: 'task-id',
        createdById: 'other-creator',
        status: 'open',
      });

      await expect(
        service.acceptBid('wrong-creator', 'task-id', 'bid-id'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject other pending bids', async () => {
      const taskId = 'task-id';
      const bidId = 'bid-id';

      mockPrismaService.task.findUnique.mockResolvedValue({
        id: taskId,
        createdById: 'creator-id',
        status: 'open',
      });
      mockPrismaService.bid.findUnique.mockResolvedValue({
        id: bidId,
        taskId,
        agentId: 'agent-id',
      });
      mockPrismaService.task.update.mockResolvedValue({});
      mockPrismaService.bid.update.mockResolvedValue({});
      mockPrismaService.bid.updateMany.mockResolvedValue({ count: 2 });

      await service.acceptBid('creator-id', taskId, bidId);

      expect(mockPrismaService.bid.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'rejected' },
        }),
      );
    });
  });

  describe('submitTask', () => {
    it('should submit task result successfully', async () => {
      const taskId = 'task-id';
      const agentId = 'agent-id';
      const submitDto = {
        result: { review: 'Good code' },
      };

      mockPrismaService.task.findUnique.mockResolvedValue({
        id: taskId,
        assigneeId: agentId,
        status: 'assigned',
      });
      mockPrismaService.task.update.mockResolvedValue({
        id: taskId,
        status: 'reviewing',
        result: submitDto.result,
      });

      const result = await service.submitTask(agentId, taskId, submitDto);

      expect(result.task.status).toBe('reviewing');
    });

    it('should throw ForbiddenException if not assignee', async () => {
      mockPrismaService.task.findUnique.mockResolvedValue({
        id: 'task-id',
        assigneeId: 'other-agent',
        status: 'assigned',
      });

      await expect(
        service.submitTask('wrong-agent', 'task-id', { result: {} }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException if task not assigned', async () => {
      mockPrismaService.task.findUnique.mockResolvedValue({
        id: 'task-id',
        assigneeId: 'agent-id',
        status: 'open',
      });

      await expect(
        service.submitTask('agent-id', 'task-id', { result: {} }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('completeTask', () => {
    it('should complete task with rating', async () => {
      const taskId = 'task-id';
      const creatorId = 'creator-id';
      const rating = 5;

      mockPrismaService.task.findUnique.mockResolvedValue({
        id: taskId,
        createdById: creatorId,
        status: 'reviewing',
        assigneeId: 'agent-id',
        result: {},
      });
      mockPrismaService.task.update.mockResolvedValue({
        id: taskId,
        status: 'completed',
        result: { rating },
      });
      mockPrismaService.task.findMany.mockResolvedValue([]);
      mockPrismaService.agent.update.mockResolvedValue({});

      const result = await service.completeTask(creatorId, taskId, { rating });

      expect(result.task.status).toBe('completed');
    });

    it('should update agent trust score', async () => {
      const taskId = 'task-id';
      const assigneeId = 'agent-id';

      mockPrismaService.task.findUnique.mockResolvedValue({
        id: taskId,
        createdById: 'creator-id',
        status: 'reviewing',
        assigneeId,
        result: { rating: 5 },
      });
      mockPrismaService.task.update.mockResolvedValue({
        id: taskId,
        status: 'completed',
      });
      mockPrismaService.task.findMany.mockResolvedValue([
        { status: 'completed', result: { rating: 5 } },
      ]);
      mockPrismaService.agent.update.mockResolvedValue({});

      await service.completeTask('creator-id', taskId, { rating: 5 });

      expect(mockPrismaService.agent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: assigneeId },
        }),
      );
    });

    it('should throw ForbiddenException if not creator', async () => {
      mockPrismaService.task.findUnique.mockResolvedValue({
        id: 'task-id',
        createdById: 'other-creator',
        status: 'reviewing',
      });

      await expect(
        service.completeTask('wrong-creator', 'task-id', { rating: 5 }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getMyTasks', () => {
    it('should return tasks created by or assigned to agent', async () => {
      const agentId = 'agent-id';
      const mockTasks = [
        { id: 'task-1', createdById: agentId },
        { id: 'task-2', assigneeId: agentId },
      ];

      mockPrismaService.task.findMany.mockResolvedValue(mockTasks);

      const result = await service.getMyTasks(agentId);

      expect(result.total).toBe(2);
      expect(result.tasks).toEqual(mockTasks);
    });

    it('should filter by status', async () => {
      mockPrismaService.task.findMany.mockResolvedValue([]);

      await service.getMyTasks('agent-id', { status: 'open' });

      expect(mockPrismaService.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'open',
          }),
        }),
      );
    });
  });
});
