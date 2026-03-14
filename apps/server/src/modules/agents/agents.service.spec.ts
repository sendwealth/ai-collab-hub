import { Test, TestingModule } from '@nestjs/testing';
import { AgentsService } from './agents.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { UpdateAgentStatusDto } from './dto';

describe('AgentsService', () => {
  let service: AgentsService;

  const mockPrismaService = {
    agent: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    task: {
      count: jest.fn(),
      findMany: jest.fn(),
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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new agent successfully', async () => {
      const registerDto = {
        name: 'TestAgent',
        publicKey: 'test-public-key',
        description: 'Test agent description',
      };

      const mockAgent = {
        id: 'agent-id',
        ...registerDto,
        status: 'idle',
        trustScore: 0,
        apiKey: 'sk_agent_test123',
      };

      mockPrismaService.agent.create.mockResolvedValue(mockAgent);

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('agentId');
      expect(result).toHaveProperty('apiKey');
    });

    it('should throw ConflictException if agent name exists', async () => {
      const registerDto = {
        name: 'ExistingAgent',
        publicKey: 'test-key',
      };

      mockPrismaService.agent.findFirst.mockResolvedValue({ id: 'existing-id' });

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('getMe', () => {
    it('should return agent profile', async () => {
      const mockAgent = {
        id: 'agent-id',
        name: 'TestAgent',
        status: 'idle',
        trustScore: 50,
      };

      mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);

      const result = await service.getMe('agent-id');

      expect(result).toEqual(mockAgent);
    });

    it('should throw NotFoundException if agent not found', async () => {
      mockPrismaService.agent.findUnique.mockResolvedValue(null);

      await expect(service.getMe('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateMe', () => {
    it('should update agent info', async () => {
      const updateDto = {
        description: 'Updated description',
      };

      const mockAgent = {
        id: 'agent-id',
        description: 'Updated description',
      };

      mockPrismaService.agent.findUnique.mockResolvedValue({ id: 'agent-id' });
      mockPrismaService.agent.update.mockResolvedValue(mockAgent);

      const result = await service.updateMe('agent-id', updateDto);

      expect(result.agent.description).toBe('Updated description');
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

      mockPrismaService.agent.findUnique.mockResolvedValue({ id: 'agent-id' });
      mockPrismaService.agent.update.mockResolvedValue(mockAgent);

      const result = await service.updateStatus('agent-id', updateDto);

      expect(result.status).toBe('busy');
    });
  });

  describe('discover', () => {
    it('should discover agents by skill', async () => {
      const mockAgents = [
        {
          id: 'agent-1',
          capabilities: { skills: ['code-review'] },
        },
      ];

      mockPrismaService.agent.findMany.mockResolvedValue(mockAgents);

      const result = await service.discover({ skill: 'code-review' });

      expect(result.agents).toHaveLength(1);
    });

    it('should discover agents by status', async () => {
      const mockAgents = [
        {
          id: 'agent-1',
          status: 'idle',
        },
      ];

      mockPrismaService.agent.findMany.mockResolvedValue(mockAgents);

      const result = await service.discover({ status: 'idle' });

      expect(result.agents).toHaveLength(1);
    });
  });

  describe('getAgentProfile', () => {
    it('should return public agent profile', async () => {
      const mockAgent = {
        id: 'agent-id',
        name: 'TestAgent',
        status: 'idle',
        trustScore: 50,
      };

      mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);

      const result = await service.getAgentProfile('agent-id');

      expect(result).toEqual(mockAgent);
    });

    it('should throw NotFoundException if agent not found', async () => {
      mockPrismaService.agent.findUnique.mockResolvedValue(null);

      await expect(service.getAgentProfile('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('validateByApiKey', () => {
    it('should return agent for valid API key', async () => {
      const mockAgent = {
        id: 'agent-id',
        apiKey: 'sk_agent_test123',
        name: 'TestAgent',
      };

      mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);
      mockPrismaService.agent.update.mockResolvedValue(mockAgent);

      const result = await service.validateByApiKey('sk_agent_test123');

      expect(result).toEqual(mockAgent);
    });

    it('should return null for invalid API key', async () => {
      mockPrismaService.agent.findUnique.mockResolvedValue(null);

      const result = await service.validateByApiKey('invalid-key');

      expect(result).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle database errors gracefully', async () => {
      mockPrismaService.agent.findUnique.mockRejectedValue(new Error('Database error'));

      await expect(service.getMe('agent-id')).rejects.toThrow();
    });
  });
});
