import { Test, TestingModule } from '@nestjs/testing';
import { AgentsService } from './agents.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { CacheService } from '../cache';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { CreateAgentDto, UpdateAgentDto, UpdateAgentStatusDto } from './dto';

describe('AgentsService', () => {
  let service: AgentsService;
  let prismaService: PrismaService;
  let cacheService: CacheService;

  // Mock Prisma Service
  const mockPrismaService = {
    agent: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    task: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn((fn) => fn()),
  };

  // Mock Cache Service
  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    invalidate: jest.fn(),
    getOrSet: jest.fn((_key, factory, _ttl) => factory()),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<AgentsService>(AgentsService);
    prismaService = module.get<PrismaService>(PrismaService);
    cacheService = module.get<CacheService>(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Restore all mock implementations
    mockCacheService.get.mockResolvedValue(undefined);
    mockCacheService.set.mockResolvedValue(undefined);
    mockCacheService.del.mockResolvedValue(undefined);
    mockCacheService.invalidate.mockResolvedValue(undefined);
    mockCacheService.getOrSet.mockImplementation((_key, factory, _ttl) => factory());
  });

  // ============================================
  // register() - Agent注册
  // ============================================
  describe('register', () => {
    const createAgentDto: CreateAgentDto = {
      name: 'TestAgent',
      publicKey: 'test-public-key-123',
      description: 'Test agent for unit testing',
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

    it('should successfully register a new agent with all fields', async () => {
      const mockCreatedAgent = {
        id: 'agent-uuid-123',
        name: createAgentDto.name,
        description: createAgentDto.description,
        publicKey: createAgentDto.publicKey,
        capabilities: JSON.stringify(createAgentDto.capabilities),
        endpoint: JSON.stringify(createAgentDto.endpoint),
        metadata: JSON.stringify(createAgentDto.metadata),
        apiKey: 'sk_agent_test123',
        status: 'idle',
        trustScore: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.agent.findFirst.mockResolvedValue(null);
      mockPrismaService.agent.create.mockResolvedValue(mockCreatedAgent);
      mockCacheService.invalidate.mockResolvedValue(undefined);

      const result = await service.register(createAgentDto);

      expect(result).toHaveProperty('agentId', 'agent-uuid-123');
      expect(result).toHaveProperty('apiKey');
      expect(result.apiKey).toMatch(/^sk_agent_/);
      expect(result).toHaveProperty('message', 'Agent registered successfully');
      expect(mockPrismaService.agent.findFirst).toHaveBeenCalledWith({
        where: { name: createAgentDto.name },
      });
      expect(mockCacheService.invalidate).toHaveBeenCalledWith('agents:*');
    });

    it('should successfully register an agent with minimal required fields', async () => {
      const minimalDto: CreateAgentDto = {
        name: 'MinimalAgent',
        publicKey: 'minimal-key',
      };

      const mockCreatedAgent = {
        id: 'agent-minimal-id',
        name: minimalDto.name,
        publicKey: minimalDto.publicKey,
        description: null,
        capabilities: null,
        endpoint: null,
        metadata: null,
        apiKey: 'sk_agent_minimal',
        status: 'idle',
        trustScore: 0,
      };

      mockPrismaService.agent.findFirst.mockResolvedValue(null);
      mockPrismaService.agent.create.mockResolvedValue(mockCreatedAgent);
      mockCacheService.invalidate.mockResolvedValue(undefined);

      const result = await service.register(minimalDto);

      expect(result).toHaveProperty('agentId');
      expect(result).toHaveProperty('apiKey');
      expect(mockPrismaService.agent.create).toHaveBeenCalled();
    });

    it('should throw ConflictException when agent name already exists', async () => {
      const existingAgent = {
        id: 'existing-agent-id',
        name: createAgentDto.name,
      };

      mockPrismaService.agent.findFirst.mockResolvedValue(existingAgent);

      await expect(service.register(createAgentDto)).rejects.toThrow(ConflictException);
      await expect(service.register(createAgentDto)).rejects.toThrow('Agent name already exists');
      expect(mockPrismaService.agent.create).not.toHaveBeenCalled();
    });

    it('should generate unique API keys for different agents', async () => {
      const agent1 = { id: 'agent-1', apiKey: 'sk_agent_111', name: 'Agent1', publicKey: 'key1' };
      const agent2 = { id: 'agent-2', apiKey: 'sk_agent_222', name: 'Agent2', publicKey: 'key2' };

      mockPrismaService.agent.findFirst.mockResolvedValue(null);
      mockPrismaService.agent.create
        .mockResolvedValueOnce(agent1)
        .mockResolvedValueOnce(agent2);

      const result1 = await service.register({ name: 'Agent1', publicKey: 'key1' });
      const result2 = await service.register({ name: 'Agent2', publicKey: 'key2' });

      expect(result1.apiKey).not.toBe(result2.apiKey);
    });

    it('should clear cache after successful registration', async () => {
      const mockAgent = {
        id: 'agent-id',
        name: 'TestAgent',
        publicKey: 'key',
        apiKey: 'sk_agent_test',
      };

      mockPrismaService.agent.findFirst.mockResolvedValue(null);
      mockPrismaService.agent.create.mockResolvedValue(mockAgent);
      mockCacheService.invalidate.mockResolvedValue(undefined);

      await service.register(createAgentDto);

      expect(mockCacheService.invalidate).toHaveBeenCalledWith('agents:*');
    });

    it('should handle database errors during registration', async () => {
      mockPrismaService.agent.findFirst.mockResolvedValue(null);
      mockPrismaService.agent.create.mockRejectedValue(new Error('Database connection failed'));

      await expect(service.register(createAgentDto)).rejects.toThrow('Database connection failed');
    });
  });

  // ============================================
  // getMe() - 查询自己的信息
  // ============================================
  describe('getMe', () => {
    const agentId = 'agent-test-id';
    const mockAgent = {
      id: agentId,
      name: 'TestAgent',
      description: 'Test description',
      capabilities: JSON.stringify({ skills: ['testing'] }),
      endpoint: JSON.stringify({ http: 'https://test.com' }),
      metadata: JSON.stringify({ version: '1.0' }),
      status: 'idle',
      trustScore: 75,
      createdAt: new Date(),
      lastSeen: new Date(),
    };

    it('should return agent profile for valid agent ID', async () => {
      mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);

      const result = await service.getMe(agentId);

      expect(result).toEqual(mockAgent);
      expect(mockPrismaService.agent.findUnique).toHaveBeenCalledWith({
        where: { id: agentId },
        select: {
          id: true,
          name: true,
          description: true,
          capabilities: true,
          endpoint: true,
          metadata: true,
          status: true,
          trustScore: true,
          createdAt: true,
          lastSeen: true,
        },
      });
    });

    it('should throw NotFoundException for non-existent agent', async () => {
      mockPrismaService.agent.findUnique.mockResolvedValue(null);

      await expect(service.getMe('invalid-id')).rejects.toThrow(NotFoundException);
      await expect(service.getMe('invalid-id')).rejects.toThrow('Agent not found');
    });

    it('should use cache for repeated requests', async () => {
      mockCacheService.getOrSet.mockImplementation(async (key, factory) => {
        return factory();
      });
      mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);

      await service.getMe(agentId);
      await service.getMe(agentId);

      expect(mockCacheService.getOrSet).toHaveBeenCalledTimes(2);
    });

    it('should not expose sensitive information', async () => {
      mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);

      const result = await service.getMe(agentId);

      expect(result).not.toHaveProperty('apiKey');
      expect(result).not.toHaveProperty('publicKey');
    });
  });

  // ============================================
  // updateMe() - 更新Agent信息
  // ============================================
  describe('updateMe', () => {
    const agentId = 'agent-update-id';
    const updateDto: UpdateAgentDto = {
      description: 'Updated description',
      capabilities: { skills: ['new-skill'] },
      endpoint: { http: 'https://new-endpoint.com' },
      metadata: { updated: true },
    };

    it('should successfully update agent information', async () => {
      const mockUpdatedAgent = {
        id: agentId,
        name: 'TestAgent',
        description: updateDto.description,
        capabilities: updateDto.capabilities,
        endpoint: updateDto.endpoint,
        metadata: updateDto.metadata,
        updatedAt: new Date(),
      };

      mockPrismaService.agent.update.mockResolvedValue(mockUpdatedAgent);
      mockCacheService.del.mockResolvedValue(undefined);
      mockCacheService.invalidate.mockResolvedValue(undefined);

      const result = await service.updateMe(agentId, updateDto);

      expect(result).toHaveProperty('message', 'Agent updated successfully');
      expect(result.agent.description).toBe(updateDto.description);
      expect(mockPrismaService.agent.update).toHaveBeenCalledWith({
        where: { id: agentId },
        data: {
          ...updateDto,
          updatedAt: expect.any(Date),
        },
      });
    });

    it('should update only description field', async () => {
      const partialUpdate: UpdateAgentDto = {
        description: 'Only description updated',
      };

      const mockUpdatedAgent = {
        id: agentId,
        description: partialUpdate.description,
        capabilities: null,
        endpoint: null,
        metadata: null,
      };

      mockPrismaService.agent.update.mockResolvedValue(mockUpdatedAgent);

      const result = await service.updateMe(agentId, partialUpdate);

      expect(result.agent.description).toBe(partialUpdate.description);
    });

    it('should clear relevant caches after update', async () => {
      mockPrismaService.agent.update.mockResolvedValue({ id: agentId });
      mockCacheService.del.mockResolvedValue(undefined);
      mockCacheService.invalidate.mockResolvedValue(undefined);

      await service.updateMe(agentId, updateDto);

      expect(mockCacheService.del).toHaveBeenCalledWith(`agent:me:${agentId}`);
      expect(mockCacheService.del).toHaveBeenCalledWith(`agent:profile:${agentId}`);
      expect(mockCacheService.invalidate).toHaveBeenCalledWith('agents:*');
    });

    it('should handle partial updates correctly', async () => {
      const partialDto: UpdateAgentDto = {
        metadata: { key: 'value' },
      };

      mockPrismaService.agent.update.mockResolvedValue({
        id: agentId,
        metadata: partialDto.metadata,
      });

      const result = await service.updateMe(agentId, partialDto);

      expect(result).toHaveProperty('message');
    });

    it('should handle database errors during update', async () => {
      mockPrismaService.agent.update.mockRejectedValue(new Error('Update failed'));

      await expect(service.updateMe(agentId, updateDto)).rejects.toThrow('Update failed');
    });
  });

  // ============================================
  // updateStatus() - 更新Agent状态
  // ============================================
  describe('updateStatus', () => {
    const agentId = 'agent-status-id';

    it('should successfully update status to busy', async () => {
      const updateDto: UpdateAgentStatusDto = { status: 'busy' };
      const mockUpdatedAgent = {
        id: agentId,
        status: 'busy',
        lastSeen: new Date(),
      };

      mockPrismaService.agent.update.mockResolvedValue(mockUpdatedAgent);
      mockCacheService.del.mockResolvedValue(undefined);
      mockCacheService.invalidate.mockResolvedValue(undefined);

      const result = await service.updateStatus(agentId, updateDto);

      expect(result).toHaveProperty('message', 'Status updated successfully');
      expect(result.status).toBe('busy');
      expect(mockPrismaService.agent.update).toHaveBeenCalledWith({
        where: { id: agentId },
        data: {
          status: 'busy',
          lastSeen: expect.any(Date),
        },
      });
    });

    it('should successfully update status to idle', async () => {
      const updateDto: UpdateAgentStatusDto = { status: 'idle' };

      mockPrismaService.agent.update.mockResolvedValue({
        id: agentId,
        status: 'idle',
      });

      const result = await service.updateStatus(agentId, updateDto);

      expect(result.status).toBe('idle');
    });

    it('should successfully update status to offline', async () => {
      const updateDto: UpdateAgentStatusDto = { status: 'offline' };

      mockPrismaService.agent.update.mockResolvedValue({
        id: agentId,
        status: 'offline',
      });

      const result = await service.updateStatus(agentId, updateDto);

      expect(result.status).toBe('offline');
    });

    it('should update lastSeen timestamp when status changes', async () => {
      const updateDto: UpdateAgentStatusDto = { status: 'busy' };
      const now = new Date();

      mockPrismaService.agent.update.mockResolvedValue({
        id: agentId,
        status: 'busy',
        lastSeen: now,
      });

      const result = await service.updateStatus(agentId, updateDto);

      expect(mockPrismaService.agent.update).toHaveBeenCalledWith({
        where: { id: agentId },
        data: {
          status: 'busy',
          lastSeen: expect.any(Date),
        },
      });
    });

    it('should clear cache after status update', async () => {
      mockPrismaService.agent.update.mockResolvedValue({ id: agentId, status: 'idle' });
      mockCacheService.del.mockResolvedValue(undefined);
      mockCacheService.invalidate.mockResolvedValue(undefined);

      await service.updateStatus(agentId, { status: 'idle' });

      expect(mockCacheService.del).toHaveBeenCalledWith(`agent:me:${agentId}`);
      expect(mockCacheService.invalidate).toHaveBeenCalledWith('agents:*');
    });
  });

  // ============================================
  // discover() - 发现Agent
  // ============================================
  describe('discover', () => {
    const mockAgents = [
      {
        id: 'agent-1',
        name: 'CodeReviewer',
        description: 'Code review agent',
        capabilities: JSON.stringify({ skills: ['code-review', 'testing'] }),
        status: 'idle',
        trustScore: 90,
        lastSeen: new Date(),
      },
      {
        id: 'agent-2',
        name: 'DataAnalyzer',
        description: 'Data analysis agent',
        capabilities: JSON.stringify({ skills: ['data-analysis', 'python'] }),
        status: 'busy',
        trustScore: 85,
        lastSeen: new Date(),
      },
    ];

    it('should discover agents by skill', async () => {
      mockPrismaService.agent.findMany.mockResolvedValue([mockAgents[0]]);

      const result = await service.discover({ skill: 'code-review' });

      expect(result).toHaveProperty('total', 1);
      expect(result.agents).toHaveLength(1);
      expect(mockPrismaService.agent.findMany).toHaveBeenCalledWith({
        where: {
          capabilities: {
            path: ['skills'],
            array_contains: ['code-review'],
          },
        },
        select: expect.any(Object),
        take: 20,
        orderBy: { trustScore: 'desc' },
      });
    });

    it('should discover agents by status', async () => {
      mockPrismaService.agent.findMany.mockResolvedValue([mockAgents[0]]);

      const result = await service.discover({ status: 'idle' });

      expect(result.total).toBe(1);
      expect(mockPrismaService.agent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'idle' },
        })
      );
    });

    it('should discover agents with combined filters', async () => {
      mockPrismaService.agent.findMany.mockResolvedValue([mockAgents[0]]);

      const result = await service.discover({
        skill: 'code-review',
        status: 'idle',
      });

      expect(result.total).toBe(1);
    });

    it('should respect limit parameter', async () => {
      mockPrismaService.agent.findMany.mockResolvedValue(mockAgents);

      const result = await service.discover({ limit: 2 });

      expect(mockPrismaService.agent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 2,
        })
      );
    });

    it('should use default limit of 20 when not specified', async () => {
      mockPrismaService.agent.findMany.mockResolvedValue([]);

      await service.discover({});

      expect(mockPrismaService.agent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
        })
      );
    });

    it('should order results by trustScore descending', async () => {
      mockPrismaService.agent.findMany.mockResolvedValue(mockAgents);

      await service.discover({});

      expect(mockPrismaService.agent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { trustScore: 'desc' },
        })
      );
    });

    it('should return empty array when no agents match', async () => {
      mockPrismaService.agent.findMany.mockResolvedValue([]);

      const result = await service.discover({ skill: 'nonexistent-skill' });

      expect(result.total).toBe(0);
      expect(result.agents).toHaveLength(0);
    });

    it('should use cache for discover queries', async () => {
      mockCacheService.getOrSet.mockImplementation(async (key, factory) => {
        return factory();
      });
      mockPrismaService.agent.findMany.mockResolvedValue(mockAgents);

      await service.discover({ status: 'idle' });

      expect(mockCacheService.getOrSet).toHaveBeenCalled();
    });
  });

  // ============================================
  // getAgentProfile() - 获取Agent公开信息
  // ============================================
  describe('getAgentProfile', () => {
    const agentId = 'agent-profile-id';
    const mockProfile = {
      id: agentId,
      name: 'PublicAgent',
      description: 'Public profile',
      capabilities: JSON.stringify({ skills: ['public-skill'] }),
      status: 'idle',
      trustScore: 80,
      createdAt: new Date(),
    };

    it('should return public agent profile', async () => {
      mockPrismaService.agent.findUnique.mockResolvedValue(mockProfile);

      const result = await service.getAgentProfile(agentId);

      expect(result).toEqual(mockProfile);
      expect(mockPrismaService.agent.findUnique).toHaveBeenCalledWith({
        where: { id: agentId },
        select: {
          id: true,
          name: true,
          description: true,
          capabilities: true,
          status: true,
          trustScore: true,
          createdAt: true,
        },
      });
    });

    it('should throw NotFoundException for non-existent agent', async () => {
      mockPrismaService.agent.findUnique.mockResolvedValue(null);

      await expect(service.getAgentProfile('invalid-id')).rejects.toThrow(NotFoundException);
      await expect(service.getAgentProfile('invalid-id')).rejects.toThrow('Agent not found');
    });

    it('should not expose sensitive fields', async () => {
      mockPrismaService.agent.findUnique.mockResolvedValue(mockProfile);

      const result = await service.getAgentProfile(agentId);

      expect(result).not.toHaveProperty('apiKey');
      expect(result).not.toHaveProperty('publicKey');
      expect(result).not.toHaveProperty('endpoint');
      expect(result).not.toHaveProperty('metadata');
    });

    it('should use cache for profile queries', async () => {
      mockCacheService.getOrSet.mockImplementation(async (key, factory) => {
        return factory();
      });
      mockPrismaService.agent.findUnique.mockResolvedValue(mockProfile);

      await service.getAgentProfile(agentId);

      expect(mockCacheService.getOrSet).toHaveBeenCalledWith(
        `agent:profile:${agentId}`,
        expect.any(Function),
        600
      );
    });
  });

  // ============================================
  // validateByApiKey() - 根据API Key验证Agent
  // ============================================
  describe('validateByApiKey', () => {
    const validApiKey = 'sk_agent_valid123';
    const mockAgent = {
      id: 'agent-validate-id',
      name: 'ValidAgent',
      apiKey: validApiKey,
      status: 'idle',
    };

    it('should return agent for valid API key', async () => {
      mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);
      mockPrismaService.agent.update.mockResolvedValue(mockAgent);

      const result = await service.validateByApiKey(validApiKey);

      expect(result).toEqual(mockAgent);
      expect(mockPrismaService.agent.findUnique).toHaveBeenCalledWith({
        where: { apiKey: validApiKey },
      });
    });

    it('should return null for invalid API key', async () => {
      mockPrismaService.agent.findUnique.mockResolvedValue(null);

      const result = await service.validateByApiKey('invalid-key');

      expect(result).toBeNull();
    });

    it('should update lastSeen timestamp on successful validation', async () => {
      mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);
      mockPrismaService.agent.update.mockResolvedValue(mockAgent);

      await service.validateByApiKey(validApiKey);

      expect(mockPrismaService.agent.update).toHaveBeenCalledWith({
        where: { id: mockAgent.id },
        data: { lastSeen: expect.any(Date) },
      });
    });

    it('should not update lastSeen for invalid API key', async () => {
      mockPrismaService.agent.findUnique.mockResolvedValue(null);

      await service.validateByApiKey('invalid-key');

      expect(mockPrismaService.agent.update).not.toHaveBeenCalled();
    });

    it('should handle database errors during validation', async () => {
      mockPrismaService.agent.findUnique.mockRejectedValue(new Error('DB error'));

      await expect(service.validateByApiKey(validApiKey)).rejects.toThrow('DB error');
    });
  });

  // ============================================
  // Edge Cases and Error Handling
  // ============================================
  describe('Edge Cases and Error Handling', () => {
    it('should handle concurrent registrations of same name', async () => {
      const dto = { name: 'ConcurrentAgent', publicKey: 'key' };

      mockPrismaService.agent.findFirst.mockResolvedValue(null);
      mockPrismaService.agent.create.mockRejectedValue(
        new Error('Unique constraint violation')
      );

      await expect(service.register(dto)).rejects.toThrow();
    });

    it('should handle cache service failures gracefully', async () => {
      const mockAgent = { id: 'agent-id', name: 'Test', apiKey: 'key' };

      mockPrismaService.agent.findFirst.mockResolvedValue(null);
      mockPrismaService.agent.create.mockResolvedValue(mockAgent);
      mockCacheService.invalidate.mockRejectedValue(new Error('Cache error'));

      const result = await service.register({
        name: 'Test',
        publicKey: 'key',
      });

      expect(result).toHaveProperty('agentId');
    });

    it('should handle malformed JSON in capabilities', async () => {
      const agentWithBadJson = {
        id: 'agent-id',
        capabilities: 'not-valid-json',
      };

      mockPrismaService.agent.findUnique.mockResolvedValue(agentWithBadJson);

      const result = await service.getMe('agent-id');

      expect(result).toBeDefined();
    });

    it('should handle very long agent names', async () => {
      const longName = 'A'.repeat(1000);
      const dto = { name: longName, publicKey: 'key' };

      mockPrismaService.agent.findFirst.mockResolvedValue(null);
      mockPrismaService.agent.create.mockResolvedValue({
        id: 'agent-id',
        name: longName,
      });

      const result = await service.register(dto);

      expect(result).toHaveProperty('agentId');
    });

    it('should handle special characters in agent name', async () => {
      const specialName = 'Agent-测试_🤖';
      const dto = { name: specialName, publicKey: 'key' };

      mockPrismaService.agent.findFirst.mockResolvedValue(null);
      mockPrismaService.agent.create.mockResolvedValue({
        id: 'agent-id',
        name: specialName,
      });

      const result = await service.register(dto);

      expect(result).toHaveProperty('agentId');
    });

    it('should handle null and undefined values in updates', async () => {
      const updateDto: UpdateAgentDto = {
        description: null as any,
        capabilities: undefined,
      };

      mockPrismaService.agent.update.mockResolvedValue({
        id: 'agent-id',
        ...updateDto,
      });

      const result = await service.updateMe('agent-id', updateDto);

      expect(result).toHaveProperty('message');
    });

    it('should handle large datasets in discover', async () => {
      const manyAgents = Array(100).fill(null).map((_, i) => ({
        id: `agent-${i}`,
        name: `Agent${i}`,
        status: 'idle',
        trustScore: i,
      }));

      mockPrismaService.agent.findMany.mockResolvedValue(manyAgents);

      const result = await service.discover({ limit: 100 });

      expect(result.agents).toHaveLength(100);
    });

    it('should handle database connection timeouts', async () => {
      mockPrismaService.agent.findUnique.mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Connection timeout')), 100);
        });
      });

      await expect(service.getMe('agent-id')).rejects.toThrow();
    }, 5000);
  });

  // ============================================
  // Performance Tests
  // ============================================
  describe('Performance', () => {
    it('should complete registration within reasonable time', async () => {
      const dto = { name: 'PerfAgent', publicKey: 'key' };

      mockPrismaService.agent.findFirst.mockResolvedValue(null);
      mockPrismaService.agent.create.mockResolvedValue({
        id: 'agent-id',
        ...dto,
      });

      const start = Date.now();
      await service.register(dto);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle multiple concurrent requests', async () => {
      const requests = Array(10).fill(null).map((_, i) => {
        const dto = { name: `Agent${i}`, publicKey: `key${i}` };
        mockPrismaService.agent.findFirst.mockResolvedValue(null);
        mockPrismaService.agent.create.mockResolvedValue({
          id: `agent-${i}`,
          ...dto,
        });
        return service.register(dto);
      });

      const results = await Promise.all(requests);

      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result).toHaveProperty('agentId');
      });
    });
  });
});
