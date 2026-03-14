import { Test, TestingModule } from '@nestjs/testing';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';
import { CreateAgentDto, UpdateStatusDto } from './dto';

describe('AgentsController', () => {
  let controller: AgentsController;
  let service: AgentsService;

  const mockAgentsService = {
    register: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByApiKey: jest.fn(),
    updateStatus: jest.fn(),
    discover: jest.fn(),
    getStatistics: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AgentsController],
      providers: [
        {
          provide: AgentsService,
          useValue: mockAgentsService,
        },
      ],
    }).compile();

    controller = module.get<AgentsController>(AgentsController);
    service = module.get<AgentsService>(AgentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a new agent', async () => {
      const createDto: CreateAgentDto = {
        name: 'TestAgent',
        publicKey: 'test-key',
        description: 'Test agent',
        capabilities: {
          skills: ['testing'],
          maxConcurrentTasks: 3,
        },
      };

      mockAgentsService.register.mockResolvedValue({
        agentId: 'agent-id',
        apiKey: 'sk_agent_test123',
        ...createDto,
      });

      const result = await controller.register(createDto);

      expect(result).toHaveProperty('agentId');
      expect(result).toHaveProperty('apiKey');
      expect(service.register).toHaveBeenCalledWith(createDto);
    });

    it('should validate required fields', async () => {
      const invalidDto = {
        name: '',
        publicKey: '',
      };

      await expect(controller.register(invalidDto as any)).rejects.toThrow();
    });
  });

  describe('findAll', () => {
    it('should return paginated list of agents', async () => {
      const mockAgents = [
        { id: 'agent-1', name: 'Agent 1' },
        { id: 'agent-2', name: 'Agent 2' },
      ];

      mockAgentsService.findAll.mockResolvedValue({
        agents: mockAgents,
        total: 2,
        page: 1,
        limit: 10,
      });

      const result = await controller.findAll({});

      expect(result.agents).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(service.findAll).toHaveBeenCalledWith({});
    });

    it('should support filtering by skill', async () => {
      mockAgentsService.findAll.mockResolvedValue({
        agents: [],
        total: 0,
      });

      await controller.findAll({ skill: 'code-review' });

      expect(service.findAll).toHaveBeenCalledWith({ skill: 'code-review' });
    });

    it('should support filtering by status', async () => {
      mockAgentsService.findAll.mockResolvedValue({
        agents: [],
        total: 0,
      });

      await controller.findAll({ status: 'idle' });

      expect(service.findAll).toHaveBeenCalledWith({ status: 'idle' });
    });

    it('should support pagination', async () => {
      mockAgentsService.findAll.mockResolvedValue({
        agents: [],
        total: 100,
        page: 2,
        limit: 20,
      });

      const result = await controller.findAll({ page: 2, limit: 20 });

      expect(result.page).toBe(2);
      expect(result.limit).toBe(20);
    });
  });

  describe('findOne', () => {
    it('should return an agent by id', async () => {
      const mockAgent = {
        id: 'agent-id',
        name: 'TestAgent',
        status: 'idle',
        trustScore: 50,
      };

      mockAgentsService.findOne.mockResolvedValue(mockAgent);

      const result = await controller.findOne('agent-id');

      expect(result).toEqual(mockAgent);
      expect(service.findOne).toHaveBeenCalledWith('agent-id');
    });

    it('should throw NotFoundException if agent not found', async () => {
      mockAgentsService.findOne.mockRejectedValue(new Error('Not found'));

      await expect(controller.findOne('invalid-id')).rejects.toThrow();
    });
  });

  describe('getMe', () => {
    it('should return current agent from request', async () => {
      const mockAgent = {
        id: 'agent-id',
        name: 'TestAgent',
      };

      const mockRequest = {
        agent: mockAgent,
      };

      const result = await controller.getMe(mockRequest);

      expect(result).toEqual(mockAgent);
    });
  });

  describe('updateStatus', () => {
    it('should update agent status', async () => {
      const updateDto: UpdateStatusDto = {
        status: 'busy',
      };

      const mockAgent = {
        id: 'agent-id',
        status: 'busy',
      };

      mockAgentsService.updateStatus.mockResolvedValue(mockAgent);

      const result = await controller.updateStatus('agent-id', updateDto);

      expect(result.status).toBe('busy');
      expect(service.updateStatus).toHaveBeenCalledWith('agent-id', updateDto);
    });

    it('should validate status values', async () => {
      const invalidDto = {
        status: 'invalid-status',
      };

      await expect(
        controller.updateStatus('agent-id', invalidDto as any)
      ).rejects.toThrow();
    });
  });

  describe('discover', () => {
    it('should discover agents by criteria', async () => {
      const mockAgents = [
        {
          id: 'agent-1',
          capabilities: { skills: ['code-review'] },
        },
      ];

      mockAgentsService.discover.mockResolvedValue({
        agents: mockAgents,
        total: 1,
      });

      const result = await controller.discover({ skill: 'code-review' });

      expect(result.agents).toHaveLength(1);
      expect(service.discover).toHaveBeenCalledWith({ skill: 'code-review' });
    });

    it('should support sorting', async () => {
      mockAgentsService.discover.mockResolvedValue({
        agents: [],
        total: 0,
      });

      await controller.discover({ sortBy: 'trustScore' });

      expect(service.discover).toHaveBeenCalledWith({ sortBy: 'trustScore' });
    });

    it('should support availability filter', async () => {
      mockAgentsService.discover.mockResolvedValue({
        agents: [],
        total: 0,
      });

      await controller.discover({ available: true });

      expect(service.discover).toHaveBeenCalledWith({ available: true });
    });
  });

  describe('getStatistics', () => {
    it('should return agent statistics', async () => {
      const mockStats = {
        totalTasks: 10,
        completedTasks: 8,
        successRate: 80,
        trustScore: 75,
      };

      mockAgentsService.getStatistics.mockResolvedValue(mockStats);

      const result = await controller.getStatistics('agent-id');

      expect(result).toEqual(mockStats);
      expect(service.getStatistics).toHaveBeenCalledWith('agent-id');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty results', async () => {
      mockAgentsService.findAll.mockResolvedValue({
        agents: [],
        total: 0,
      });

      const result = await controller.findAll({});

      expect(result.agents).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should handle large datasets', async () => {
      const mockAgents = Array(100).fill({ id: 'agent-id' });

      mockAgentsService.findAll.mockResolvedValue({
        agents: mockAgents,
        total: 100,
      });

      const result = await controller.findAll({ limit: 100 });

      expect(result.agents).toHaveLength(100);
    });

    it('should validate pagination parameters', async () => {
      mockAgentsService.findAll.mockResolvedValue({
        agents: [],
        total: 0,
      });

      await controller.findAll({ page: -1, limit: 0 });

      expect(service.findAll).toHaveBeenCalled();
    });
  });
});
