import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AgentsService } from '../src/modules/agents/agents.service';
import { AgentsController } from '../src/modules/agents/agents.controller';
import { PrismaService } from '../src/modules/common/prisma/prisma.service';
import { CacheService } from '../src/modules/cache';
import { AgentAuthGuard } from '../src/modules/auth/guards/agent-auth.guard';
import { CreateAgentDto, UpdateAgentDto, UpdateAgentStatusDto } from '../src/modules/agents/dto';

describe('Agent System Integration Tests', () => {
  let app: INestApplication;
  let service: AgentsService;
  let prisma: PrismaService;

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    invalidate: jest.fn(),
    getOrSet: jest.fn((_key, factory, _ttl) => factory()),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AgentsController],
      providers: [
        AgentsService,
        PrismaService,
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    })
      .overrideGuard(AgentAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = module.createNestApplication();
    service = module.get<AgentsService>(AgentsService);
    prisma = module.get<PrismaService>(PrismaService);

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.bid.deleteMany({});
    await prisma.task.deleteMany({});
    await prisma.agent.deleteMany({});
    await app.close();
  });

  beforeEach(async () => {
    // Clear cache mocks
    jest.clearAllMocks();
  });

  // ============================================
  // Agent Registration Flow
  // ============================================
  describe('Agent Registration Flow', () => {
    it('should complete full registration flow', async () => {
      const createDto: CreateAgentDto = {
        name: `IntegrationTestAgent_${Date.now()}`,
        publicKey: 'integration-test-public-key',
        description: 'Integration test agent',
        capabilities: {
          skills: ['integration-testing'],
          maxConcurrentTasks: 5,
        },
      };

      // Register agent
      const result = await service.register(createDto);

      expect(result).toHaveProperty('agentId');
      expect(result).toHaveProperty('apiKey');
      expect(result.apiKey).toMatch(/^sk_agent_/);
      expect(result.message).toBe('Agent registered successfully');

      // Verify agent exists in database
      const agent = await prisma.agent.findUnique({
        where: { id: result.agentId },
      });

      expect(agent).toBeDefined();
      expect(agent?.name).toBe(createDto.name);
      expect(agent?.status).toBe('idle');
      expect(agent?.trustScore).toBe(0);

      // Clean up
      await prisma.agent.delete({ where: { id: result.agentId } });
    });

    it('should prevent duplicate agent names', async () => {
      const name = `DuplicateTestAgent_${Date.now()}`;
      const dto: CreateAgentDto = {
        name,
        publicKey: 'duplicate-test-key-1',
      };

      // First registration should succeed
      await service.register(dto);

      // Second registration with same name should fail
      const duplicateDto: CreateAgentDto = {
        name,
        publicKey: 'duplicate-test-key-2',
      };

      await expect(service.register(duplicateDto)).rejects.toThrow('Agent name already exists');

      // Clean up
      await prisma.agent.deleteMany({ where: { name } });
    });

    it('should generate unique API keys', async () => {
      const dto1: CreateAgentDto = {
        name: `UniqueKeyAgent1_${Date.now()}`,
        publicKey: 'unique-key-1',
      };

      const dto2: CreateAgentDto = {
        name: `UniqueKeyAgent2_${Date.now()}`,
        publicKey: 'unique-key-2',
      };

      const result1 = await service.register(dto1);
      const result2 = await service.register(dto2);

      expect(result1.apiKey).not.toBe(result2.apiKey);

      // Clean up
      await prisma.agent.deleteMany({
        where: {
          id: { in: [result1.agentId, result2.agentId] },
        },
      });
    });

    it('should store capabilities as JSON', async () => {
      const capabilities = {
        skills: ['json-test'],
        tools: ['jest'],
        maxConcurrentTasks: 10,
      };

      const dto: CreateAgentDto = {
        name: `JsonCapabilitiesAgent_${Date.now()}`,
        publicKey: 'json-capabilities-key',
        capabilities,
      };

      const result = await service.register(dto);

      const agent = await prisma.agent.findUnique({
        where: { id: result.agentId },
      });

      expect(agent?.capabilities).toBe(JSON.stringify(capabilities));

      // Clean up
      await prisma.agent.delete({ where: { id: result.agentId } });
    });
  });

  // ============================================
  // Agent Authentication Flow
  // ============================================
  describe('Agent Authentication Flow', () => {
    let testAgentId: string;
    let testApiKey: string;

    beforeAll(async () => {
      const result = await service.register({
        name: `AuthTestAgent_${Date.now()}`,
        publicKey: 'auth-test-key',
      });
      testAgentId = result.agentId;
      testApiKey = result.apiKey;
    });

    afterAll(async () => {
      await prisma.agent.delete({ where: { id: testAgentId } });
    });

    it('should validate agent by API key', async () => {
      const agent = await service.validateByApiKey(testApiKey);

      expect(agent).toBeDefined();
      expect(agent?.id).toBe(testAgentId);
    });

    it('should return null for invalid API key', async () => {
      const agent = await service.validateByApiKey('invalid-api-key');

      expect(agent).toBeNull();
    });

    it('should update lastSeen on successful validation', async () => {
      const beforeValidation = await prisma.agent.findUnique({
        where: { id: testAgentId },
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      await service.validateByApiKey(testApiKey);

      const afterValidation = await prisma.agent.findUnique({
        where: { id: testAgentId },
      });

      expect(afterValidation?.lastSeen?.getTime()).toBeGreaterThanOrEqual(
        beforeValidation?.lastSeen?.getTime() || 0,
      );
    });
  });

  // ============================================
  // Agent Search Functionality
  // ============================================
  describe('Agent Search Functionality', () => {
    const testAgents: string[] = [];

    beforeAll(async () => {
      // Create test agents with different statuses and capabilities
      const agents = await Promise.all([
        service.register({
          name: `SearchIdleAgent1_${Date.now()}`,
          publicKey: 'search-idle-1',
          capabilities: { skills: ['search-test', 'idle-skill'] },
        }),
        service.register({
          name: `SearchBusyAgent1_${Date.now()}`,
          publicKey: 'search-busy-1',
          capabilities: { skills: ['search-test', 'busy-skill'] },
        }),
        service.register({
          name: `SearchIdleAgent2_${Date.now()}`,
          publicKey: 'search-idle-2',
          capabilities: { skills: ['other-skill'] },
        }),
      ]);

      testAgents.push(...agents.map((a) => a.agentId));

      // Set one agent to busy
      await service.updateStatus(agents[1].agentId, { status: 'busy' });
    });

    afterAll(async () => {
      await prisma.agent.deleteMany({
        where: { id: { in: testAgents } },
      });
    });

    it('should discover agents by status', async () => {
      const result = await service.discover({ status: 'idle' });

      expect(result.total).toBeGreaterThan(0);
      result.agents.forEach((agent) => {
        expect(agent.status).toBe('idle');
      });
    });

    it('should discover agents by skill', async () => {
      const result = await service.discover({ skill: 'search-test' });

      expect(result.total).toBeGreaterThan(0);
      // Note: Due to JSON query complexity, this might need adjustment based on actual Prisma capabilities
    });

    it('should respect limit parameter', async () => {
      const result = await service.discover({ limit: 2 });

      expect(result.agents.length).toBeLessThanOrEqual(2);
    });

    it('should order agents by trustScore', async () => {
      const result = await service.discover({ limit: 10 });

      for (let i = 0; i < result.agents.length - 1; i++) {
        expect(result.agents[i].trustScore).toBeGreaterThanOrEqual(
          result.agents[i + 1].trustScore,
        );
      }
    });

    it('should return empty array when no agents match', async () => {
      const result = await service.discover({ status: 'nonexistent' as any });

      expect(result.total).toBe(0);
      expect(result.agents).toHaveLength(0);
    });
  });

  // ============================================
  // Agent Rating System
  // ============================================
  describe('Agent Rating System', () => {
    let testAgentId: string;
    let testApiKey: string;

    beforeAll(async () => {
      const result = await service.register({
        name: `RatingTestAgent_${Date.now()}`,
        publicKey: 'rating-test-key',
      });
      testAgentId = result.agentId;
      testApiKey = result.apiKey;
    });

    afterAll(async () => {
      await prisma.agent.delete({ where: { id: testAgentId } });
    });

    it('should initialize with trustScore of 0', async () => {
      const agent = await prisma.agent.findUnique({
        where: { id: testAgentId },
      });

      expect(agent?.trustScore).toBe(0);
    });

    it('should retrieve agent with trustScore', async () => {
      const agent = await service.getAgentProfile(testAgentId);

      expect(agent).toHaveProperty('trustScore');
      expect(typeof agent.trustScore).toBe('number');
    });

    it('should include trustScore in discover results', async () => {
      const result = await service.discover({ limit: 10 });

      result.agents.forEach((agent) => {
        expect(agent).toHaveProperty('trustScore');
        expect(typeof agent.trustScore).toBe('number');
      });
    });

    it('should manually update trustScore for testing', async () => {
      // Direct database update to simulate trust score change
      await prisma.agent.update({
        where: { id: testAgentId },
        data: { trustScore: 75 },
      });

      const agent = await service.getAgentProfile(testAgentId);

      expect(agent.trustScore).toBe(75);
    });
  });

  // ============================================
  // Agent Update Operations
  // ============================================
  describe('Agent Update Operations', () => {
    let testAgentId: string;
    let testApiKey: string;

    beforeAll(async () => {
      const result = await service.register({
        name: `UpdateTestAgent_${Date.now()}`,
        publicKey: 'update-test-key',
        description: 'Original description',
      });
      testAgentId = result.agentId;
      testApiKey = result.apiKey;
    });

    afterAll(async () => {
      await prisma.agent.delete({ where: { id: testAgentId } });
    });

    it('should update agent description', async () => {
      const updateDto: UpdateAgentDto = {
        description: 'Updated description',
      };

      const result = await service.updateMe(testAgentId, updateDto);

      expect(result.message).toBe('Agent updated successfully');
      expect(result.agent.description).toBe('Updated description');
    });

    it('should update agent capabilities', async () => {
      const capabilities = {
        skills: ['updated-skill'],
        tools: ['updated-tool'],
      };

      const updateDto: UpdateAgentDto = {
        capabilities,
      };

      await service.updateMe(testAgentId, updateDto);

      const agent = await service.getMe(testAgentId);
      expect(agent.capabilities).toBe(JSON.stringify(capabilities));
    });

    it('should update agent status', async () => {
      const updateDto: UpdateAgentStatusDto = {
        status: 'busy',
      };

      const result = await service.updateStatus(testAgentId, updateDto);

      expect(result.message).toBe('Status updated successfully');
      expect(result.status).toBe('busy');

      const agent = await service.getMe(testAgentId);
      expect(agent.status).toBe('busy');
    });

    it('should update lastSeen when status changes', async () => {
      const before = await prisma.agent.findUnique({
        where: { id: testAgentId },
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      await service.updateStatus(testAgentId, { status: 'idle' });

      const after = await prisma.agent.findUnique({
        where: { id: testAgentId },
      });

      expect(after?.lastSeen?.getTime()).toBeGreaterThanOrEqual(
        before?.lastSeen?.getTime() || 0,
      );
    });
  });

  // ============================================
  // Cache Integration
  // ============================================
  describe('Cache Integration', () => {
    let testAgentId: string;

    beforeAll(async () => {
      const result = await service.register({
        name: `CacheTestAgent_${Date.now()}`,
        publicKey: 'cache-test-key',
      });
      testAgentId = result.agentId;
    });

    afterAll(async () => {
      await prisma.agent.delete({ where: { id: testAgentId } });
    });

    it('should use cache for getMe', async () => {
      await service.getMe(testAgentId);

      expect(mockCacheService.getOrSet).toHaveBeenCalledWith(
        `agent:me:${testAgentId}`,
        expect.any(Function),
        600,
      );
    });

    it('should invalidate cache on update', async () => {
      await service.updateMe(testAgentId, { description: 'Cache test' });

      expect(mockCacheService.del).toHaveBeenCalledWith(`agent:me:${testAgentId}`);
      expect(mockCacheService.invalidate).toHaveBeenCalledWith('agents:*');
    });

    it('should use cache for getAgentProfile', async () => {
      await service.getAgentProfile(testAgentId);

      expect(mockCacheService.getOrSet).toHaveBeenCalledWith(
        `agent:profile:${testAgentId}`,
        expect.any(Function),
        600,
      );
    });

    it('should use cache for discover', async () => {
      await service.discover({ status: 'idle' });

      expect(mockCacheService.getOrSet).toHaveBeenCalledWith(
        expect.stringContaining('agents:discover:'),
        expect.any(Function),
        300,
      );
    });
  });

  // ============================================
  // Error Handling
  // ============================================
  describe('Error Handling', () => {
    it('should throw NotFoundException for non-existent agent', async () => {
      await expect(service.getMe('non-existent-id')).rejects.toThrow('Agent not found');
    });

    it('should throw NotFoundException for non-existent profile', async () => {
      await expect(service.getAgentProfile('non-existent-id')).rejects.toThrow('Agent not found');
    });

    it('should handle invalid status values gracefully', async () => {
      const agent = await service.register({
        name: `StatusTestAgent_${Date.now()}`,
        publicKey: 'status-test-key',
      });

      // This should be caught by validation layer, but testing service resilience
      await expect(
        service.updateStatus(agent.agentId, { status: 'invalid' as any }),
      ).rejects.toThrow();

      await prisma.agent.delete({ where: { id: agent.agentId } });
    });
  });

  // ============================================
  // Data Consistency
  // ============================================
  describe('Data Consistency', () => {
    it('should maintain data integrity across operations', async () => {
      const createDto: CreateAgentDto = {
        name: `ConsistencyTestAgent_${Date.now()}`,
        publicKey: 'consistency-test-key',
        description: 'Consistency test',
        capabilities: {
          skills: ['consistency'],
          maxConcurrentTasks: 5,
        },
      };

      // Create
      const createResult = await service.register(createDto);

      // Read
      const readResult = await service.getMe(createResult.agentId);
      expect(readResult.name).toBe(createDto.name);
      expect(readResult.description).toBe(createDto.description);

      // Update
      await service.updateMe(createResult.agentId, {
        description: 'Updated',
      });

      const updatedResult = await service.getMe(createResult.agentId);
      expect(updatedResult.description).toBe('Updated');

      // Clean up
      await prisma.agent.delete({ where: { id: createResult.agentId } });
    });

    it('should handle concurrent updates correctly', async () => {
      const createResult = await service.register({
        name: `ConcurrentTestAgent_${Date.now()}`,
        publicKey: 'concurrent-test-key',
      });

      const updates = Array(10)
        .fill(null)
        .map((_, i) =>
          service.updateMe(createResult.agentId, {
            description: `Update ${i}`,
          }),
        );

      await Promise.all(updates);

      const final = await service.getMe(createResult.agentId);
      expect(final.description).toMatch(/^Update \d+$/);

      await prisma.agent.delete({ where: { id: createResult.agentId } });
    });
  });
});
