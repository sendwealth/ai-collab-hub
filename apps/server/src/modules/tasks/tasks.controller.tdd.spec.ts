/**
 * TDD Test Suite for TasksController
 * Comprehensive test coverage for all controller endpoints
 * 
 * Test Coverage Goals:
 * - POST /api/v1/tasks - Create task
 * - GET /api/v1/tasks - List tasks
 * - GET /api/v1/tasks/me - Get my tasks
 * - GET /api/v1/tasks/:id - Get task details
 * - POST /api/v1/tasks/:id/bid - Bid on task
 * - POST /api/v1/tasks/:id/accept - Accept bid
 * - POST /api/v1/tasks/:id/submit - Submit task result
 * - POST /api/v1/tasks/:id/complete - Complete task
 */

import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { SubtasksService } from './subtasks.service';
import { PricingService } from './pricing.service';
import { 
  CreateTaskDto, 
  BidTaskDto, 
  SubmitTaskDto,
  TaskQueryDto,
  GetPricingDto,
  GetMarketPriceDto,
  CreateSubtaskDto,
  UpdateSubtaskOrderDto,
} from './dto';
import { UnauthorizedException } from '@nestjs/common';

describe('TasksController (TDD)', () => {
  let controller: TasksController;
  let tasksService: any;
  let subtasksService: any;
  let pricingService: any;

  // Mock Services
  const mockTasksService = {
    createTask: jest.fn(),
    getTasks: jest.fn(),
    getTask: jest.fn(),
    getMyTasks: jest.fn(),
    bidTask: jest.fn(),
    acceptBid: jest.fn(),
    submitTask: jest.fn(),
    completeTask: jest.fn(),
  };

  const mockSubtasksService = {
    createSubtask: jest.fn(),
    getSubtasks: jest.fn(),
    removeSubtask: jest.fn(),
    getTaskTree: jest.fn(),
    getTaskProgress: jest.fn(),
    updateSubtaskOrder: jest.fn(),
  };

  const mockPricingService = {
    suggestPrice: jest.fn(),
    getMarketPrice: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: TasksService,
          useValue: mockTasksService,
        },
        {
          provide: SubtasksService,
          useValue: mockSubtasksService,
        },
        {
          provide: PricingService,
          useValue: mockPricingService,
        },
      ],
    }).compile();

    controller = module.get<TasksController>(TasksController);
    tasksService = module.get(TasksService);
    subtasksService = module.get(SubtasksService);
    pricingService = module.get(PricingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // PRICING ENDPOINTS TESTS
  // ============================================
  describe('Pricing Endpoints', () => {
    describe('getPricing', () => {
      it('should return pricing suggestion', async () => {
        const getPricingDto: GetPricingDto = {
          category: 'development',
          description: 'Build a REST API',
          requirements: { skills: ['typescript', 'node.js'] },
        };

        const mockPricing = {
          suggestedPrice: 150,
          priceRange: { min: 100, max: 200 },
          factors: { complexity: 'medium', urgency: 'normal' },
        };

        mockPricingService.suggestPrice.mockResolvedValue(mockPricing);

        const result = await controller.getPricing(getPricingDto);

        expect(result).toEqual(mockPricing);
        expect(pricingService.suggestPrice).toHaveBeenCalledWith(getPricingDto);
      });

      it('should handle pricing without optional fields', async () => {
        const getPricingDto: GetPricingDto = {
          category: 'testing',
          description: 'Write unit tests',
        };

        const mockPricing = {
          suggestedPrice: 50,
          priceRange: { min: 30, max: 70 },
        };

        mockPricingService.suggestPrice.mockResolvedValue(mockPricing);

        const result = await controller.getPricing(getPricingDto);

        expect(result).toEqual(mockPricing);
      });
    });

    describe('getMarketPrice', () => {
      it('should return market price data', async () => {
        const query: GetMarketPriceDto = {
          categories: ['development', 'testing'],
        };

        const mockMarketPrice = {
          categories: [
            { name: 'development', avgPrice: 150, trend: 'up' },
            { name: 'testing', avgPrice: 80, trend: 'stable' },
          ],
        };

        mockPricingService.getMarketPrice.mockResolvedValue(mockMarketPrice);

        const result = await controller.getMarketPrice(query);

        expect(result).toEqual(mockMarketPrice);
        expect(pricingService.getMarketPrice).toHaveBeenCalledWith(query);
      });

      it('should return market price without category filter', async () => {
        const mockMarketPrice = {
          categories: [
            { name: 'development', avgPrice: 150 },
            { name: 'testing', avgPrice: 80 },
          ],
        };

        mockPricingService.getMarketPrice.mockResolvedValue(mockMarketPrice);

        const result = await controller.getMarketPrice({});

        expect(result).toEqual(mockMarketPrice);
      });
    });
  });

  // ============================================
  // CREATE TASK TESTS
  // ============================================
  describe('createTask', () => {
    const agentId = 'agent-123';
    const createTaskDto: CreateTaskDto = {
      title: 'New Task',
      description: 'Task description',
      category: 'development',
      type: 'independent',
      reward: { credits: 100 },
    };

    it('should create a task successfully', async () => {
      const mockResult = {
        taskId: 'task-123',
        task: {
          id: 'task-123',
          ...createTaskDto,
          status: 'open',
          createdById: agentId,
        },
      };

      mockTasksService.createTask.mockResolvedValue(mockResult);

      const result = await controller.createTask(agentId, createTaskDto);

      expect(result).toEqual(mockResult);
      expect(tasksService.createTask).toHaveBeenCalledWith(agentId, createTaskDto);
    });

    it('should create task with minimal fields', async () => {
      const minimalDto: CreateTaskDto = {
        title: 'Minimal Task',
      };

      const mockResult = {
        taskId: 'task-124',
        task: {
          id: 'task-124',
          title: minimalDto.title,
          status: 'open',
        },
      };

      mockTasksService.createTask.mockResolvedValue(mockResult);

      const result = await controller.createTask(agentId, minimalDto);

      expect(result.taskId).toBe('task-124');
    });

    it('should create collaborative task', async () => {
      const collabDto: CreateTaskDto = {
        title: 'Collaborative Task',
        type: 'collaborative',
        requirements: { maxAgents: 5 },
      };

      const mockResult = {
        taskId: 'task-125',
        task: collabDto,
      };

      mockTasksService.createTask.mockResolvedValue(mockResult);

      const result = await controller.createTask(agentId, collabDto);

      expect(result.task.type).toBe('collaborative');
    });

    it('should create workflow task', async () => {
      const workflowDto: CreateTaskDto = {
        title: 'Workflow Task',
        type: 'workflow',
      };

      const mockResult = {
        taskId: 'task-126',
        task: workflowDto,
      };

      mockTasksService.createTask.mockResolvedValue(mockResult);

      const result = await controller.createTask(agentId, workflowDto);

      expect(result.task.type).toBe('workflow');
    });

    it('should create task with deadline', async () => {
      const deadlineDto: CreateTaskDto = {
        title: 'Task with Deadline',
        deadline: '2025-12-31T23:59:59.000Z',
      };

      const mockResult = {
        taskId: 'task-127',
        task: {
          id: 'task-127',
          ...deadlineDto,
          deadline: new Date(deadlineDto.deadline!),
        },
      };

      mockTasksService.createTask.mockResolvedValue(mockResult);

      const result = await controller.createTask(agentId, deadlineDto);

      expect(result.task.deadline).toBeDefined();
    });
  });

  // ============================================
  // GET TASKS TESTS
  // ============================================
  describe('getTasks', () => {
    it('should return all tasks with default filters', async () => {
      const mockResult = {
        total: 2,
        tasks: [
          { id: 'task-1', title: 'Task 1', status: 'open' },
          { id: 'task-2', title: 'Task 2', status: 'open' },
        ],
      };

      mockTasksService.getTasks.mockResolvedValue(mockResult);

      const result = await controller.getTasks({});

      expect(result).toEqual(mockResult);
      expect(tasksService.getTasks).toHaveBeenCalledWith({});
    });

    it('should filter tasks by status', async () => {
      const query: TaskQueryDto = {
        status: 'open',
      };

      const mockResult = {
        total: 1,
        tasks: [{ id: 'task-1', status: 'open' }],
      };

      mockTasksService.getTasks.mockResolvedValue(mockResult);

      const result = await controller.getTasks(query);

      expect(result.total).toBe(1);
      expect(tasksService.getTasks).toHaveBeenCalledWith(query);
    });

    it('should filter tasks by category', async () => {
      const query: TaskQueryDto = {
        category: 'development',
      };

      const mockResult = {
        total: 1,
        tasks: [{ id: 'task-1', category: 'development' }],
      };

      mockTasksService.getTasks.mockResolvedValue(mockResult);

      const result = await controller.getTasks(query);

      expect(result.tasks[0].category).toBe('development');
    });

    it('should filter tasks by type', async () => {
      const query: TaskQueryDto = {
        type: 'workflow',
      };

      const mockResult = {
        total: 1,
        tasks: [{ id: 'task-1', type: 'workflow' }],
      };

      mockTasksService.getTasks.mockResolvedValue(mockResult);

      const result = await controller.getTasks(query);

      expect(result.tasks[0].type).toBe('workflow');
    });

    it('should apply pagination', async () => {
      const query: TaskQueryDto = {
        limit: 10,
        offset: 20,
      };

      const mockResult = {
        total: 50,
        tasks: [],
      };

      mockTasksService.getTasks.mockResolvedValue(mockResult);

      const result = await controller.getTasks(query);

      expect(result.total).toBe(50);
      expect(tasksService.getTasks).toHaveBeenCalledWith(query);
    });

    it('should apply multiple filters', async () => {
      const query: TaskQueryDto = {
        status: 'open',
        category: 'development',
        type: 'independent',
        limit: 5,
        offset: 0,
      };

      const mockResult = {
        total: 1,
        tasks: [{ id: 'task-1', ...query }],
      };

      mockTasksService.getTasks.mockResolvedValue(mockResult);

      const result = await controller.getTasks(query);

      expect(result.total).toBe(1);
      expect(tasksService.getTasks).toHaveBeenCalledWith(query);
    });
  });

  // ============================================
  // GET MY TASKS TESTS
  // ============================================
  describe('getMyTasks', () => {
    const agentId = 'agent-123';

    it('should return tasks created by agent', async () => {
      const mockResult = {
        total: 2,
        tasks: [
          { id: 'task-1', createdById: agentId },
          { id: 'task-2', createdById: agentId },
        ],
      };

      mockTasksService.getMyTasks.mockResolvedValue(mockResult);

      const result = await controller.getMyTasks(agentId);

      expect(result).toEqual(mockResult);
      expect(tasksService.getMyTasks).toHaveBeenCalledWith(agentId, {});
    });

    it('should filter my tasks by status', async () => {
      const mockResult = {
        total: 1,
        tasks: [{ id: 'task-1', status: 'completed' }],
      };

      mockTasksService.getMyTasks.mockResolvedValue(mockResult);

      const result = await controller.getMyTasks(agentId, 'completed');

      expect(result.total).toBe(1);
      expect(tasksService.getMyTasks).toHaveBeenCalledWith(agentId, {
        status: 'completed',
      });
    });

    it('should filter my tasks by role (creator)', async () => {
      const mockResult = {
        total: 2,
        tasks: [
          { id: 'task-1', createdById: agentId },
          { id: 'task-2', createdById: agentId },
        ],
      };

      mockTasksService.getMyTasks.mockResolvedValue(mockResult);

      const result = await controller.getMyTasks(agentId, undefined, 'creator');

      expect(tasksService.getMyTasks).toHaveBeenCalledWith(agentId, {
        role: 'creator',
      });
    });

    it('should filter my tasks by role (assignee)', async () => {
      const mockResult = {
        total: 1,
        tasks: [{ id: 'task-1', assigneeId: agentId }],
      };

      mockTasksService.getMyTasks.mockResolvedValue(mockResult);

      const result = await controller.getMyTasks(agentId, undefined, 'assignee');

      expect(tasksService.getMyTasks).toHaveBeenCalledWith(agentId, {
        role: 'assignee',
      });
    });

    it('should apply both status and role filters', async () => {
      const mockResult = {
        total: 1,
        tasks: [{ id: 'task-1', status: 'completed', assigneeId: agentId }],
      };

      mockTasksService.getMyTasks.mockResolvedValue(mockResult);

      const result = await controller.getMyTasks(agentId, 'completed', 'assignee');

      expect(tasksService.getMyTasks).toHaveBeenCalledWith(agentId, {
        status: 'completed',
        role: 'assignee',
      });
    });

    it('should return empty array if no tasks found', async () => {
      const mockResult = {
        total: 0,
        tasks: [],
      };

      mockTasksService.getMyTasks.mockResolvedValue(mockResult);

      const result = await controller.getMyTasks(agentId);

      expect(result.total).toBe(0);
      expect(result.tasks).toHaveLength(0);
    });
  });

  // ============================================
  // GET TASK BY ID TESTS
  // ============================================
  describe('getTask', () => {
    it('should return task details', async () => {
      const taskId = 'task-123';
      const mockResult = {
        id: taskId,
        title: 'Test Task',
        description: 'Description',
        status: 'open',
        bids: [],
      };

      mockTasksService.getTask.mockResolvedValue(mockResult);

      const result = await controller.getTask(taskId);

      expect(result).toEqual(mockResult);
      expect(tasksService.getTask).toHaveBeenCalledWith(taskId);
    });

    it('should return task with bids', async () => {
      const taskId = 'task-123';
      const mockResult = {
        id: taskId,
        title: 'Task with Bids',
        bids: [
          { id: 'bid-1', proposal: 'I can do this' },
          { id: 'bid-2', proposal: 'I can do that' },
        ],
      };

      mockTasksService.getTask.mockResolvedValue(mockResult);

      const result = await controller.getTask(taskId);

      expect(result.bids).toHaveLength(2);
    });

    it('should return task with assignee', async () => {
      const taskId = 'task-123';
      const mockResult = {
        id: taskId,
        title: 'Assigned Task',
        status: 'assigned',
        assignee: { id: 'assignee-1', name: 'Assignee' },
      };

      mockTasksService.getTask.mockResolvedValue(mockResult);

      const result = await controller.getTask(taskId);

      expect(result.assignee).toBeDefined();
      expect(result.assignee.name).toBe('Assignee');
    });

    it('should return task with result', async () => {
      const taskId = 'task-123';
      const mockResult = {
        id: taskId,
        title: 'Completed Task',
        status: 'completed',
        result: { code: 'completed', rating: 5 },
      };

      mockTasksService.getTask.mockResolvedValue(mockResult);

      const result = await controller.getTask(taskId);

      expect(result.result).toBeDefined();
      expect(result.result.rating).toBe(5);
    });
  });

  // ============================================
  // BID TASK TESTS
  // ============================================
  describe('bidTask', () => {
    const agentId = 'agent-123';
    const taskId = 'task-123';
    const bidDto: BidTaskDto = {
      proposal: 'I can complete this task',
      estimatedTime: 3600,
      estimatedCost: 100,
    };

    it('should create a bid successfully', async () => {
      const mockResult = {
        bidId: 'bid-123',
        bid: {
          id: 'bid-123',
          taskId,
          agentId,
          ...bidDto,
          status: 'pending',
        },
      };

      mockTasksService.bidTask.mockResolvedValue(mockResult);

      const result = await controller.bidTask(agentId, taskId, bidDto);

      expect(result).toEqual(mockResult);
      expect(tasksService.bidTask).toHaveBeenCalledWith(taskId, agentId, bidDto);
    });

    it('should create bid with minimal fields', async () => {
      const minimalBidDto: BidTaskDto = {
        proposal: 'Minimal bid',
      };

      const mockResult = {
        bidId: 'bid-124',
        bid: {
          id: 'bid-124',
          proposal: minimalBidDto.proposal,
        },
      };

      mockTasksService.bidTask.mockResolvedValue(mockResult);

      const result = await controller.bidTask(agentId, taskId, minimalBidDto);

      expect(result.bidId).toBe('bid-124');
    });

    it('should create bid with estimated time only', async () => {
      const timeBidDto: BidTaskDto = {
        proposal: 'Time estimate',
        estimatedTime: 7200,
      };

      const mockResult = {
        bidId: 'bid-125',
        bid: timeBidDto,
      };

      mockTasksService.bidTask.mockResolvedValue(mockResult);

      const result = await controller.bidTask(agentId, taskId, timeBidDto);

      expect(result.bid.estimatedTime).toBe(7200);
    });

    it('should create bid with cost only', async () => {
      const costBidDto: BidTaskDto = {
        proposal: 'Cost estimate',
        estimatedCost: 200,
      };

      const mockResult = {
        bidId: 'bid-126',
        bid: costBidDto,
      };

      mockTasksService.bidTask.mockResolvedValue(mockResult);

      const result = await controller.bidTask(agentId, taskId, costBidDto);

      expect(result.bid.estimatedCost).toBe(200);
    });
  });

  // ============================================
  // ACCEPT BID TESTS
  // ============================================
  describe('acceptBid', () => {
    const agentId = 'agent-123';
    const taskId = 'task-123';
    const bidId = 'bid-456';

    it('should accept a bid successfully', async () => {
      const mockResult = {
        task: {
          id: taskId,
          status: 'assigned',
          assigneeId: 'agent-789',
        },
        bid: {
          id: bidId,
          status: 'accepted',
        },
      };

      mockTasksService.acceptBid.mockResolvedValue(mockResult);

      const result = await controller.acceptBid(agentId, taskId, bidId);

      expect(result).toEqual(mockResult);
      expect(tasksService.acceptBid).toHaveBeenCalledWith(taskId, bidId, agentId);
    });

    it('should return updated task status', async () => {
      const mockResult = {
        task: {
          id: taskId,
          status: 'assigned',
        },
        bid: { id: bidId },
      };

      mockTasksService.acceptBid.mockResolvedValue(mockResult);

      const result = await controller.acceptBid(agentId, taskId, bidId);

      expect(result.task.status).toBe('assigned');
    });

    it('should return accepted bid details', async () => {
      const mockResult = {
        task: { id: taskId },
        bid: {
          id: bidId,
          status: 'accepted',
          agentId: 'agent-789',
        },
      };

      mockTasksService.acceptBid.mockResolvedValue(mockResult);

      const result = await controller.acceptBid(agentId, taskId, bidId);

      expect(result.bid.status).toBe('accepted');
    });
  });

  // ============================================
  // SUBMIT TASK TESTS
  // ============================================
  describe('submitTask', () => {
    const agentId = 'agent-123';
    const taskId = 'task-123';
    const submitDto: SubmitTaskDto = {
      result: {
        code: 'completed',
        files: ['test.js', 'test.spec.js'],
        coverage: 95,
      },
    };

    it('should submit task result successfully', async () => {
      const mockResult = {
        task: {
          id: taskId,
          status: 'reviewing',
          result: submitDto.result,
        },
      };

      mockTasksService.submitTask.mockResolvedValue(mockResult);

      const result = await controller.submitTask(agentId, taskId, submitDto);

      expect(result).toEqual(mockResult);
      expect(tasksService.submitTask).toHaveBeenCalledWith(taskId, agentId, submitDto);
    });

    it('should submit with complex result object', async () => {
      const complexDto: SubmitTaskDto = {
        result: {
          deliverables: [
            { type: 'code', path: 'src/index.ts', lines: 150 },
            { type: 'tests', path: 'test/index.spec.ts', lines: 100 },
          ],
          metrics: {
            coverage: 95,
            complexity: 8,
            performance: 'improved',
          },
          notes: 'All requirements met',
        },
      };

      const mockResult = {
        task: {
          id: taskId,
          status: 'reviewing',
          result: complexDto.result,
        },
      };

      mockTasksService.submitTask.mockResolvedValue(mockResult);

      const result = await controller.submitTask(agentId, taskId, complexDto);

      expect(result.task.result).toEqual(complexDto.result);
    });

    it('should submit with minimal result', async () => {
      const minimalDto: SubmitTaskDto = {
        result: { completed: true },
      };

      const mockResult = {
        task: {
          id: taskId,
          status: 'reviewing',
          result: minimalDto.result,
        },
      };

      mockTasksService.submitTask.mockResolvedValue(mockResult);

      const result = await controller.submitTask(agentId, taskId, minimalDto);

      expect(result.task.status).toBe('reviewing');
    });
  });

  // ============================================
  // COMPLETE TASK TESTS
  // ============================================
  describe('completeTask', () => {
    const agentId = 'agent-123';
    const taskId = 'task-123';

    it('should complete task with rating', async () => {
      const mockResult = {
        task: {
          id: taskId,
          status: 'completed',
          result: { rating: 5 },
        },
      };

      mockTasksService.completeTask.mockResolvedValue(mockResult);

      const result = await controller.completeTask(agentId, taskId, 5);

      expect(result).toEqual(mockResult);
      expect(tasksService.completeTask).toHaveBeenCalledWith(taskId, agentId, {
        rating: 5,
      });
    });

    it('should complete task without rating', async () => {
      const mockResult = {
        task: {
          id: taskId,
          status: 'completed',
          result: { rating: 5 }, // Default rating
        },
      };

      mockTasksService.completeTask.mockResolvedValue(mockResult);

      const result = await controller.completeTask(agentId, taskId);

      expect(result.task.status).toBe('completed');
      expect(tasksService.completeTask).toHaveBeenCalledWith(taskId, agentId, {
        rating: undefined,
      });
    });

    it('should complete task with maximum rating', async () => {
      const mockResult = {
        task: {
          id: taskId,
          status: 'completed',
          result: { rating: 5 },
        },
      };

      mockTasksService.completeTask.mockResolvedValue(mockResult);

      const result = await controller.completeTask(agentId, taskId, 5);

      expect(result.task.result.rating).toBe(5);
    });

    it('should complete task with minimum rating', async () => {
      const mockResult = {
        task: {
          id: taskId,
          status: 'completed',
          result: { rating: 1 },
        },
      };

      mockTasksService.completeTask.mockResolvedValue(mockResult);

      const result = await controller.completeTask(agentId, taskId, 1);

      expect(result.task.result.rating).toBe(1);
    });
  });

  // ============================================
  // SUBTASK ENDPOINTS TESTS
  // ============================================
  describe('Subtask Endpoints', () => {
    describe('createSubtask', () => {
      it('should create a subtask', async () => {
        const agentId = 'agent-123';
        const taskId = 'task-123';
        const createSubtaskDto: CreateSubtaskDto = {
          title: 'Subtask 1',
          description: 'Subtask description',
          order: 1,
        };

        const mockResult = {
          id: 'subtask-123',
          parentId: taskId,
          ...createSubtaskDto,
        };

        mockSubtasksService.createSubtask.mockResolvedValue(mockResult);

        const result = await controller.createSubtask(
          agentId,
          taskId,
          createSubtaskDto
        );

        expect(result).toEqual(mockResult);
        expect(subtasksService.createSubtask).toHaveBeenCalledWith(
          taskId,
          agentId,
          createSubtaskDto
        );
      });

      it('should create subtask with existing task', async () => {
        const agentId = 'agent-123';
        const taskId = 'task-123';
        const createSubtaskDto: CreateSubtaskDto = {
          childId: 'existing-task-456',
          order: 2,
        };

        const mockResult = {
          id: 'subtask-124',
          parentId: taskId,
          childId: createSubtaskDto.childId,
        };

        mockSubtasksService.createSubtask.mockResolvedValue(mockResult);

        const result = await controller.createSubtask(
          agentId,
          taskId,
          createSubtaskDto
        );

        expect(result.childId).toBe(createSubtaskDto.childId);
      });
    });

    describe('getSubtasks', () => {
      it('should return list of subtasks', async () => {
        const taskId = 'task-123';
        const mockResult = {
          subtasks: [
            { id: 'subtask-1', order: 1 },
            { id: 'subtask-2', order: 2 },
          ],
        };

        mockSubtasksService.getSubtasks.mockResolvedValue(mockResult);

        const result = await controller.getSubtasks(taskId);

        expect(result).toEqual(mockResult);
        expect(subtasksService.getSubtasks).toHaveBeenCalledWith(taskId);
      });

      it('should return empty array if no subtasks', async () => {
        const taskId = 'task-123';
        const mockResult = {
          subtasks: [],
        };

        mockSubtasksService.getSubtasks.mockResolvedValue(mockResult);

        const result = await controller.getSubtasks(taskId);

        expect(result.subtasks).toHaveLength(0);
      });
    });

    describe('removeSubtask', () => {
      it('should remove subtask relationship', async () => {
        const agentId = 'agent-123';
        const parentId = 'task-123';
        const childId = 'task-456';

        const mockResult = {
          success: true,
        };

        mockSubtasksService.removeSubtask.mockResolvedValue(mockResult);

        const result = await controller.removeSubtask(
          agentId,
          parentId,
          childId
        );

        expect(result).toEqual(mockResult);
        expect(subtasksService.removeSubtask).toHaveBeenCalledWith(
          parentId,
          childId,
          agentId
        );
      });
    });

    describe('getTaskTree', () => {
      it('should return task tree', async () => {
        const taskId = 'task-123';
        const mockResult = {
          id: taskId,
          title: 'Parent Task',
          children: [
            {
              id: 'child-1',
              title: 'Child 1',
              children: [],
            },
          ],
        };

        mockSubtasksService.getTaskTree.mockResolvedValue(mockResult);

        const result = await controller.getTaskTree(taskId);

        expect(result).toEqual(mockResult);
        expect(subtasksService.getTaskTree).toHaveBeenCalledWith(taskId, 10);
      });

      it('should return task tree with custom depth', async () => {
        const taskId = 'task-123';
        const maxDepth = '5';

        const mockResult = {
          id: taskId,
          children: [],
        };

        mockSubtasksService.getTaskTree.mockResolvedValue(mockResult);

        const result = await controller.getTaskTree(taskId, maxDepth);

        expect(subtasksService.getTaskTree).toHaveBeenCalledWith(taskId, 5);
      });
    });

    describe('getTaskProgress', () => {
      it('should return task progress', async () => {
        const taskId = 'task-123';
        const mockResult = {
          total: 5,
          completed: 3,
          percentage: 60,
        };

        mockSubtasksService.getTaskProgress.mockResolvedValue(mockResult);

        const result = await controller.getTaskProgress(taskId);

        expect(result).toEqual(mockResult);
        expect(subtasksService.calculateProgress).toHaveBeenCalledWith(taskId);
      });
    });

    describe('updateSubtaskOrder', () => {
      it('should update subtask order', async () => {
        const agentId = 'agent-123';
        const taskId = 'task-123';
        const updateOrderDto: UpdateSubtaskOrderDto = {
          orders: [
            { childId: 'child-1', order: 2 },
            { childId: 'child-2', order: 1 },
          ],
        };

        const mockResult = {
          success: true,
        };

        mockSubtasksService.updateSubtaskOrder.mockResolvedValue(mockResult);

        const result = await controller.updateSubtaskOrder(
          agentId,
          taskId,
          updateOrderDto
        );

        expect(result).toEqual(mockResult);
        expect(subtasksService.updateSubtaskOrder).toHaveBeenCalledWith(
          taskId,
          agentId,
          updateOrderDto.orders
        );
      });
    });
  });

  // ============================================
  // ERROR HANDLING TESTS
  // ============================================
  describe('Error Handling', () => {
    it('should propagate service errors', async () => {
      const error = new Error('Service error');
      mockTasksService.createTask.mockRejectedValue(error);

      await expect(
        controller.createTask('agent-1', { title: 'Test' })
      ).rejects.toThrow('Service error');
    });

    it('should handle NotFoundException', async () => {
      const { NotFoundException } = require('@nestjs/common');
      mockTasksService.getTask.mockRejectedValue(
        new NotFoundException('Task not found')
      );

      await expect(controller.getTask('invalid-id')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should handle ConflictException', async () => {
      const { ConflictException } = require('@nestjs/common');
      mockTasksService.bidTask.mockRejectedValue(
        new ConflictException('Already bid')
      );

      await expect(
        controller.bidTask('agent-1', 'task-1', { proposal: 'Test' })
      ).rejects.toThrow(ConflictException);
    });
  });

  // ============================================
  // VALIDATION TESTS
  // ============================================
  describe('Validation', () => {
    it('should accept valid task types', async () => {
      const types = ['independent', 'collaborative', 'workflow'];

      for (const type of types) {
        const dto: CreateTaskDto = {
          title: 'Test',
          type: type as any,
        };

        const mockResult = {
          taskId: 'task-id',
          task: dto,
        };

        mockTasksService.createTask.mockResolvedValue(mockResult);

        const result = await controller.createTask('agent-1', dto);
        expect(result.task.type).toBe(type);
      }
    });

    it('should accept valid status filters', async () => {
      const statuses = ['open', 'assigned', 'reviewing', 'completed', 'cancelled'];

      for (const status of statuses) {
        const query: TaskQueryDto = { status };

        const mockResult = {
          total: 0,
          tasks: [],
        };

        mockTasksService.getTasks.mockResolvedValue(mockResult);

        const result = await controller.getTasks(query);
        expect(result).toBeDefined();
      }
    });

    it('should accept valid rating values', async () => {
      const ratings = [1, 2, 3, 4, 5];

      for (const rating of ratings) {
        const mockResult = {
          task: {
            id: 'task-1',
            status: 'completed',
            result: { rating },
          },
        };

        mockTasksService.completeTask.mockResolvedValue(mockResult);

        const result = await controller.completeTask('agent-1', 'task-1', rating);
        expect(result.task.result.rating).toBe(rating);
      }
    });
  });

  // ============================================
  // CONTROLLER DEFINITION TEST
  // ============================================
  describe('Controller Definition', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should have all required methods', () => {
      expect(controller.createTask).toBeDefined();
      expect(controller.getTasks).toBeDefined();
      expect(controller.getMyTasks).toBeDefined();
      expect(controller.getTask).toBeDefined();
      expect(controller.bidTask).toBeDefined();
      expect(controller.acceptBid).toBeDefined();
      expect(controller.submitTask).toBeDefined();
      expect(controller.completeTask).toBeDefined();
    });

    it('should have subtask methods', () => {
      expect(controller.createSubtask).toBeDefined();
      expect(controller.getSubtasks).toBeDefined();
      expect(controller.removeSubtask).toBeDefined();
      expect(controller.getTaskTree).toBeDefined();
      expect(controller.getTaskProgress).toBeDefined();
      expect(controller.updateSubtaskOrder).toBeDefined();
    });

    it('should have pricing methods', () => {
      expect(controller.getPricing).toBeDefined();
      expect(controller.getMarketPrice).toBeDefined();
    });
  });
});
