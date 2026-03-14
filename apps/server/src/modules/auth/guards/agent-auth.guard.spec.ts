import { Test, TestingModule } from '@nestjs/testing';
import { AgentAuthGuard } from './agent-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';

describe('AgentAuthGuard', () => {
  let guard: AgentAuthGuard;
  let prisma: PrismaService;

  const mockPrismaService = {
    agent: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentAuthGuard,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    guard = module.get<AgentAuthGuard>(AgentAuthGuard);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createMockContext = (apiKey?: string): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            'x-api-key': apiKey,
          },
        }),
      }),
    } as ExecutionContext;
  };

  describe('canActivate', () => {
    it('should allow access with valid API key', async () => {
      const mockAgent = {
        id: 'agent-id',
        name: 'TestAgent',
        apiKey: 'sk_agent_valid123',
      };

      mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);

      const context = createMockContext('sk_agent_valid123');
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should deny access without API key', async () => {
      const context = createMockContext(undefined);

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should deny access with invalid API key', async () => {
      mockPrismaService.agent.findUnique.mockResolvedValue(null);

      const context = createMockContext('sk_agent_invalid');

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should attach agent to request', async () => {
      const mockAgent = {
        id: 'agent-id',
        name: 'TestAgent',
      };

      mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);

      const mockRequest = {
        headers: { 'x-api-key': 'sk_agent_test' },
        agent: null,
      };

      const context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      await guard.canActivate(context);

      expect(mockRequest.agent).toEqual(mockAgent);
    });

    it('should handle database errors gracefully', async () => {
      mockPrismaService.agent.findUnique.mockRejectedValue(
        new Error('Database error')
      );

      const context = createMockContext('sk_agent_test');

      await expect(guard.canActivate(context)).rejects.toThrow();
    });

    it('should validate API key format', async () => {
      const context = createMockContext('invalid-format');

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should support different API key formats', async () => {
      const validKeys = [
        'sk_agent_abc123',
        'sk_agent_test123456789',
        'sk_agent_a1b2c3d4e5f6',
      ];

      for (const key of validKeys) {
        mockPrismaService.agent.findUnique.mockResolvedValue({
          id: 'agent-id',
          apiKey: key,
        });

        const context = createMockContext(key);
        const result = await guard.canActivate(context);

        expect(result).toBe(true);
      }
    });

    it('should reject malformed API keys', async () => {
      const invalidKeys = [
        '',
        'invalid',
        'sk_invalid_format',
        'Bearer token',
        null,
        undefined,
      ];

      for (const key of invalidKeys) {
        const context = createMockContext(key as any);

        await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
      }
    });
  });

  describe('Performance', () => {
    it('should cache agent lookups', async () => {
      const mockAgent = {
        id: 'agent-id',
        apiKey: 'sk_agent_test',
      };

      mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);

      const context = createMockContext('sk_agent_test');

      // Multiple calls should use cache
      await guard.canActivate(context);
      await guard.canActivate(context);

      // Should only call database once due to caching
      expect(prisma.agent.findUnique).toHaveBeenCalledTimes(1);
    });

    it('should handle concurrent requests', async () => {
      const mockAgent = {
        id: 'agent-id',
        apiKey: 'sk_agent_test',
      };

      mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);

      const context = createMockContext('sk_agent_test');

      const results = await Promise.all([
        guard.canActivate(context),
        guard.canActivate(context),
        guard.canActivate(context),
      ]);

      expect(results.every((r) => r === true)).toBe(true);
    });
  });
});
