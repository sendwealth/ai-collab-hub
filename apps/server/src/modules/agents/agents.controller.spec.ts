import { Test, TestingModule } from '@nestjs/testing';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';
import { CreateAgentDto, UpdateAgentDto, UpdateAgentStatusDto } from './dto';

describe('AgentsController', () => {
  let controller: AgentsController;
  let service: AgentsService;

  const mockAgentsService = {
    register: jest.fn(),
    getMe: jest.fn(),
    updateMe: jest.fn(),
    updateStatus: jest.fn(),
    discover: jest.fn(),
    getAgentProfile: jest.fn(),
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

    it('should handle registration with minimal data', async () => {
      const minimalDto: CreateAgentDto = {
        name: 'MinimalAgent',
        publicKey: 'test-key',
      };

      mockAgentsService.register.mockResolvedValue({
        agentId: 'agent-id',
        apiKey: 'sk_agent_test123',
        name: 'MinimalAgent',
      });

      const result = await controller.register(minimalDto);

      expect(result).toHaveProperty('agentId');
    });
  });

  describe('getMe', () => {
    it('should return current agent', async () => {
      const mockAgent = {
        id: 'agent-id',
        name: 'TestAgent',
      };

      mockAgentsService.getMe.mockResolvedValue(mockAgent);

      const result = await controller.getMe('agent-id');

      expect(result).toEqual(mockAgent);
      expect(service.getMe).toHaveBeenCalledWith('agent-id');
    });
  });

  describe('updateMe', () => {
    it('should update agent info', async () => {
      const updateDto: UpdateAgentDto = {
        description: 'Updated description',
      };

      const mockAgent = {
        message: 'Agent updated successfully',
        agent: {
          id: 'agent-id',
          name: 'TestAgent',
          description: 'Updated description',
          capabilities: {},
        },
      };

      mockAgentsService.updateMe.mockResolvedValue(mockAgent);

      const result = await controller.updateMe('agent-id', updateDto);

      expect(result.agent.description).toBe('Updated description');
      expect(service.updateMe).toHaveBeenCalledWith('agent-id', updateDto);
    });
  });

  describe('updateStatus', () => {
    it('should update agent status', async () => {
      const updateDto: UpdateAgentStatusDto = {
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

    it('should update to idle status', async () => {
      const updateDto: UpdateAgentStatusDto = {
        status: 'idle',
      };

      const mockAgent = {
        id: 'agent-id',
        status: 'idle',
      };

      mockAgentsService.updateStatus.mockResolvedValue(mockAgent);

      const result = await controller.updateStatus('agent-id', updateDto);

      expect(result.status).toBe('idle');
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

      const result = await controller.discover('code-review', undefined, '20');

      expect(result.agents).toHaveLength(1);
      expect(service.discover).toHaveBeenCalledWith({
        skill: 'code-review',
        status: undefined,
        limit: 20,
      });
    });

    it('should support status filter', async () => {
      mockAgentsService.discover.mockResolvedValue({
        agents: [],
        total: 0,
      });

      await controller.discover(undefined, 'idle', '20');

      expect(service.discover).toHaveBeenCalledWith({
        skill: undefined,
        status: 'idle',
        limit: 20,
      });
    });

    it('should support limit parameter', async () => {
      mockAgentsService.discover.mockResolvedValue({
        agents: [],
        total: 0,
      });

      await controller.discover(undefined, undefined, '50');

      expect(service.discover).toHaveBeenCalledWith({
        skill: undefined,
        status: undefined,
        limit: 50,
      });
    });
  });

  describe('getAgentProfile', () => {
    it('should return an agent by id', async () => {
      const mockAgent = {
        id: 'agent-id',
        name: 'TestAgent',
        status: 'idle',
        trustScore: 50,
      };

      mockAgentsService.getAgentProfile.mockResolvedValue(mockAgent);

      const result = await controller.getAgentProfile('agent-id');

      expect(result).toEqual(mockAgent);
      expect(service.getAgentProfile).toHaveBeenCalledWith('agent-id');
    });

    it('should throw NotFoundException if agent not found', async () => {
      mockAgentsService.getAgentProfile.mockRejectedValue(new Error('Not found'));

      await expect(controller.getAgentProfile('invalid-id')).rejects.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty results', async () => {
      mockAgentsService.discover.mockResolvedValue({
        agents: [],
        total: 0,
      });

      const result = await controller.discover();

      expect(result.agents).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should handle large datasets', async () => {
      const mockAgents = Array(100).fill({ id: 'agent-id' });

      mockAgentsService.discover.mockResolvedValue({
        agents: mockAgents,
        total: 100,
      });

      const result = await controller.discover(undefined, undefined, '100');

      expect(result.agents).toHaveLength(100);
    });
  });
});
