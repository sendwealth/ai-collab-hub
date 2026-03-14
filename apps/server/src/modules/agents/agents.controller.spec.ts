import { Test, TestingModule } from '@nestjs/testing';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';
import { CreateAgentDto, UpdateAgentDto, UpdateAgentStatusDto } from './dto';
import { AgentAuthGuard } from '../auth/guards/agent-auth.guard';

describe('AgentsController', () => {
  let controller: AgentsController;
  let service: AgentsService;

  const mockAgentsService = {
    register: jest.fn(),
    getMe: jest.fn(),
    updateStatus: jest.fn(),
    discover: jest.fn(),
    getAgentProfile: jest.fn(),
    updateMe: jest.fn(),
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

    controller = module.get<AgentsController>(AgentsController);
    service = module.get<AgentsService>(AgentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new agent', async () => {
      const createAgentDto: CreateAgentDto = {
        name: 'Test Agent',
        publicKey: 'test-key',
        description: 'Test description',
      };

      mockAgentsService.register.mockResolvedValue({
        agentId: 'agent-id',
        apiKey: 'sk_agent_test',
      });

      const result = await controller.register(createAgentDto);

      expect(result).toHaveProperty('agentId');
      expect(result).toHaveProperty('apiKey');
      expect(service.register).toHaveBeenCalledWith(createAgentDto);
    });
  });

  describe('getMe', () => {
    it('should return current agent info', async () => {
      const mockAgent = {
        id: 'agent-id',
        name: 'Test Agent',
        status: 'idle',
      };

      mockAgentsService.getMe.mockResolvedValue(mockAgent);

      const result = await controller.getMe('agent-id');

      expect(result).toEqual(mockAgent);
      expect(service.getMe).toHaveBeenCalledWith('agent-id');
    });
  });

  describe('updateStatus', () => {
    it('should update agent status', async () => {
      const updateDto: UpdateAgentStatusDto = {
        status: 'busy',
      };

      mockAgentsService.updateStatus.mockResolvedValue({
        status: 'busy',
        message: 'Status updated successfully',
      });

      const result = await controller.updateStatus('agent-id', updateDto);

      expect(result.status).toBe('busy');
      expect(service.updateStatus).toHaveBeenCalledWith('agent-id', updateDto);
    });
  });

  describe('discover', () => {
    it('should return list of agents', async () => {
      const mockAgents = [
        { id: 'agent-1', name: 'Agent 1' },
        { id: 'agent-2', name: 'Agent 2' },
      ];

      mockAgentsService.discover.mockResolvedValue({
        total: 2,
        agents: mockAgents,
      });

      const result = await controller.discover(undefined, undefined, '10');

      expect(result.total).toBe(2);
      expect(result.agents).toHaveLength(2);
      expect(service.discover).toHaveBeenCalledWith({
        skill: undefined,
        status: undefined,
        limit: 10,
      });
    });

    it('should filter agents by status', async () => {
      mockAgentsService.discover.mockResolvedValue({
        total: 1,
        agents: [{ id: 'agent-1', status: 'idle' }],
      });

      await controller.discover(undefined, 'idle', undefined);

      expect(service.discover).toHaveBeenCalledWith({
        skill: undefined,
        status: 'idle',
        limit: 20,
      });
    });

    it('should filter agents by skill', async () => {
      mockAgentsService.discover.mockResolvedValue({
        total: 1,
        agents: [{ id: 'agent-1', capabilities: { skills: ['code-review'] } }],
      });

      await controller.discover('code-review', undefined, undefined);

      expect(service.discover).toHaveBeenCalledWith({
        skill: 'code-review',
        status: undefined,
        limit: 20,
      });
    });
  });

  describe('getAgentProfile', () => {
    it('should return agent public profile', async () => {
      const mockAgent = {
        id: 'agent-id',
        name: 'Test Agent',
        status: 'idle',
        trustScore: 50,
      };

      mockAgentsService.getAgentProfile.mockResolvedValue(mockAgent);

      const result = await controller.getAgentProfile('agent-id');

      expect(result).toEqual(mockAgent);
      expect(service.getAgentProfile).toHaveBeenCalledWith('agent-id');
    });
  });

  describe('updateMe', () => {
    it('should update agent profile', async () => {
      const updateDto: UpdateAgentDto = {
        description: 'Updated description',
      };

      mockAgentsService.updateMe.mockResolvedValue({
        id: 'agent-id',
        description: 'Updated description',
      });

      await controller.updateMe('agent-id', updateDto);

      expect(service.updateMe).toHaveBeenCalledWith('agent-id', updateDto);
    });
  });
});
