import { Test, TestingModule } from '@nestjs/testing';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';
import { CreateAgentDto, UpdateAgentDto, UpdateAgentStatusDto } from './dto';
import { ExecutionContext } from '@nestjs/common';
import { AgentAuthGuard } from '../auth/guards/agent-auth.guard';

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
    validateByApiKey: jest.fn(),
  };

  const mockAgentAuthGuard = {
    canActivate: jest.fn((context: ExecutionContext) => {
      const request = context.switchToHttp().getRequest();
      request.agent = { id: 'test-agent-id', name: 'TestAgent' };
      return true;
    }),
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
      .useValue(mockAgentAuthGuard)
      .compile();

    controller = module.get<AgentsController>(AgentsController);
    service = module.get<AgentsService>(AgentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ============================================
  // POST /api/v1/agents/register - Agent注册
  // ============================================
  describe('register', () => {
    const createDto: CreateAgentDto = {
      name: 'TestAgent',
      publicKey: 'test-public-key-123',
      description: 'Test agent description',
      capabilities: {
        skills: ['code-review', 'testing'],
        tools: ['jest', 'supertest'],
        protocols: ['http', 'websocket'],
        maxConcurrentTasks: 5,
        estimatedResponseTime: 2000,
      },
      endpoint: {
        http: 'https://api.testagent.com',
        websocket: 'wss://ws.testagent.com',
      },
      metadata: {
        version: '1.0.0',
        author: 'Test Team',
      },
    };

    it('should successfully register a new agent with full data', async () => {
      const mockResponse = {
        agentId: 'agent-uuid-123',
        apiKey: 'sk_agent_test123',
        message: 'Agent registered successfully',
      };

      mockAgentsService.register.mockResolvedValue(mockResponse);

      const result = await controller.register(createDto);

      expect(result).toEqual(mockResponse);
      expect(result).toHaveProperty('agentId');
      expect(result).toHaveProperty('apiKey');
      expect(result.apiKey).toMatch(/^sk_agent_/);
      expect(service.register).toHaveBeenCalledWith(createDto);
      expect(service.register).toHaveBeenCalledTimes(1);
    });

    it('should register agent with minimal required fields', async () => {
      const minimalDto: CreateAgentDto = {
        name: 'MinimalAgent',
        publicKey: 'minimal-key',
      };

      const mockResponse = {
        agentId: 'agent-minimal-id',
        apiKey: 'sk_agent_minimal',
        message: 'Agent registered successfully',
      };

      mockAgentsService.register.mockResolvedValue(mockResponse);

      const result = await controller.register(minimalDto);

      expect(result).toHaveProperty('agentId');
      expect(result).toHaveProperty('apiKey');
      expect(service.register).toHaveBeenCalledWith(minimalDto);
    });

    it('should handle registration with only name and publicKey', async () => {
      const basicDto: CreateAgentDto = {
        name: 'BasicAgent',
        publicKey: 'basic-key',
      };

      mockAgentsService.register.mockResolvedValue({
        agentId: 'agent-basic-id',
        apiKey: 'sk_agent_basic',
      });

      const result = await controller.register(basicDto);

      expect(result).toBeDefined();
    });

    it('should propagate conflict exception for duplicate name', async () => {
      const error = new Error('Agent name already exists');
      error.name = 'ConflictException';
      mockAgentsService.register.mockRejectedValue(error);

      await expect(controller.register(createDto)).rejects.toThrow();
    });

    it('should handle service errors during registration', async () => {
      mockAgentsService.register.mockRejectedValue(new Error('Database error'));

      await expect(controller.register(createDto)).rejects.toThrow('Database error');
    });
  });

  // ============================================
  // GET /api/v1/agents/me - 获取自己的信息
  // ============================================
  describe('getMe', () => {
    const agentId = 'test-agent-id';
    const mockAgent = {
      id: agentId,
      name: 'TestAgent',
      description: 'Test description',
      capabilities: { skills: ['testing'] },
      status: 'idle',
      trustScore: 75,
      createdAt: new Date(),
      lastSeen: new Date(),
    };

    it('should return current agent profile', async () => {
      mockAgentsService.getMe.mockResolvedValue(mockAgent);

      const result = await controller.getMe(agentId);

      expect(result).toEqual(mockAgent);
      expect(result).toHaveProperty('id', agentId);
      expect(result).toHaveProperty('name', 'TestAgent');
      expect(service.getMe).toHaveBeenCalledWith(agentId);
    });

    it('should not expose sensitive information', async () => {
      mockAgentsService.getMe.mockResolvedValue(mockAgent);

      const result = await controller.getMe(agentId);

      expect(result).not.toHaveProperty('apiKey');
      expect(result).not.toHaveProperty('publicKey');
    });

    it('should handle non-existent agent', async () => {
      mockAgentsService.getMe.mockRejectedValue(new Error('Agent not found'));

      await expect(controller.getMe('invalid-id')).rejects.toThrow();
    });

    it('should accept agent ID from decorator', async () => {
      mockAgentsService.getMe.mockResolvedValue(mockAgent);

      await controller.getMe(agentId);

      expect(service.getMe).toHaveBeenCalledWith(agentId);
    });
  });

  // ============================================
  // PUT /api/v1/agents/me - 更新自己的信息
  // ============================================
  describe('updateMe', () => {
    const agentId = 'test-agent-id';
    const updateDto: UpdateAgentDto = {
      description: 'Updated description',
      capabilities: { skills: ['new-skill'] },
      endpoint: { http: 'https://new-endpoint.com' },
      metadata: { updated: true },
    };

    it('should successfully update agent information', async () => {
      const mockResponse = {
        message: 'Agent updated successfully',
        agent: {
          id: agentId,
          name: 'TestAgent',
          description: 'Updated description',
          capabilities: { skills: ['new-skill'] },
        },
      };

      mockAgentsService.updateMe.mockResolvedValue(mockResponse);

      const result = await controller.updateMe(agentId, updateDto);

      expect(result).toEqual(mockResponse);
      expect(result.message).toBe('Agent updated successfully');
      expect(result.agent.description).toBe('Updated description');
      expect(service.updateMe).toHaveBeenCalledWith(agentId, updateDto);
    });

    it('should update only description', async () => {
      const partialDto: UpdateAgentDto = {
        description: 'Only description',
      };

      mockAgentsService.updateMe.mockResolvedValue({
        message: 'Agent updated successfully',
        agent: { id: agentId, description: 'Only description' },
      });

      const result = await controller.updateMe(agentId, partialDto);

      expect(result.agent.description).toBe('Only description');
    });

    it('should update only capabilities', async () => {
      const partialDto: UpdateAgentDto = {
        capabilities: { skills: ['updated-skill'] },
      };

      mockAgentsService.updateMe.mockResolvedValue({
        message: 'Agent updated successfully',
        agent: { id: agentId, capabilities: partialDto.capabilities },
      });

      const result = await controller.updateMe(agentId, partialDto);

      expect(result.agent.capabilities).toEqual(partialDto.capabilities);
    });

    it('should handle update errors', async () => {
      mockAgentsService.updateMe.mockRejectedValue(new Error('Update failed'));

      await expect(controller.updateMe(agentId, updateDto)).rejects.toThrow('Update failed');
    });

    it('should handle empty update object', async () => {
      const emptyDto: UpdateAgentDto = {};

      mockAgentsService.updateMe.mockResolvedValue({
        message: 'Agent updated successfully',
        agent: { id: agentId },
      });

      const result = await controller.updateMe(agentId, emptyDto);

      expect(result).toHaveProperty('message');
    });
  });

  // ============================================
  // PUT /api/v1/agents/me/status - 更新状态
  // ============================================
  describe('updateStatus', () => {
    const agentId = 'test-agent-id';

    it('should update status to busy', async () => {
      const updateDto: UpdateAgentStatusDto = { status: 'busy' };
      const mockResponse = {
        message: 'Status updated successfully',
        status: 'busy',
      };

      mockAgentsService.updateStatus.mockResolvedValue(mockResponse);

      const result = await controller.updateStatus(agentId, updateDto);

      expect(result.status).toBe('busy');
      expect(result.message).toBe('Status updated successfully');
      expect(service.updateStatus).toHaveBeenCalledWith(agentId, updateDto);
    });

    it('should update status to idle', async () => {
      const updateDto: UpdateAgentStatusDto = { status: 'idle' };

      mockAgentsService.updateStatus.mockResolvedValue({
        message: 'Status updated successfully',
        status: 'idle',
      });

      const result = await controller.updateStatus(agentId, updateDto);

      expect(result.status).toBe('idle');
    });

    it('should update status to offline', async () => {
      const updateDto: UpdateAgentStatusDto = { status: 'offline' };

      mockAgentsService.updateStatus.mockResolvedValue({
        message: 'Status updated successfully',
        status: 'offline',
      });

      const result = await controller.updateStatus(agentId, updateDto);

      expect(result.status).toBe('offline');
    });

    it('should handle invalid status value', async () => {
      const invalidDto = { status: 'invalid' } as any;

      mockAgentsService.updateStatus.mockRejectedValue(new Error('Invalid status'));

      await expect(controller.updateStatus(agentId, invalidDto)).rejects.toThrow();
    });

    it('should call service with correct parameters', async () => {
      const updateDto: UpdateAgentStatusDto = { status: 'busy' };

      mockAgentsService.updateStatus.mockResolvedValue({
        message: 'Status updated successfully',
        status: 'busy',
      });

      await controller.updateStatus(agentId, updateDto);

      expect(service.updateStatus).toHaveBeenCalledWith(agentId, updateDto);
      expect(service.updateStatus).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================
  // GET /api/v1/agents - 发现Agent
  // ============================================
  describe('discover', () => {
    const mockAgents = [
      {
        id: 'agent-1',
        name: 'CodeReviewer',
        description: 'Code review agent',
        capabilities: { skills: ['code-review'] },
        status: 'idle',
        trustScore: 90,
      },
      {
        id: 'agent-2',
        name: 'DataAnalyzer',
        description: 'Data analysis agent',
        capabilities: { skills: ['data-analysis'] },
        status: 'busy',
        trustScore: 85,
      },
    ];

    it('should return list of all agents without filters', async () => {
      const mockResponse = {
        total: 2,
        agents: mockAgents,
      };

      mockAgentsService.discover.mockResolvedValue(mockResponse);

      const result = await controller.discover(undefined, undefined, undefined);

      expect(result.total).toBe(2);
      expect(result.agents).toHaveLength(2);
      expect(service.discover).toHaveBeenCalledWith({
        skill: undefined,
        status: undefined,
        limit: 20,
      });
    });

    it('should filter agents by skill', async () => {
      const mockResponse = {
        total: 1,
        agents: [mockAgents[0]],
      };

      mockAgentsService.discover.mockResolvedValue(mockResponse);

      const result = await controller.discover('code-review', undefined, undefined);

      expect(result.total).toBe(1);
      expect(service.discover).toHaveBeenCalledWith({
        skill: 'code-review',
        status: undefined,
        limit: 20,
      });
    });

    it('should filter agents by status', async () => {
      const mockResponse = {
        total: 1,
        agents: [mockAgents[0]],
      };

      mockAgentsService.discover.mockResolvedValue(mockResponse);

      const result = await controller.discover(undefined, 'idle', undefined);

      expect(result.total).toBe(1);
      expect(service.discover).toHaveBeenCalledWith({
        skill: undefined,
        status: 'idle',
        limit: 20,
      });
    });

    it('should filter by both skill and status', async () => {
      mockAgentsService.discover.mockResolvedValue({
        total: 1,
        agents: [mockAgents[0]],
      });

      await controller.discover('code-review', 'idle', '10');

      expect(service.discover).toHaveBeenCalledWith({
        skill: 'code-review',
        status: 'idle',
        limit: 10,
      });
    });

    it('should respect limit parameter', async () => {
      mockAgentsService.discover.mockResolvedValue({
        total: 0,
        agents: [],
      });

      await controller.discover(undefined, undefined, '50');

      expect(service.discover).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 50,
        })
      );
    });

    it('should parse limit as integer', async () => {
      mockAgentsService.discover.mockResolvedValue({
        total: 0,
        agents: [],
      });

      await controller.discover(undefined, undefined, '25');

      expect(service.discover).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 25,
        })
      );
    });

    it('should return empty array when no agents match', async () => {
      mockAgentsService.discover.mockResolvedValue({
        total: 0,
        agents: [],
      });

      const result = await controller.discover('nonexistent-skill', undefined, undefined);

      expect(result.total).toBe(0);
      expect(result.agents).toHaveLength(0);
    });

    it('should handle large result sets', async () => {
      const manyAgents = Array(100).fill(null).map((_, i) => ({
        id: `agent-${i}`,
        name: `Agent${i}`,
        status: 'idle',
        trustScore: i,
      }));

      mockAgentsService.discover.mockResolvedValue({
        total: 100,
        agents: manyAgents,
      });

      const result = await controller.discover(undefined, undefined, '100');

      expect(result.agents).toHaveLength(100);
    });

    it('should handle service errors', async () => {
      mockAgentsService.discover.mockRejectedValue(new Error('Database error'));

      await expect(controller.discover()).rejects.toThrow('Database error');
    });
  });

  // ============================================
  // GET /api/v1/agents/:id - 获取Agent公开信息
  // ============================================
  describe('getAgentProfile', () => {
    const agentId = 'public-agent-id';
    const mockProfile = {
      id: agentId,
      name: 'PublicAgent',
      description: 'Public profile',
      capabilities: { skills: ['public-skill'] },
      status: 'idle',
      trustScore: 80,
      createdAt: new Date(),
    };

    it('should return agent public profile', async () => {
      mockAgentsService.getAgentProfile.mockResolvedValue(mockProfile);

      const result = await controller.getAgentProfile(agentId);

      expect(result).toEqual(mockProfile);
      expect(result).toHaveProperty('id', agentId);
      expect(result).toHaveProperty('name', 'PublicAgent');
      expect(service.getAgentProfile).toHaveBeenCalledWith(agentId);
    });

    it('should not expose sensitive fields', async () => {
      mockAgentsService.getAgentProfile.mockResolvedValue(mockProfile);

      const result = await controller.getAgentProfile(agentId);

      expect(result).not.toHaveProperty('apiKey');
      expect(result).not.toHaveProperty('publicKey');
      expect(result).not.toHaveProperty('endpoint');
      expect(result).not.toHaveProperty('metadata');
    });

    it('should throw NotFoundException for non-existent agent', async () => {
      mockAgentsService.getAgentProfile.mockRejectedValue(new Error('Agent not found'));

      await expect(controller.getAgentProfile('invalid-id')).rejects.toThrow();
    });

    it('should accept any valid UUID as agent ID', async () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      mockAgentsService.getAgentProfile.mockResolvedValue({
        id: uuid,
        name: 'UUIDAgent',
      });

      const result = await controller.getAgentProfile(uuid);

      expect(result.id).toBe(uuid);
    });

    it('should handle service errors', async () => {
      mockAgentsService.getAgentProfile.mockRejectedValue(new Error('Service error'));

      await expect(controller.getAgentProfile(agentId)).rejects.toThrow('Service error');
    });
  });

  // ============================================
  // Edge Cases
  // ============================================
  describe('Edge Cases', () => {
    it('should handle concurrent requests to same endpoint', async () => {
      const mockAgent = { id: 'agent-id', name: 'Test' };
      mockAgentsService.getMe.mockResolvedValue(mockAgent);

      const requests = Array(10).fill(null).map(() => controller.getMe('agent-id'));
      const results = await Promise.all(requests);

      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result).toEqual(mockAgent);
      });
    });

    it('should handle special characters in query parameters', async () => {
      mockAgentsService.discover.mockResolvedValue({
        total: 0,
        agents: [],
      });

      await controller.discover('skill-with-special-chars-!@#$%', 'idle', '10');

      expect(service.discover).toHaveBeenCalledWith({
        skill: 'skill-with-special-chars-!@#$%',
        status: 'idle',
        limit: 10,
      });
    });

    it('should handle unicode characters in skill filter', async () => {
      mockAgentsService.discover.mockResolvedValue({
        total: 0,
        agents: [],
      });

      await controller.discover('技能-测试', undefined, undefined);

      expect(service.discover).toHaveBeenCalledWith(
        expect.objectContaining({
          skill: '技能-测试',
        })
      );
    });

    it('should handle very long skill names', async () => {
      const longSkill = 'A'.repeat(1000);
      mockAgentsService.discover.mockResolvedValue({
        total: 0,
        agents: [],
      });

      await controller.discover(longSkill, undefined, undefined);

      expect(service.discover).toHaveBeenCalledWith(
        expect.objectContaining({
          skill: longSkill,
        })
      );
    });

    it('should handle zero limit parameter', async () => {
      mockAgentsService.discover.mockResolvedValue({
        total: 0,
        agents: [],
      });

      await controller.discover(undefined, undefined, '0');

      expect(service.discover).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 0,
        })
      );
    });

    it('should handle negative limit parameter', async () => {
      mockAgentsService.discover.mockResolvedValue({
        total: 0,
        agents: [],
      });

      await controller.discover(undefined, undefined, '-10');

      expect(service.discover).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: -10,
        })
      );
    });

    it('should handle malformed limit parameter', async () => {
      mockAgentsService.discover.mockResolvedValue({
        total: 0,
        agents: [],
      });

      await controller.discover(undefined, undefined, 'not-a-number');

      expect(service.discover).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: NaN,
        })
      );
    });
  });

  // ============================================
  // Performance Tests
  // ============================================
  describe('Performance', () => {
    it('should handle rapid successive requests', async () => {
      const mockAgent = { id: 'agent-id', name: 'Test' };
      mockAgentsService.getMe.mockResolvedValue(mockAgent);

      const start = Date.now();
      for (let i = 0; i < 100; i++) {
        await controller.getMe('agent-id');
      }
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(1000); // Should handle 100 requests in <1s
    });

    it('should not block on slow service calls', async () => {
      mockAgentsService.getMe.mockImplementation(() => {
        return new Promise(resolve => setTimeout(() => resolve({ id: 'agent-id' }), 100));
      });

      const requests = Array(5).fill(null).map(() => controller.getMe('agent-id'));
      const start = Date.now();
      await Promise.all(requests);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(600); // Should run in parallel, not sequentially
    });
  });

  // ============================================
  // Integration-like Tests
  // ============================================
  describe('Controller-Service Integration', () => {
    it('should properly pass DTOs to service layer', async () => {
      const createDto: CreateAgentDto = {
        name: 'IntegrationTestAgent',
        publicKey: 'test-key',
        description: 'Integration test',
        capabilities: {
          skills: ['testing'],
          maxConcurrentTasks: 5,
        },
      };

      mockAgentsService.register.mockResolvedValue({
        agentId: 'agent-id',
        apiKey: 'sk_agent_test',
      });

      await controller.register(createDto);

      expect(service.register).toHaveBeenCalledWith(createDto);
      expect(service.register).toHaveBeenCalledTimes(1);
    });

    it('should maintain data integrity through layers', async () => {
      const updateDto: UpdateAgentDto = {
        description: 'Updated',
        capabilities: { skills: ['new'] },
      };

      mockAgentsService.updateMe.mockResolvedValue({
        message: 'Updated',
        agent: { id: 'agent-id', ...updateDto },
      });

      const result = await controller.updateMe('agent-id', updateDto);

      expect(result.agent.description).toBe(updateDto.description);
      expect(result.agent.capabilities).toEqual(updateDto.capabilities);
    });

    it('should handle complete agent lifecycle', async () => {
      // 1. Register
      const createDto: CreateAgentDto = {
        name: 'LifecycleAgent',
        publicKey: 'lifecycle-key',
      };

      mockAgentsService.register.mockResolvedValue({
        agentId: 'lifecycle-id',
        apiKey: 'sk_agent_lifecycle',
      });

      const registerResult = await controller.register(createDto);
      expect(registerResult).toHaveProperty('agentId');

      // 2. Get profile
      mockAgentsService.getMe.mockResolvedValue({
        id: 'lifecycle-id',
        name: 'LifecycleAgent',
        status: 'idle',
      });

      const profile = await controller.getMe('lifecycle-id');
      expect(profile.status).toBe('idle');

      // 3. Update status
      mockAgentsService.updateStatus.mockResolvedValue({
        message: 'Status updated',
        status: 'busy',
      });

      const statusResult = await controller.updateStatus('lifecycle-id', { status: 'busy' });
      expect(statusResult.status).toBe('busy');

      // 4. Update info
      mockAgentsService.updateMe.mockResolvedValue({
        message: 'Updated',
        agent: { id: 'lifecycle-id', description: 'Updated' },
      });

      const updateResult = await controller.updateMe('lifecycle-id', {
        description: 'Updated',
      });
      expect(updateResult.agent.description).toBe('Updated');

      // 5. Discover
      mockAgentsService.discover.mockResolvedValue({
        total: 1,
        agents: [{ id: 'lifecycle-id', name: 'LifecycleAgent' }],
      });

      const discoverResult = await controller.discover(undefined, 'busy', undefined);
      expect(discoverResult.total).toBe(1);
    });
  });
});
