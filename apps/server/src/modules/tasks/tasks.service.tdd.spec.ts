/**
 * TDD Test Suite for TasksService
 * Comprehensive test coverage for all service methods
 * 
 * Test Coverage Goals:
 * - createTask: Success, validation, error handling
 * - getTasks: Pagination, filtering, caching
 * - getTask: Success, not found, caching
 * - bidTask: Success, validation, conflict handling
 * - acceptBid: Success, authorization, validation
 * - submitTask: Success, authorization, validation
 * - completeTask: Success, authorization, trust score update
 * - getMyTasks: Filtering, pagination
 */

import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { CacheService } from '../cache';
import { 
  NotFoundException, 
  ConflictException,
  BadRequestException 
} from '@nestjs/common';
import { CreateTaskDto, BidTaskDto, SubmitTaskDto, CompleteTaskDto } from './dto';

describe('TasksService (TDD)', () => {
  let service: TasksService;
  let prisma: any;
  let cache: any;

  // Mock Prisma Service
  const mockPrismaService = {
    task: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
    bid: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    agent: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn((fn) => fn(mockPrismaService)),
  };

  // Mock Cache Service
  const mockCacheService = {
    getOrSet: jest.fn((key, fn, ttl) => fn()),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    invalidate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    prisma = module.get(PrismaService);
    cache = module.get(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // CREATE TASK TESTS
  // ============================================
  describe('createTask', () => {
    const creatorId = 'creator-123';
    const createTaskDto: CreateTaskDto = {
      title: 'Test Task',
      description: 'Test Description',
      category: 'testing',
      type: 'independent',
      reward: { credits: 100 },
      requirements: { skills: ['jest', 'typescript'] },
      deadline: '2025-12-31T23:59:59.000Z',
    };

    it('should create a task successfully with all fields', async () => {
      const mockTask = {
        id: 'task-123',
        title: createTaskDto.title,
        description: createTaskDto.description,
        category: createTaskDto.category,
        type: createTaskDto.type,
        requirements: JSON.stringify(createTaskDto.requirements),
        reward: JSON.stringify(createTaskDto.reward),
        deadline: new Date(createTaskDto.deadline!),
        createdById: creatorId,
        status: 'open',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.task.create.mockResolvedValue(mockTask);

      const result = await service.createTask(creatorId, createTaskDto);

      expect(result).toHaveProperty('taskId', 'task-123');
      expect(result.task.title).toBe(createTaskDto.title);
      expect(result.task.description).toBe(createTaskDto.description);
      expect(result.task.category).toBe(createTaskDto.category);
      expect(result.task.requirements).toEqual(createTaskDto.requirements);
      expect(result.task.reward).toEqual(createTaskDto.reward);
      expect(result.task.status).toBe('open');

      expect(prisma.task.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: createTaskDto.title,
          description: createTaskDto.description,
          category: createTaskDto.category,
          type: createTaskDto.type,
          createdById: creatorId,
        }),
      });

      expect(cache.invalidate).toHaveBeenCalledWith('tasks:*');
    });

    it('should create a task with minimal required fields', async () => {
      const minimalDto: CreateTaskDto = {
        title: 'Minimal Task',
      };

      const mockTask = {
        id: 'task-124',
        title: minimalDto.title,
        description: null,
        category: null,
        type: 'independent',
        requirements: null,
        reward: JSON.stringify({ credits: 10 }),
        deadline: null,
        createdById: creatorId,
        status: 'open',
        createdAt: new Date(),
      };

      mockPrismaService.task.create.mockResolvedValue(mockTask);

      const result = await service.createTask(creatorId, minimalDto);

      expect(result.taskId).toBe('task-124');
      expect(result.task.title).toBe(minimalDto.title);
      expect(result.task.reward).toEqual({ credits: 10 });
    });

    it('should create a collaborative task', async () => {
      const collabDto: CreateTaskDto = {
        title: 'Collaborative Task',
        type: 'collaborative',
        requirements: { maxAgents: 5 },
      };

      const mockTask = {
        id: 'task-125',
        ...collabDto,
        requirements: JSON.stringify(collabDto.requirements),
        reward: JSON.stringify({ credits: 10 }),
        createdById: creatorId,
        status: 'open',
      };

      mockPrismaService.task.create.mockResolvedValue(mockTask);

      const result = await service.createTask(creatorId, collabDto);

      expect(result.task.type).toBe('collaborative');
    });

    it('should create a workflow task', async () => {
      const workflowDto: CreateTaskDto = {
        title: 'Workflow Task',
        type: 'workflow',
        description: 'Multi-step workflow',
      };

      const mockTask = {
        id: 'task-126',
        ...workflowDto,
        requirements: null,
        reward: JSON.stringify({ credits: 10 }),
        createdById: creatorId,
        status: 'open',
      };

      mockPrismaService.task.create.mockResolvedValue(mockTask);

      const result = await service.createTask(creatorId, workflowDto);

      expect(result.task.type).toBe('workflow');
    });

    it('should handle database errors gracefully', async () => {
      mockPrismaService.task.create.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(
        service.createTask(creatorId, createTaskDto)
      ).rejects.toThrow('Database connection failed');
    });

    it('should clear cache after task creation', async () => {
      const mockTask = {
        id: 'task-127',
        title: 'Test',
        createdById: creatorId,
        status: 'open',
      };

      mockPrismaService.task.create.mockResolvedValue(mockTask);

      await service.createTask(creatorId, { title: 'Test' });

      expect(cache.invalidate).toHaveBeenCalledWith('tasks:*');
    });
  });

  // ============================================
  // GET TASKS TESTS
  // ============================================
  describe('getTasks', () => {
    it('should return all tasks with default pagination', async () => {
      const mockTasks = [
        {
          id: 'task-1',
          title: 'Task 1',
          description: 'Description 1',
          type: 'independent',
          category: 'development',
          requirements: null,
          reward: JSON.stringify({ credits: 10 }),
          status: 'open',
          createdAt: new Date(),
          deadline: null,
          creator: { id: 'agent-1', name: 'Agent 1', trustScore: 50 },
          assignee: null,
          _count: { bids: 2 },
        },
        {
          id: 'task-2',
          title: 'Task 2',
          description: 'Description 2',
          type: 'collaborative',
          category: 'testing',
          requirements: null,
          reward: JSON.stringify({ credits: 20 }),
          status: 'open',
          createdAt: new Date(),
          deadline: null,
          creator: { id: 'agent-2', name: 'Agent 2', trustScore: 60 },
          assignee: null,
          _count: { bids: 1 },
        },
      ];

      mockPrismaService.task.findMany.mockResolvedValue(mockTasks);
      mockPrismaService.task.count.mockResolvedValue(2);
      mockCacheService.getOrSet.mockImplementation((key, fn) => fn());

      const result = await service.getTasks({});

      expect(result.total).toBe(2);
      expect(result.tasks).toHaveLength(2);
      expect(result.tasks[0].bidCount).toBe(2);
      expect(result.tasks[1].bidCount).toBe(1);
    });

    it('should filter tasks by status', async () => {
      const mockTasks = [
        {
          id: 'task-1',
          status: 'open',
          requirements: null,
          reward: JSON.stringify({ credits: 10 }),
          creator: { id: 'agent-1', name: 'Agent 1', trustScore: 50 },
          assignee: null,
          _count: { bids: 1 },
        },
      ];

      mockPrismaService.task.findMany.mockResolvedValue(mockTasks);
      mockPrismaService.task.count.mockResolvedValue(1);
      mockCacheService.getOrSet.mockImplementation((key, fn) => fn());

      const result = await service.getTasks({ status: 'open' });

      expect(result.total).toBe(1);
      expect(result.tasks[0].status).toBe('open');
      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'open' },
        })
      );
    });

    it('should filter tasks by category', async () => {
      const mockTasks = [
        {
          id: 'task-1',
          category: 'development',
          requirements: null,
          reward: JSON.stringify({ credits: 10 }),
          creator: { id: 'agent-1', name: 'Agent 1', trustScore: 50 },
          assignee: null,
          _count: { bids: 1 },
        },
      ];

      mockPrismaService.task.findMany.mockResolvedValue(mockTasks);
      mockPrismaService.task.count.mockResolvedValue(1);
      mockCacheService.getOrSet.mockImplementation((key, fn) => fn());

      const result = await service.getTasks({ category: 'development' });

      expect(result.total).toBe(1);
      expect(result.tasks[0].category).toBe('development');
    });

    it('should filter tasks by type', async () => {
      const mockTasks = [
        {
          id: 'task-1',
          type: 'workflow',
          requirements: null,
          reward: JSON.stringify({ credits: 10 }),
          creator: { id: 'agent-1', name: 'Agent 1', trustScore: 50 },
          assignee: null,
          _count: { bids: 1 },
        },
      ];

      mockPrismaService.task.findMany.mockResolvedValue(mockTasks);
      mockPrismaService.task.count.mockResolvedValue(1);
      mockCacheService.getOrSet.mockImplementation((key, fn) => fn());

      const result = await service.getTasks({ type: 'workflow' });

      expect(result.total).toBe(1);
      expect(result.tasks[0].type).toBe('workflow');
    });

    it('should apply multiple filters', async () => {
      const mockTasks = [
        {
          id: 'task-1',
          status: 'open',
          category: 'development',
          type: 'independent',
          requirements: null,
          reward: JSON.stringify({ credits: 10 }),
          creator: { id: 'agent-1', name: 'Agent 1', trustScore: 50 },
          assignee: null,
          _count: { bids: 1 },
        },
      ];

      mockPrismaService.task.findMany.mockResolvedValue(mockTasks);
      mockPrismaService.task.count.mockResolvedValue(1);
      mockCacheService.getOrSet.mockImplementation((key, fn) => fn());

      const result = await service.getTasks({
        status: 'open',
        category: 'development',
        type: 'independent',
      });

      expect(result.total).toBe(1);
      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: 'open',
            category: 'development',
            type: 'independent',
          },
        })
      );
    });

    it('should support custom pagination', async () => {
      mockPrismaService.task.findMany.mockResolvedValue([]);
      mockPrismaService.task.count.mockResolvedValue(0);
      mockCacheService.getOrSet.mockImplementation((key, fn) => fn());

      await service.getTasks({ limit: 10, offset: 20 });

      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 20,
        })
      );
    });

    it('should use default pagination values', async () => {
      mockPrismaService.task.findMany.mockResolvedValue([]);
      mockPrismaService.task.count.mockResolvedValue(0);
      mockCacheService.getOrSet.mockImplementation((key, fn) => fn());

      await service.getTasks({});

      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
          skip: 0,
        })
      );
    });

    it('should use cache with correct TTL', async () => {
      mockPrismaService.task.findMany.mockResolvedValue([]);
      mockPrismaService.task.count.mockResolvedValue(0);

      await service.getTasks({});

      expect(cache.getOrSet).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Function),
        180
      );
    });

    it('should return tasks ordered by createdAt descending', async () => {
      mockPrismaService.task.findMany.mockResolvedValue([]);
      mockPrismaService.task.count.mockResolvedValue(0);
      mockCacheService.getOrSet.mockImplementation((key, fn) => fn());

      await service.getTasks({});

      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      );
    });
  });

  // ============================================
  // GET TASK (SINGLE) TESTS
  // ============================================
  describe('getTask', () => {
    it('should return a task with all details', async () => {
      const mockTask = {
        id: 'task-123',
        title: 'Test Task',
        description: 'Test Description',
        type: 'independent',
        category: 'testing',
        requirements: JSON.stringify({ skills: ['jest'] }),
        reward: JSON.stringify({ credits: 100 }),
        result: null,
        status: 'open',
        createdAt: new Date(),
        updatedAt: new Date(),
        deadline: null,
        bids: [
          {
            id: 'bid-1',
            proposal: 'I can do this',
            estimatedTime: 3600,
            estimatedCost: 50,
            status: 'pending',
            createdAt: new Date(),
            agent: { id: 'agent-1', name: 'Agent 1', trustScore: 60 },
          },
        ],
        creator: { id: 'creator-1', name: 'Creator', trustScore: 70 },
        assignee: null,
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockCacheService.getOrSet.mockImplementation((key, fn) => fn());

      const result = await service.getTask('task-123');

      expect(result.id).toBe('task-123');
      expect(result.title).toBe('Test Task');
      expect(result.requirements).toEqual({ skills: ['jest'] });
      expect(result.reward).toEqual({ credits: 100 });
      expect(result.bids).toHaveLength(1);
      expect(result.bids[0].agent.name).toBe('Agent 1');
    });

    it('should throw NotFoundException if task not found', async () => {
      mockPrismaService.task.findUnique.mockResolvedValue(null);
      mockCacheService.getOrSet.mockImplementation((key, fn) => fn());

      await expect(service.getTask('invalid-id')).rejects.toThrow(NotFoundException);
    });

    it('should include assignee information when task is assigned', async () => {
      const mockTask = {
        id: 'task-123',
        title: 'Assigned Task',
        requirements: null,
        reward: JSON.stringify({ credits: 50 }),
        result: null,
        status: 'assigned',
        bids: [],
        creator: { id: 'creator-1', name: 'Creator', trustScore: 70 },
        assignee: { id: 'assignee-1', name: 'Assignee', trustScore: 80 },
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockCacheService.getOrSet.mockImplementation((key, fn) => fn());

      const result = await service.getTask('task-123');

      expect(result.assignee).toBeDefined();
      expect(result.assignee.name).toBe('Assignee');
    });

    it('should parse result JSON when task is completed', async () => {
      const mockTask = {
        id: 'task-123',
        title: 'Completed Task',
        requirements: null,
        reward: JSON.stringify({ credits: 50 }),
        result: JSON.stringify({ code: 'completed', rating: 5 }),
        status: 'completed',
        bids: [],
        creator: { id: 'creator-1', name: 'Creator', trustScore: 70 },
        assignee: { id: 'assignee-1', name: 'Assignee', trustScore: 80 },
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockCacheService.getOrSet.mockImplementation((key, fn) => fn());

      const result = await service.getTask('task-123');

      expect(result.result).toEqual({ code: 'completed', rating: 5 });
    });

    it('should use cache with correct key', async () => {
      mockPrismaService.task.findUnique.mockResolvedValue({
        id: 'task-123',
        title: 'Test',
        requirements: null,
        reward: null,
        result: null,
        bids: [],
        creator: { id: 'c1', name: 'C', trustScore: 50 },
      });

      await service.getTask('task-123');

      expect(cache.getOrSet).toHaveBeenCalledWith(
        'task:detail:task-123',
        expect.any(Function),
        180
      );
    });
  });

  // ============================================
  // BID TASK TESTS
  // ============================================
  describe('bidTask', () => {
    const taskId = 'task-123';
    const agentId = 'agent-456';
    const bidDto: BidTaskDto = {
      proposal: 'I can complete this task efficiently',
      estimatedTime: 7200,
      estimatedCost: 150,
    };

    it('should create a bid successfully', async () => {
      const mockTask = {
        id: taskId,
        status: 'open',
        createdById: 'creator-1',
      };

      const mockBid = {
        id: 'bid-123',
        taskId,
        agentId,
        proposal: bidDto.proposal,
        estimatedTime: bidDto.estimatedTime,
        estimatedCost: bidDto.estimatedCost,
        status: 'pending',
        createdAt: new Date(),
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockPrismaService.bid.findFirst.mockResolvedValue(null);
      mockPrismaService.bid.create.mockResolvedValue(mockBid);

      const result = await service.bidTask(taskId, agentId, bidDto);

      expect(result).toHaveProperty('bidId', 'bid-123');
      expect(result.bid.proposal).toBe(bidDto.proposal);
      expect(result.bid.estimatedTime).toBe(bidDto.estimatedTime);
      expect(result.bid.estimatedCost).toBe(bidDto.estimatedCost);
      expect(result.bid.status).toBe('pending');
    });

    it('should throw NotFoundException if task not found', async () => {
      mockPrismaService.task.findUnique.mockResolvedValue(null);

      await expect(
        service.bidTask('invalid-task', agentId, bidDto)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if task is not open', async () => {
      const mockTask = {
        id: taskId,
        status: 'assigned',
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);

      await expect(
        service.bidTask(taskId, agentId, bidDto)
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if agent already bid', async () => {
      const mockTask = {
        id: taskId,
        status: 'open',
      };

      const existingBid = {
        id: 'existing-bid',
        taskId,
        agentId,
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockPrismaService.bid.findFirst.mockResolvedValue(existingBid);

      await expect(
        service.bidTask(taskId, agentId, bidDto)
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException for completed task', async () => {
      const mockTask = {
        id: taskId,
        status: 'completed',
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);

      await expect(
        service.bidTask(taskId, agentId, bidDto)
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException for cancelled task', async () => {
      const mockTask = {
        id: taskId,
        status: 'cancelled',
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);

      await expect(
        service.bidTask(taskId, agentId, bidDto)
      ).rejects.toThrow(ConflictException);
    });

    it('should clear task detail cache after bidding', async () => {
      const mockTask = {
        id: taskId,
        status: 'open',
      };

      const mockBid = {
        id: 'bid-123',
        taskId,
        agentId,
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockPrismaService.bid.findFirst.mockResolvedValue(null);
      mockPrismaService.bid.create.mockResolvedValue(mockBid);

      await service.bidTask(taskId, agentId, bidDto);

      expect(cache.del).toHaveBeenCalledWith(`task:detail:${taskId}`);
    });

    it('should allow bid with minimal fields', async () => {
      const minimalBidDto: BidTaskDto = {
        proposal: 'Minimal bid',
      };

      const mockTask = {
        id: taskId,
        status: 'open',
      };

      const mockBid = {
        id: 'bid-124',
        taskId,
        agentId,
        proposal: minimalBidDto.proposal,
        estimatedTime: null,
        estimatedCost: null,
        status: 'pending',
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockPrismaService.bid.findFirst.mockResolvedValue(null);
      mockPrismaService.bid.create.mockResolvedValue(mockBid);

      const result = await service.bidTask(taskId, agentId, minimalBidDto);

      expect(result.bid.proposal).toBe(minimalBidDto.proposal);
    });
  });

  // ============================================
  // ACCEPT BID TESTS
  // ============================================
  describe('acceptBid', () => {
    const taskId = 'task-123';
    const bidId = 'bid-456';
    const creatorId = 'creator-1';
    const agentId = 'agent-1';

    it('should accept a bid and assign task', async () => {
      const mockTask = {
        id: taskId,
        createdById: creatorId,
        status: 'open',
        requirements: null,
        reward: JSON.stringify({ credits: 100 }),
      };

      const mockBid = {
        id: bidId,
        taskId,
        agentId,
        status: 'pending',
      };

      const updatedTask = {
        ...mockTask,
        status: 'assigned',
        assigneeId: agentId,
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockPrismaService.bid.findUnique.mockResolvedValue(mockBid);
      mockPrismaService.task.update.mockResolvedValue(updatedTask);
      mockPrismaService.bid.update.mockResolvedValue({
        ...mockBid,
        status: 'accepted',
      });
      mockPrismaService.bid.updateMany.mockResolvedValue({ count: 2 });

      const result = await service.acceptBid(taskId, bidId, creatorId);

      expect(result.task.status).toBe('assigned');
      expect(result.task.assigneeId).toBe(agentId);

      expect(prisma.bid.update).toHaveBeenCalledWith({
        where: { id: bidId },
        data: { status: 'accepted' },
      });

      expect(prisma.bid.updateMany).toHaveBeenCalledWith({
        where: {
          taskId,
          id: { not: bidId },
          status: 'pending',
        },
        data: { status: 'rejected' },
      });
    });

    it('should throw NotFoundException if task not found', async () => {
      mockPrismaService.task.findUnique.mockResolvedValue(null);

      await expect(
        service.acceptBid(taskId, bidId, creatorId)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if not task creator', async () => {
      const mockTask = {
        id: taskId,
        createdById: 'other-creator',
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);

      await expect(
        service.acceptBid(taskId, bidId, creatorId)
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if bid not found', async () => {
      const mockTask = {
        id: taskId,
        createdById: creatorId,
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockPrismaService.bid.findUnique.mockResolvedValue(null);

      await expect(
        service.acceptBid(taskId, bidId, creatorId)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if bid belongs to different task', async () => {
      const mockTask = {
        id: taskId,
        createdById: creatorId,
      };

      const mockBid = {
        id: bidId,
        taskId: 'different-task',
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockPrismaService.bid.findUnique.mockResolvedValue(mockBid);

      await expect(
        service.acceptBid(taskId, bidId, creatorId)
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject other pending bids', async () => {
      const mockTask = {
        id: taskId,
        createdById: creatorId,
        requirements: null,
        reward: JSON.stringify({ credits: 100 }),
      };

      const mockBid = {
        id: bidId,
        taskId,
        agentId,
        status: 'pending',
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockPrismaService.bid.findUnique.mockResolvedValue(mockBid);
      mockPrismaService.task.update.mockResolvedValue({
        ...mockTask,
        status: 'assigned',
        assigneeId: agentId,
      });
      mockPrismaService.bid.update.mockResolvedValue({
        ...mockBid,
        status: 'accepted',
      });
      mockPrismaService.bid.updateMany.mockResolvedValue({ count: 3 });

      await service.acceptBid(taskId, bidId, creatorId);

      expect(prisma.bid.updateMany).toHaveBeenCalledWith({
        where: {
          taskId,
          id: { not: bidId },
          status: 'pending',
        },
        data: { status: 'rejected' },
      });
    });

    it('should clear cache after accepting bid', async () => {
      const mockTask = {
        id: taskId,
        createdById: creatorId,
        requirements: null,
        reward: JSON.stringify({ credits: 100 }),
      };

      const mockBid = {
        id: bidId,
        taskId,
        agentId,
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockPrismaService.bid.findUnique.mockResolvedValue(mockBid);
      mockPrismaService.task.update.mockResolvedValue(mockTask);
      mockPrismaService.bid.update.mockResolvedValue(mockBid);
      mockPrismaService.bid.updateMany.mockResolvedValue({ count: 0 });

      await service.acceptBid(taskId, bidId, creatorId);

      expect(cache.del).toHaveBeenCalledWith(`task:detail:${taskId}`);
      expect(cache.invalidate).toHaveBeenCalledWith('tasks:*');
    });
  });

  // ============================================
  // SUBMIT TASK TESTS
  // ============================================
  describe('submitTask', () => {
    const taskId = 'task-123';
    const assigneeId = 'assignee-1';
    const submitDto: SubmitTaskDto = {
      result: {
        code: 'completed',
        files: ['src/test.ts', 'src/test.spec.ts'],
        coverage: 95,
      },
    };

    it('should submit task result successfully', async () => {
      const mockTask = {
        id: taskId,
        assigneeId,
        status: 'assigned',
        requirements: null,
        reward: JSON.stringify({ credits: 100 }),
      };

      const updatedTask = {
        ...mockTask,
        status: 'reviewing',
        result: JSON.stringify(submitDto.result),
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockPrismaService.task.update.mockResolvedValue(updatedTask);

      const result = await service.submitTask(taskId, assigneeId, submitDto);

      expect(result.task.status).toBe('reviewing');
      expect(result.task.result).toEqual(submitDto.result);
    });

    it('should throw NotFoundException if task not found', async () => {
      mockPrismaService.task.findUnique.mockResolvedValue(null);

      await expect(
        service.submitTask(taskId, assigneeId, submitDto)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if not assignee', async () => {
      const mockTask = {
        id: taskId,
        assigneeId: 'different-assignee',
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);

      await expect(
        service.submitTask(taskId, assigneeId, submitDto)
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if task has no assignee', async () => {
      const mockTask = {
        id: taskId,
        assigneeId: null,
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);

      await expect(
        service.submitTask(taskId, assigneeId, submitDto)
      ).rejects.toThrow(ConflictException);
    });

    it('should clear cache after submission', async () => {
      const mockTask = {
        id: taskId,
        assigneeId,
        requirements: null,
        reward: JSON.stringify({ credits: 100 }),
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockPrismaService.task.update.mockResolvedValue(mockTask);

      await service.submitTask(taskId, assigneeId, submitDto);

      expect(cache.del).toHaveBeenCalledWith(`task:detail:${taskId}`);
      expect(cache.invalidate).toHaveBeenCalledWith('tasks:*');
    });

    it('should handle complex result objects', async () => {
      const complexResult: SubmitTaskDto = {
        result: {
          files: [
            { path: 'src/index.ts', changes: 50 },
            { path: 'test/index.spec.ts', changes: 30 },
          ],
          metrics: {
            complexity: 8,
            maintainability: 85,
            coverage: 92,
          },
          recommendations: [
            'Add more unit tests',
            'Refactor complex function',
          ],
        },
      };

      const mockTask = {
        id: taskId,
        assigneeId,
        requirements: null,
        reward: JSON.stringify({ credits: 100 }),
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockPrismaService.task.update.mockResolvedValue({
        ...mockTask,
        status: 'reviewing',
        result: JSON.stringify(complexResult.result),
      });

      const result = await service.submitTask(taskId, assigneeId, complexResult);

      expect(result.task.result).toEqual(complexResult.result);
    });
  });

  // ============================================
  // COMPLETE TASK TESTS
  // ============================================
  describe('completeTask', () => {
    const taskId = 'task-123';
    const creatorId = 'creator-1';
    const assigneeId = 'assignee-1';
    const completeDto: CompleteTaskDto = {
      rating: 5,
    };

    it('should complete task with rating', async () => {
      const mockTask = {
        id: taskId,
        createdById: creatorId,
        assigneeId,
        status: 'reviewing',
        result: JSON.stringify({ code: 'completed' }),
        requirements: null,
        reward: JSON.stringify({ credits: 100 }),
      };

      const updatedTask = {
        ...mockTask,
        status: 'completed',
        result: JSON.stringify({
          code: 'completed',
          rating: 5,
        }),
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockPrismaService.task.update.mockResolvedValue(updatedTask);
      mockPrismaService.task.findMany.mockResolvedValue([updatedTask]);
      mockPrismaService.agent.update.mockResolvedValue({
        id: assigneeId,
        trustScore: 60,
      });

      const result = await service.completeTask(taskId, creatorId, completeDto);

      expect(result.task.status).toBe('completed');
    });

    it('should throw NotFoundException if task not found', async () => {
      mockPrismaService.task.findUnique.mockResolvedValue(null);

      await expect(
        service.completeTask(taskId, creatorId, completeDto)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if not task creator', async () => {
      const mockTask = {
        id: taskId,
        createdById: 'other-creator',
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);

      await expect(
        service.completeTask(taskId, creatorId, completeDto)
      ).rejects.toThrow(ConflictException);
    });

    it('should use default rating if not provided', async () => {
      const mockTask = {
        id: taskId,
        createdById: creatorId,
        assigneeId,
        status: 'reviewing',
        result: null,
        requirements: null,
        reward: JSON.stringify({ credits: 100 }),
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockPrismaService.task.update.mockResolvedValue({
        ...mockTask,
        status: 'completed',
        result: JSON.stringify({ rating: 5 }),
      });
      mockPrismaService.task.findMany.mockResolvedValue([]);
      mockPrismaService.agent.update.mockResolvedValue({});

      await service.completeTask(taskId, creatorId, {});

      expect(prisma.task.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'completed',
          }),
        })
      );
    });

    it('should update agent trust score', async () => {
      const mockTask = {
        id: taskId,
        createdById: creatorId,
        assigneeId,
        status: 'reviewing',
        result: null,
        requirements: null,
        reward: JSON.stringify({ credits: 100 }),
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockPrismaService.task.update.mockResolvedValue({
        ...mockTask,
        status: 'completed',
        result: JSON.stringify({ rating: 5 }),
      });
      mockPrismaService.task.findMany.mockResolvedValue([
        {
          status: 'completed',
          result: JSON.stringify({ rating: 5 }),
        },
        {
          status: 'completed',
          result: JSON.stringify({ rating: 4 }),
        },
      ]);
      mockPrismaService.agent.update.mockResolvedValue({
        id: assigneeId,
        trustScore: 90,
      });

      await service.completeTask(taskId, creatorId, completeDto);

      expect(prisma.agent.update).toHaveBeenCalled();
    });

    it('should handle task without assignee', async () => {
      const mockTask = {
        id: taskId,
        createdById: creatorId,
        assigneeId: null,
        status: 'reviewing',
        result: null,
        requirements: null,
        reward: JSON.stringify({ credits: 100 }),
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockPrismaService.task.update.mockResolvedValue({
        ...mockTask,
        status: 'completed',
        result: JSON.stringify({ rating: 5 }),
      });

      const result = await service.completeTask(taskId, creatorId, completeDto);

      expect(result.task.status).toBe('completed');
      // Should not update trust score if no assignee
      expect(prisma.agent.update).not.toHaveBeenCalled();
    });

    it('should clear all relevant caches', async () => {
      const mockTask = {
        id: taskId,
        createdById: creatorId,
        assigneeId,
        status: 'reviewing',
        result: null,
        requirements: null,
        reward: JSON.stringify({ credits: 100 }),
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockPrismaService.task.update.mockResolvedValue(mockTask);
      mockPrismaService.task.findMany.mockResolvedValue([]);
      mockPrismaService.agent.update.mockResolvedValue({});

      await service.completeTask(taskId, creatorId, completeDto);

      expect(cache.del).toHaveBeenCalledWith(`task:detail:${taskId}`);
      expect(cache.invalidate).toHaveBeenCalledWith('tasks:*');
      expect(cache.invalidate).toHaveBeenCalledWith('agents:*');
    });
  });

  // ============================================
  // GET MY TASKS TESTS
  // ============================================
  describe('getMyTasks', () => {
    const agentId = 'agent-123';

    it('should return tasks created by agent', async () => {
      const mockTasks = [
        {
          id: 'task-1',
          title: 'Task 1',
          createdById: agentId,
          assigneeId: null,
          requirements: null,
          reward: JSON.stringify({ credits: 10 }),
          creator: { id: agentId, name: 'Agent' },
          assignee: null,
          _count: { bids: 2 },
        },
        {
          id: 'task-2',
          title: 'Task 2',
          createdById: agentId,
          assigneeId: null,
          requirements: null,
          reward: JSON.stringify({ credits: 20 }),
          creator: { id: agentId, name: 'Agent' },
          assignee: null,
          _count: { bids: 1 },
        },
      ];

      mockPrismaService.task.findMany.mockResolvedValue(mockTasks);

      const result = await service.getMyTasks(agentId, { role: 'creator' });

      expect(result.total).toBe(2);
      expect(result.tasks).toHaveLength(2);
      expect(result.tasks[0].bidCount).toBe(2);

      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { createdById: agentId },
        })
      );
    });

    it('should return tasks assigned to agent', async () => {
      const mockTasks = [
        {
          id: 'task-1',
          assigneeId: agentId,
          requirements: null,
          reward: JSON.stringify({ credits: 10 }),
          creator: { id: 'creator-1', name: 'Creator' },
          assignee: { id: agentId, name: 'Agent' },
          _count: { bids: 0 },
        },
      ];

      mockPrismaService.task.findMany.mockResolvedValue(mockTasks);

      const result = await service.getMyTasks(agentId, { role: 'assignee' });

      expect(result.total).toBe(1);

      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { assigneeId: agentId },
        })
      );
    });

    it('should return both created and assigned tasks when no role specified', async () => {
      const mockTasks = [
        {
          id: 'task-1',
          createdById: agentId,
          assigneeId: null,
          requirements: null,
          reward: JSON.stringify({ credits: 10 }),
          creator: { id: agentId, name: 'Agent' },
          assignee: null,
          _count: { bids: 1 },
        },
        {
          id: 'task-2',
          createdById: 'other',
          assigneeId: agentId,
          requirements: null,
          reward: JSON.stringify({ credits: 20 }),
          creator: { id: 'other', name: 'Other' },
          assignee: { id: agentId, name: 'Agent' },
          _count: { bids: 0 },
        },
      ];

      mockPrismaService.task.findMany.mockResolvedValue(mockTasks);

      const result = await service.getMyTasks(agentId, {});

      expect(result.total).toBe(2);

      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { createdById: agentId },
              { assigneeId: agentId },
            ],
          },
        })
      );
    });

    it('should filter by status', async () => {
      const mockTasks = [
        {
          id: 'task-1',
          createdById: agentId,
          status: 'completed',
          requirements: null,
          reward: JSON.stringify({ credits: 10 }),
          creator: { id: agentId, name: 'Agent' },
          assignee: null,
          _count: { bids: 0 },
        },
      ];

      mockPrismaService.task.findMany.mockResolvedValue(mockTasks);

      const result = await service.getMyTasks(agentId, {
        role: 'creator',
        status: 'completed',
      });

      expect(result.total).toBe(1);

      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            createdById: agentId,
            status: 'completed',
          },
        })
      );
    });

    it('should return tasks ordered by createdAt descending', async () => {
      mockPrismaService.task.findMany.mockResolvedValue([]);

      await service.getMyTasks(agentId, {});

      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      );
    });

    it('should return empty array if no tasks found', async () => {
      mockPrismaService.task.findMany.mockResolvedValue([]);

      const result = await service.getMyTasks(agentId, {});

      expect(result.total).toBe(0);
      expect(result.tasks).toHaveLength(0);
    });
  });

  // ============================================
  // EDGE CASES AND ERROR HANDLING
  // ============================================
  describe('Edge Cases and Error Handling', () => {
    it('should handle database connection errors', async () => {
      mockPrismaService.task.findUnique.mockRejectedValue(
        new Error('Database connection failed')
      );
      mockCacheService.getOrSet.mockImplementation((key, fn) => fn());

      await expect(service.getTask('task-id')).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('should handle malformed JSON in requirements', async () => {
      const mockTask = {
        id: 'task-1',
        title: 'Task',
        requirements: 'invalid-json',
        reward: JSON.stringify({ credits: 10 }),
        result: null,
        bids: [],
        creator: { id: 'c1', name: 'C', trustScore: 50 },
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockCacheService.getOrSet.mockImplementation((key, fn) => fn());

      await expect(service.getTask('task-1')).rejects.toThrow();
    });

    it('should handle malformed JSON in reward', async () => {
      const mockTask = {
        id: 'task-1',
        title: 'Task',
        requirements: null,
        reward: 'invalid-json',
        result: null,
        bids: [],
        creator: { id: 'c1', name: 'C', trustScore: 50 },
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockCacheService.getOrSet.mockImplementation((key, fn) => fn());

      await expect(service.getTask('task-1')).rejects.toThrow();
    });

    it('should handle null values in optional fields', async () => {
      const mockTask = {
        id: 'task-1',
        title: 'Task',
        description: null,
        category: null,
        requirements: null,
        reward: null,
        result: null,
        deadline: null,
        bids: [],
        creator: { id: 'c1', name: 'C', trustScore: 50 },
        assignee: null,
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockCacheService.getOrSet.mockImplementation((key, fn) => fn());

      const result = await service.getTask('task-1');

      expect(result.requirements).toBeNull();
      expect(result.reward).toBeNull();
      expect(result.result).toBeNull();
    });

    it('should handle concurrent bid attempts', async () => {
      const mockTask = {
        id: 'task-1',
        status: 'open',
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockPrismaService.bid.findFirst.mockResolvedValue(null);

      // Simulate concurrent bids
      const bidPromises = [
        service.bidTask('task-1', 'agent-1', { proposal: 'Bid 1' }),
        service.bidTask('task-1', 'agent-2', { proposal: 'Bid 2' }),
      ];

      // Both should succeed if no existing bid
      mockPrismaService.bid.create.mockResolvedValue({
        id: 'bid-1',
        taskId: 'task-1',
        agentId: 'agent-1',
      });

      const results = await Promise.all(bidPromises);
      expect(results).toBeDefined();
    });
  });

  // ============================================
  // PERFORMANCE AND CACHING TESTS
  // ============================================
  describe('Performance and Caching', () => {
    it('should cache task list queries', async () => {
      mockPrismaService.task.findMany.mockResolvedValue([]);
      mockPrismaService.task.count.mockResolvedValue(0);

      await service.getTasks({ status: 'open' });

      expect(cache.getOrSet).toHaveBeenCalled();
    });

    it('should use different cache keys for different filters', async () => {
      mockPrismaService.task.findMany.mockResolvedValue([]);
      mockPrismaService.task.count.mockResolvedValue(0);

      await service.getTasks({ status: 'open' });
      await service.getTasks({ status: 'completed' });

      const calls = cache.getOrSet.mock.calls;
      expect(calls[0][0]).not.toBe(calls[1][0]);
    });

    it('should invalidate cache on task creation', async () => {
      mockPrismaService.task.create.mockResolvedValue({
        id: 'task-1',
        title: 'Test',
      });

      await service.createTask('creator-1', { title: 'Test' });

      expect(cache.invalidate).toHaveBeenCalledWith('tasks:*');
    });

    it('should invalidate cache on task update', async () => {
      const mockTask = {
        id: 'task-1',
        createdById: 'creator-1',
        assigneeId: 'assignee-1',
        requirements: null,
        reward: JSON.stringify({ credits: 100 }),
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockPrismaService.task.update.mockResolvedValue(mockTask);

      await service.submitTask('task-1', 'assignee-1', { result: {} });

      expect(cache.del).toHaveBeenCalledWith('task:detail:task-1');
      expect(cache.invalidate).toHaveBeenCalledWith('tasks:*');
    });
  });
});
