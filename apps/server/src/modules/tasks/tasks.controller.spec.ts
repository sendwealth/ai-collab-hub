import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { CreateTaskDto, BidTaskDto, SubmitTaskDto } from './dto';

describe('TasksController', () => {
  let controller: TasksController;
  let service: TasksService;

  const mockTasksService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    getMyTasks: jest.fn(),
    bidTask: jest.fn(),
    acceptBid: jest.fn(),
    submitTask: jest.fn(),
    completeTask: jest.fn(),
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
    }).compile();

    controller = module.get<TasksController>(TasksController);
    service = module.get<TasksService>(TasksService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a task', async () => {
      const createTaskDto: CreateTaskDto = {
        title: 'Test Task',
        description: 'Test Description',
        category: 'testing',
        reward: { credits: 100 },
      };

      mockTasksService.create.mockResolvedValue({
        id: 'task-id',
        ...createTaskDto,
      });

      const result = await controller.create(createTaskDto, 'creator-id');

      expect(result.id).toBe('task-id');
      expect(service.create).toHaveBeenCalledWith('creator-id', createTaskDto);
    });
  });

  describe('findAll', () => {
    it('should return array of tasks', async () => {
      const mockTasks = [
        { id: 'task-1', title: 'Task 1' },
        { id: 'task-2', title: 'Task 2' },
      ];

      mockTasksService.findAll.mockResolvedValue({
        total: 2,
        tasks: mockTasks,
      });

      const result = await controller.findAll({});

      expect(result.total).toBe(2);
      expect(result.tasks).toHaveLength(2);
      expect(service.findAll).toHaveBeenCalledWith({});
    });
  });

  describe('findOne', () => {
    it('should return a task', async () => {
      mockTasksService.findOne.mockResolvedValue({
        id: 'task-id',
        title: 'Test Task',
      });

      const result = await controller.findOne('task-id');

      expect(result.id).toBe('task-id');
      expect(service.findOne).toHaveBeenCalledWith('task-id');
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
      expect(service.getMyTasks).toHaveBeenCalledWith('agent-id', {});
    });

    it('should filter my tasks by status', async () => {
      mockTasksService.getMyTasks.mockResolvedValue({
        total: 1,
        tasks: [{ id: 'task-1', status: 'completed' }],
      });

      await controller.getMyTasks('agent-id', 'completed');

      expect(service.getMyTasks).toHaveBeenCalledWith('agent-id', { status: 'completed' });
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
      expect(service.bidTask).toHaveBeenCalledWith('task-id', 'agent-id', bidDto);
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
      expect(service.acceptBid).toHaveBeenCalledWith('task-id', 'bid-id', 'agent-id');
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
      expect(service.submitTask).toHaveBeenCalledWith('task-id', 'agent-id', submitDto);
    });
  });

  describe('completeTask', () => {
    it('should complete task with rating', async () => {
      mockTasksService.completeTask.mockResolvedValue({
        task: { id: 'task-id', status: 'completed' },
      });

      const result = await controller.completeTask('agent-id', 'task-id', 5);

      expect(result.task.status).toBe('completed');
      expect(service.completeTask).toHaveBeenCalledWith('task-id', 'agent-id', { rating: 5 });
    });
  });
});
