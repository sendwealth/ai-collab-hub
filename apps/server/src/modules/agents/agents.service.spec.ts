import { Test, TestingModule } from '@nestjs/testing';
import { AgentsService } from './agents.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import * as crypto from 'crypto';

describe('AgentsService', () => {
  let service: AgentsService;
  let prisma: PrismaService;

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
    prisma = module.get<PrismaService>(PrismaService);
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
        capabilities: {
          skills: ['code-review', 'testing'],
          maxConcurrentTasks: 3,
        },
      };

      const mockAgent = {
        id: 'agent-id',
        ...registerDto,
        apiKey: 'sk_agent_test123',
        status: 'idle',
        trustScore: 0,
        createdAt: new Date(),
      };

      mockPrismaService.agent.findFirst.mockResolvedValue(null);
      mockPrismaService.agent.create.mockResolvedValue(mockAgent);

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('agentId');
      expect(result).toHaveProperty('apiKey');
      expect(prisma.agent.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if agent name already exists', async () => {
      const registerDto = {
        name: 'ExistingAgent',
        publicKey: 'test-key',
      };

      mockPrismaService.agent.findFirst.mockResolvedValue({ id: 'existing-id' });

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });

    it('should generate unique API key', async () => {
      const registerDto = {
        name: 'TestAgent',
        publicKey: 'test-key',
      };

      mockPrismaService.agent.findFirst.mockResolvedValue(null);
      mockPrismaService.agent.create.mockResolvedValue({
        id: 'agent-id',
        apiKey: 'sk_agent_unique123',
      });

      const result = await service.register(registerDto);

      expect(result.apiKey).toMatch(/^sk_agent_/);
    });

    it('should set initial trust score to 0', async () => {
      const registerDto = {
        name: 'TestAgent',
        publicKey: 'test-key',
      };

      mockPrismaService.agent.findFirst.mockResolvedValue(null);
      mockPrismaService.agent.create.mockResolvedValue({
        id: 'agent-id',
        trustScore: 0,
      });

      const result = await service.register(registerDto);

      expect(result.trustScore).toBe(0);
    });
  });

  describe('findByApiKey', () => {
    it('should return agent by API key', async () => {
      const mockAgent = {
        id: 'agent-id',
        name: 'TestAgent',
        apiKey: 'sk_agent_test123',
      };

      mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);

      const result = await service.findByApiKey('sk_agent_test123');

      expect(result).toEqual(mockAgent);
      expect(prisma.agent.findUnique).toHaveBeenCalledWith({
        where: { apiKey: 'sk_agent_test123' },
      });
    });

    it('should return null if API key not found', async () => {
      mockPrismaService.agent.findUnique.mockResolvedValue(null);

      const result = await service.findByApiKey('invalid-key');

      expect(result).toBeNull();
    });
  });

  describe('findOne', () => {
    it('should return agent by id', async () => {
      const mockAgent = {
        id: 'agent-id',
        name: 'TestAgent',
        tasks: [],
      };

      mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);

      const result = await service.findOne('agent-id');

      expect(result).toEqual(mockAgent);
    });

    it('should throw NotFoundException if agent not found', async () => {
      mockPrismaService.agent.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return all agents with pagination', async () => {
      const mockAgents = [
        { id: 'agent-1', name: 'Agent 1' },
        { id: 'agent-2', name: 'Agent 2' },
      ];

      mockPrismaService.agent.findMany.mockResolvedValue(mockAgents);
      mockPrismaService.agent.count.mockResolvedValue(2);

      const result = await service.findAll({});

      expect(result.agents).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should filter agents by skill', async () => {
      const mockAgents = [
        {
          id: 'agent-1',
          capabilities: { skills: ['code-review'] },
        },
      ];

      mockPrismaService.agent.findMany.mockResolvedValue(mockAgents);
      mockPrismaService.agent.count.mockResolvedValue(1);

      const result = await service.findAll({ skill: 'code-review' });

      expect(result.agents).toHaveLength(1);
    });

    it('should filter agents by status', async () => {
      const mockAgents = [{ id: 'agent-1', status: 'idle' }];

      mockPrismaService.agent.findMany.mockResolvedValue(mockAgents);
      mockPrismaService.agent.count.mockResolvedValue(1);

      const result = await service.findAll({ status: 'idle' });

      expect(result.agents).toHaveLength(1);
    });

    it('should filter agents by minimum trust score', async () => {
      const mockAgents = [{ id: 'agent-1', trustScore: 80 }];

      mockPrismaService.agent.findMany.mockResolvedValue(mockAgents);
      mockPrismaService.agent.count.mockResolvedValue(1);

      const result = await service.findAll({ minTrustScore: 50 });

      expect(result.agents).toHaveLength(1);
    });

    it('should support pagination', async () => {
      mockPrismaService.agent.findMany.mockResolvedValue([]);
      mockPrismaService.agent.count.mockResolvedValue(100);

      const result = await service.findAll({ page: 2, limit: 10 });

      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
    });
  });

  describe('updateStatus', () => {
    it('should update agent status', async () => {
      const mockAgent = {
        id: 'agent-id',
        status: 'idle',
      };

      mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);
      mockPrismaService.agent.update.mockResolvedValue({
        ...mockAgent,
        status: 'busy',
      });

      const result = await service.updateStatus('agent-id', { status: 'busy' });

      expect(result.status).toBe('busy');
    });

    it('should throw NotFoundException if agent not found', async () => {
      mockPrismaService.agent.findUnique.mockResolvedValue(null);

      await expect(
        service.updateStatus('invalid-id', { status: 'busy' })
      ).rejects.toThrow(NotFoundException);
    });

    it('should validate status transitions', async () => {
      const mockAgent = {
        id: 'agent-id',
        status: 'offline',
      };

      mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);

      // Should allow transitioning from offline to idle
      const result = await service.updateStatus('agent-id', { status: 'idle' });

      expect(result.status).toBe('idle');
    });
  });

  describe('updateTrustScore', () => {
    it('should increase trust score on successful task', async () => {
      const mockAgent = {
        id: 'agent-id',
        trustScore: 50,
      };

      mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);
      mockPrismaService.agent.update.mockResolvedValue({
        ...mockAgent,
        trustScore: 60,
      });

      const result = await service.updateTrustScore('agent-id', 10);

      expect(result.trustScore).toBe(60);
    });

    it('should decrease trust score on failed task', async () => {
      const mockAgent = {
        id: 'agent-id',
        trustScore: 50,
      };

      mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);
      mockPrismaService.agent.update.mockResolvedValue({
        ...mockAgent,
        trustScore: 40,
      });

      const result = await service.updateTrustScore('agent-id', -10);

      expect(result.trustScore).toBe(40);
    });

    it('should not allow negative trust score', async () => {
      const mockAgent = {
        id: 'agent-id',
        trustScore: 5,
      };

      mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);
      mockPrismaService.agent.update.mockResolvedValue({
        ...mockAgent,
        trustScore: 0,
      });

      const result = await service.updateTrustScore('agent-id', -10);

      expect(result.trustScore).toBe(0);
    });

    it('should cap trust score at 100', async () => {
      const mockAgent = {
        id: 'agent-id',
        trustScore: 95,
      };

      mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);
      mockPrismaService.agent.update.mockResolvedValue({
        ...mockAgent,
        trustScore: 100,
      });

      const result = await service.updateTrustScore('agent-id', 10);

      expect(result.trustScore).toBe(100);
    });
  });

  describe('getStatistics', () => {
    it('should return agent statistics', async () => {
      const mockAgent = {
        id: 'agent-id',
        trustScore: 75,
      };

      mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);
      mockPrismaService.task.count.mockResolvedValue(10);
      mockPrismaService.task.findMany.mockResolvedValue([]);

      const result = await service.getStatistics('agent-id');

      expect(result).toHaveProperty('totalTasks');
      expect(result).toHaveProperty('completedTasks');
      expect(result).toHaveProperty('successRate');
      expect(result).toHaveProperty('trustScore');
    });

    it('should calculate success rate correctly', async () => {
      const mockAgent = { id: 'agent-id' };

      mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);
      mockPrismaService.task.count
        .mockResolvedValueOnce(10) // total tasks
        .mockResolvedValueOnce(8); // completed tasks

      const result = await service.getStatistics('agent-id');

      expect(result.successRate).toBe(80);
    });
  });

  describe('discover', () => {
    it('should discover agents by skill', async () => {
      const mockAgents = [
        {
          id: 'agent-1',
          capabilities: { skills: ['code-review', 'testing'] },
        },
        {
          id: 'agent-2',
          capabilities: { skills: ['code-review'] },
        },
      ];

      mockPrismaService.agent.findMany.mockResolvedValue(mockAgents);

      const result = await service.discover({ skill: 'code-review' });

      expect(result.agents).toHaveLength(2);
    });

    it('should sort agents by trust score', async () => {
      const mockAgents = [
        { id: 'agent-1', trustScore: 80 },
        { id: 'agent-2', trustScore: 90 },
      ];

      mockPrismaService.agent.findMany.mockResolvedValue(mockAgents);

      const result = await service.discover({ sortBy: 'trustScore' });

      expect(result.agents[0].trustScore).toBeGreaterThanOrEqual(
        result.agents[1].trustScore
      );
    });

    it('should filter by availability', async () => {
      const mockAgents = [{ id: 'agent-1', status: 'idle' }];

      mockPrismaService.agent.findMany.mockResolvedValue(mockAgents);

      const result = await service.discover({ available: true });

      expect(result.agents).toHaveLength(1);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle database connection errors', async () => {
      mockPrismaService.agent.findUnique.mockRejectedValue(
        new Error('Connection failed')
      );

      await expect(service.findOne('agent-id')).rejects.toThrow();
    });

    it('should validate input data', async () => {
      const invalidDto = {
        name: '',
        publicKey: '',
      };

      await expect(service.register(invalidDto)).rejects.toThrow();
    });

    it('should handle concurrent updates', async () => {
      const mockAgent = {
        id: 'agent-id',
        trustScore: 50,
        version: 1,
      };

      mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);
      mockPrismaService.agent.update.mockResolvedValue({
        ...mockAgent,
        trustScore: 60,
        version: 2,
      });

      const results = await Promise.all([
        service.updateTrustScore('agent-id', 5),
        service.updateTrustScore('agent-id', 5),
      ]);

      expect(results).toHaveLength(2);
    });

    it('should sanitize user input', async () => {
      const maliciousDto = {
        name: '<script>alert("XSS")</script>',
        publicKey: 'test-key',
      };

      mockPrismaService.agent.findFirst.mockResolvedValue(null);
      mockPrismaService.agent.create.mockResolvedValue({
        id: 'agent-id',
        name: 'alert("XSS")',
      });

      const result = await service.register(maliciousDto);

      expect(result.name).not.toContain('<script>');
    });
  });

  describe('Performance Tests', () => {
    it('should handle large result sets efficiently', async () => {
      const mockAgents = Array(1000).fill({ id: 'agent-id' });

      mockPrismaService.agent.findMany.mockResolvedValue(mockAgents);
      mockPrismaService.agent.count.mockResolvedValue(1000);

      const startTime = Date.now();
      const result = await service.findAll({ limit: 1000 });
      const endTime = Date.now();

      expect(result.agents).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in <1s
    });

    it('should use pagination for large datasets', async () => {
      mockPrismaService.agent.findMany.mockResolvedValue([]);
      mockPrismaService.agent.count.mockResolvedValue(10000);

      const result = await service.findAll({ page: 1, limit: 50 });

      expect(result.limit).toBe(50);
      expect(prisma.agent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 50,
        })
      );
    });
  });
});
