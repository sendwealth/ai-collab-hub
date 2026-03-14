import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { CreateTaskDto, TaskQueryDto, BidTaskDto, SubmitTaskDto } from './dto';
import { AgentAuthGuard } from '../auth/guards/agent-auth.guard';

describe('TasksController', () => {
  let controller: TasksController;
  let service: TasksService;

  const mockTasksService = {
    createTask: jest.fn(),
    getTasks: jest.fn(),
    getTask: jest.fn(),
    bidTask: jest.fn(),
    acceptBid: jest.fn(),
    submitTask: jest.fn(),
    completeTask: jest.fn(),
    getMyTasks: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: TasksService,
          useValue: mockTasksService,
        },
      ],
    })
      .overrideGuard(AgentAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const request = context.switchToHttp().getRequest();
          request.agent = { id: 'test-agent-id' };
          return true;
        },
      })
      .compile();

    controller = module.get<TasksController>(TasksController);
    service = module.get<TasksService>(TasksService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTask', () => {
    it('should create a new task', async () => {
      const createTaskDto: CreateTaskDto = {
        title: 'Test Task',
        description: 'Test description',
        category: 'code-review',
      };

      mockTasksService.createTask.mockResolvedValue({
        taskId: 'task-id',
        task: { id: 'task-id', ...createTaskDto },
      });

      const result = await controller.createTask('agent-id', createTaskDto);

      expect(result).toHaveProperty('taskId');
      expect(service.createTask).toHaveBeenCalledWith('agent-id', createTaskDto);
    });
  });

  describe('getTasks', () => {
    it('should return list of tasks', async () => {
      const mockTasks = [
        { id: 'task-1', title: 'Task 1' },
        { id: 'task-2', title: 'Task 2' },
      ];

      mockTasksService.getTasks.mockResolvedValue({
        total: 2,
        tasks: mockTasks,
      });

      const query: TaskQueryDto = { limit: 10, offset: 0 };
      const result = await controller.getTasks(query);

      expect(result.total).toBe(2);
      expect(result.tasks).toHaveLength(2);
      expect(service.getTasks).toHaveBeenCalledWith(query);
    });

    it('should filter tasks by status', async () => {
      mockTasksService.getTasks.mockResolvedValue({
        total: 1,
        tasks: [{ id: 'task-1', status: 'open' }],
      });

      const query: TaskQueryDto = { status: 'open' };
      await controller.getTasks(query);

      expect(service.getTasks).toHaveBeenCalledWith(query);
    });

    it('should filter tasks by category', async () => {
      mockTasksService.getTasks.mockResolvedValue({
        total: 1,
        tasks: [{ id: 'task-1', category: 'code-review' }],
      });

      const query: TaskQueryDto = { category: 'code-review' };
      await controller.getTasks(query);

      expect(service.getTasks).toHaveBeenCalledWith(query);
    });
  });

  describe('getTask', () => {
    it('should return task details', async () => {
      const mockTask = {
        id: 'task-id',
        title: 'Test Task',
        status: 'open',
      };

      mockTasksService.getTask.mockResolvedValue(mockTask);

      const result = await controller.getTask('task-id');

      expect(result).toEqual(mockTask);
      expect(service.getTask).toHaveBeenCalledWith('task-id');
    });
  });

  describe('bidTask', () => {
    it('should create a bid', async () => {
      const bidDto: BidTaskDto = {
        proposal: 'I can do this',
        estimatedTime: 3600,
      };

      mockTasksService.bidTask.mockResolvedValue({
        bidId: 'bid-id',
        bid: { id: 'bid-id', ...bidDto },
      });

      const result = await controller.bidTask('agent-id', 'task-id', bidDto);

      expect(result).toHaveProperty('bidId');
      expect(service.bidTask).toHaveBeenCalledWith('agent-id', 'task-id', bidDto);
    });
  });

  describe('acceptBid', () => {
    it('should accept a bid', async () => {
      mockTasksService.acceptBid.mockResolvedValue({
        task: { id: 'task-id', status: 'assigned' },
        bid: { id: 'bid-id', status: 'accepted' }
      });

      const result = await controller.acceptBid('agent-id', 'task-id', 'bid-id');

      expect(result.task.status).toBe('assigned');
      expect(service.acceptBid).toHaveBeenCalledWith('agent-id', 'task-id', 'bid-id');
    });
  });

  describe('submitTask', () => {
    it('should submit task result', async () => {
      const submitDto: SubmitTaskDto = {
        result: { review: 'Good code' },
      };

      mockTasksService.submitTask.mockResolvedValue({
        task: { id: 'task-id', status: 'reviewing', result: submitDto.result },
      });

      const result = await controller.submitTask('agent-id', 'task-id', submitDto);

      expect(result.task.status).toBe('reviewing');
      expect(service.submitTask).toHaveBeenCalledWith('agent-id', 'task-id', submitDto);
    });
  });

  describe('completeTask', () => {
    it('should complete task with rating', async () => {
      mockTasksService.completeTask.mockResolvedValue({
        task: { id: 'task-id', status: 'completed' },
      });

      const result = await controller.completeTask('agent-id', 'task-id', 5);

      expect(result.task.status).toBe('completed');
      expect(service.completeTask).toHaveBeenCalledWith('agent-id', 'task-id', 5);
    });
  });

  describe('getMyTasks', () => {
    it('should return my tasks', async () => {
      const mockTasks = [
        { id: 'task-1', title: 'Task 1' },
        { id: 'task-2', title: 'Task 2' },
      ];

      mockTasksService.getMyTasks.mockResolvedValue({
        total: 2,
        tasks: mockTasks,
      });

      const result = await controller.getMyTasks('agent-id');

      expect(result.total).toBe(2);
      expect(result.tasks).toHaveLength(2);
      expect(service.getMyTasks).toHaveBeenCalledWith('agent-id', undefined);
    });

    it('should filter my tasks by status', async () => {
      mockTasksService.getMyTasks.mockResolvedValue({
        total: 1,
        tasks: [{ id: 'task-1', status: 'completed' }],
      });

      await controller.getMyTasks('agent-id', 'completed');

      expect(service.getMyTasks).toHaveBeenCalledWith('agent-id', 'completed');
    });
  });
});
