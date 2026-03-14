import { Test, TestingModule } from '@nestjs/testing';
import { AgentsService } from '../src/modules/agents/agents.service';
import { PrismaService } from '../src/modules/common/prisma/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('AgentsService', () => {
  let service: AgentsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    agent: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AgentsService>(AgentsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new agent successfully', async () => {
      const createAgentDto = {
        name: 'Test Agent',
        publicKey: 'test-public-key',
        description: 'Test description',
        capabilities: { skills: ['code-review'] },
      };

      mockPrismaService.agent.findFirst.mockResolvedValue(null);
      mockPrismaService.agent.create.mockResolvedValue({
        id: 'agent-id',
        ...createAgentDto,
        apiKey: 'sk_agent_test',
        status: 'idle',
        trustScore: 0,
      });

      const result = await service.register(createAgentDto);

      expect(result).toHaveProperty('agentId');
      expect(result).toHaveProperty('apiKey');
      expect(result.apiKey).toMatch(/^sk_agent_/);
    });

    it('should throw ConflictException if agent name already exists', async () => {
      const createAgentDto = {
        name: 'Existing Agent',
        publicKey: 'test-public-key',
      };

      mockPrismaService.agent.findFirst.mockResolvedValue({
        id: 'existing-agent-id',
        name: 'Existing Agent',
      });

      await expect(service.register(createAgentDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should generate unique API keys', async () => {
      const createAgentDto = {
        name: 'Test Agent',
        publicKey: 'test-public-key',
      };

      mockPrismaService.agent.findFirst.mockResolvedValue(null);
      mockPrismaService.agent.create.mockResolvedValue({
        id: 'agent-id',
        ...createAgentDto,
        apiKey: 'sk_agent_test',
      });

      const result1 = await service.register(createAgentDto);
      createAgentDto.name = 'Test Agent 2';
      const result2 = await service.register(createAgentDto);

      expect(result1.apiKey).not.toBe(result2.apiKey);
    });
  });

  describe('getMe', () => {
    it('should return agent information', async () => {
      const agentId = 'test-agent-id';
      const mockAgent = {
        id: agentId,
        name: 'Test Agent',
        description: 'Test description',
        status: 'idle',
        trustScore: 50,
      };

      mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);

      const result = await service.getMe(agentId);

      expect(result).toEqual(mockAgent);
      expect(result.id).toBe(agentId);
    });

    it('should throw NotFoundException if agent not found', async () => {
      mockPrismaService.agent.findUnique.mockResolvedValue(null);

      await expect(service.getMe('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateStatus', () => {
    it('should update agent status successfully', async () => {
      const agentId = 'test-agent-id';
      const updateDto = { status: 'busy' as const };

      mockPrismaService.agent.update.mockResolvedValue({
        id: agentId,
        status: 'busy',
      });

      const result = await service.updateStatus(agentId, updateDto);

      expect(result.status).toBe('busy');
      expect(result.message).toBe('Status updated successfully');
    });

    it('should accept all valid status values', async () => {
      const statuses: Array<'idle' | 'busy' | 'offline'> = ['idle', 'busy', 'offline'];

      for (const status of statuses) {
        mockPrismaService.agent.update.mockResolvedValue({
          id: 'test-agent-id',
          status,
        });

        const result = await service.updateStatus('test-agent-id', { status });
        expect(result.status).toBe(status);
      }
    });
  });

  describe('discover', () => {
    it('should return agents filtered by skill', async () => {
      const mockAgents = [
        {
          id: 'agent-1',
          name: 'Code Review Agent',
          capabilities: { skills: ['code-review'] },
          status: 'idle',
        },
      ];

      mockPrismaService.agent.findMany.mockResolvedValue(mockAgents);

      const result = await service.discover({ skill: 'code-review' });

      expect(result.agents).toHaveLength(1);
      expect(result.agents[0].capabilities.skills).toContain('code-review');
    });

    it('should return agents filtered by status', async () => {
      const mockAgents = [
        {
          id: 'agent-1',
          name: 'Idle Agent',
          status: 'idle',
        },
      ];

      mockPrismaService.agent.findMany.mockResolvedValue(mockAgents);

      const result = await service.discover({ status: 'idle' });

      expect(result.agents).toHaveLength(1);
      expect(result.agents[0].status).toBe('idle');
    });

    it('should limit results', async () => {
      const mockAgents = Array(5).fill({
        id: 'agent-id',
        name: 'Agent',
      });

      mockPrismaService.agent.findMany.mockResolvedValue(mockAgents);

      const result = await service.discover({ limit: 5 });

      expect(mockPrismaService.agent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
        }),
      );
    });

    it('should sort by trust score descending', async () => {
      mockPrismaService.agent.findMany.mockResolvedValue([]);

      await service.discover({});

      expect(mockPrismaService.agent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            trustScore: 'desc',
          },
        }),
      );
    });
  });

  describe('validateByApiKey', () => {
    it('should return agent for valid API key', async () => {
      const mockAgent = {
        id: 'agent-id',
        name: 'Test Agent',
        apiKey: 'sk_agent_test',
      };

      mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);
      mockPrismaService.agent.update.mockResolvedValue(mockAgent);

      const result = await service.validateByApiKey('sk_agent_test');

      expect(result).toEqual(mockAgent);
    });

    it('should return null for invalid API key', async () => {
      mockPrismaService.agent.findUnique.mockResolvedValue(null);

      const result = await service.validateByApiKey('invalid-key');

      expect(result).toBeNull();
    });

    it('should update lastSeen when validating', async () => {
      const mockAgent = {
        id: 'agent-id',
        apiKey: 'sk_agent_test',
      };

      mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);
      mockPrismaService.agent.update.mockResolvedValue(mockAgent);

      await service.validateByApiKey('sk_agent_test');

      expect(mockPrismaService.agent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            lastSeen: expect.any(Date),
          }),
        }),
      );
    });
  });
});
