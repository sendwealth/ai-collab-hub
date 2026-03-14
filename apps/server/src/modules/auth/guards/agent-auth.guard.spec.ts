import { Test, TestingModule } from '@nestjs/testing';
import { AgentAuthGuard } from './agent-auth.guard';
import { AgentsService } from '../../agents/agents.service';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';

describe('AgentAuthGuard', () => {
  let guard: AgentAuthGuard;

  const mockAgentsService = {
    validateByApiKey: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentAuthGuard,
        {
          provide: AgentsService,
          useValue: mockAgentsService,
        },
      ],
    }).compile();

    guard = module.get<AgentAuthGuard>(AgentAuthGuard);
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

      mockAgentsService.validateByApiKey.mockResolvedValue(mockAgent);

      const context = createMockContext('sk_agent_valid123');
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should deny access without API key', async () => {
      const context = createMockContext(undefined);

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should deny access with invalid API key', async () => {
      mockAgentsService.validateByApiKey.mockResolvedValue(null);

      const context = createMockContext('sk_agent_invalid');

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should attach agent to request', async () => {
      const mockAgent = {
        id: 'agent-id',
        name: 'TestAgent',
      };

      mockAgentsService.validateByApiKey.mockResolvedValue(mockAgent);

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
      mockAgentsService.validateByApiKey.mockRejectedValue(
        new Error('Database error')
      );

      const context = createMockContext('sk_agent_test');

      await expect(guard.canActivate(context)).rejects.toThrow();
    });

    it('should validate API key format', async () => {
      const context = createMockContext('invalid-format');

      mockAgentsService.validateByApiKey.mockResolvedValue(null);

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should support different API key formats', async () => {
      const validKeys = [
        'sk_agent_abc123',
        'sk_agent_test123456789',
        'sk_agent_a1b2c3d4e5f6',
      ];

      for (const key of validKeys) {
        mockAgentsService.validateByApiKey.mockResolvedValue({
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
      ];

      for (const key of invalidKeys) {
        mockAgentsService.validateByApiKey.mockResolvedValue(null);
        const context = createMockContext(key as any);

        await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
      }
    });
  });

  describe('Performance', () => {
    it('should handle concurrent requests', async () => {
      const mockAgent = {
        id: 'agent-id',
        apiKey: 'sk_agent_test',
      };

      mockAgentsService.validateByApiKey.mockResolvedValue(mockAgent);

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
