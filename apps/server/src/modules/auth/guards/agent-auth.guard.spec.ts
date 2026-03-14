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
        name: 'Test Agent',
      };

      mockAgentsService.validateByApiKey.mockResolvedValue(mockAgent);

      const context = createMockContext('valid-api-key');
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockAgentsService.validateByApiKey).toHaveBeenCalledWith('valid-api-key');
    });

    it('should deny access without API key', async () => {
      const context = createMockContext(undefined);

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should deny access with invalid API key', async () => {
      mockAgentsService.validateByApiKey.mockResolvedValue(null);

      const context = createMockContext('invalid-api-key');

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should handle service errors', async () => {
      mockAgentsService.validateByApiKey.mockRejectedValue(new Error('Database error'));

      const context = createMockContext('error-api-key');

      await expect(guard.canActivate(context)).rejects.toThrow('Database error');
    });
  });
});
