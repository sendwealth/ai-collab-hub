import { Test, TestingModule } from '@nestjs/testing';
import { RecommendationsService } from '../src/modules/recommendations/recommendations.service';
import { PrismaService } from '../src/modules/common/prisma/prisma.service';

describe('RecommendationsService', () => {
  let service: RecommendationsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecommendationsService,
        {
          provide: PrismaService,
          useValue: {
            task: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
            },
            agent: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
            },
            agentCapability: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
            },
            agentPerformance: {
              findMany: jest.fn(),
              findFirst: jest.fn(),
            },
            recommendationLog: {
              create: jest.fn(),
              update: jest.fn(),
            },
            priceHistory: {
              create: jest.fn(),
              findMany: jest.fn(),
            },
            marketTrend: {
              findFirst: jest.fn(),
              upsert: jest.fn(),
            },
            task: {
              count: jest.fn(),
              groupBy: jest.fn(),
            },
            bid: {
              findMany: jest.fn(),
            },
            creditTransaction: {
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<RecommendationsService>(RecommendationsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('recommendAgents', () => {
    it('should return agent recommendations for a task', async () => {
      const mockTask = {
        id: 'task-1',
        title: 'Build AI Model',
        description: 'Machine learning model for image classification',
        category: 'development',
        requirements: JSON.stringify({
          skills: ['machineLearning', 'coding'],
          difficulty: 'hard',
        }),
        reward: JSON.stringify({ amount: 5000 }),
        deadline: new Date('2026-03-20'),
      };

      const mockAgents = [
        {
          id: 'agent-1',
          name: 'AI Expert',
          trustScore: 85,
          status: 'idle',
        },
        {
          id: 'agent-2',
          name: 'Developer',
          trustScore: 70,
          status: 'idle',
        },
      ];

      const mockCapabilities = [
        {
          agentId: 'agent-1',
          coding: 90,
          machineLearning: 95,
          dataScience: 85,
        },
        {
          agentId: 'agent-2',
          coding: 80,
          machineLearning: 60,
          dataScience: 50,
        },
      ];

      const mockPerformance = [
        {
          agentId: 'agent-1',
          tasksCompleted: 50,
          tasksFailed: 2,
          avgResponseTime: 30,
        },
        {
          agentId: 'agent-2',
          tasksCompleted: 30,
          tasksFailed: 5,
          avgResponseTime: 45,
        },
      ];

      (prisma.task.findUnique as jest.Mock).mockResolvedValue(mockTask);
      (prisma.agent.findMany as jest.Mock).mockResolvedValue(mockAgents);
      (prisma.agentCapability.findMany as jest.Mock).mockResolvedValue(mockCapabilities);
      (prisma.agentPerformance.findMany as jest.Mock).mockResolvedValue(mockPerformance);
      (prisma.recommendationLog.create as jest.Mock).mockResolvedValue({});

      const result = await service.recommendAgents({
        taskId: 'task-1',
        limit: 10,
      });

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('agentId');
      expect(result[0]).toHaveProperty('score');
      expect(result[0]).toHaveProperty('matchedCapabilities');
      expect(result[0].score).toBeGreaterThan(0);
    });

    it('should throw error if task not found', async () => {
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.recommendAgents({ taskId: 'non-existent', limit: 10 }),
      ).rejects.toThrow('Task not found');
    });
  });

  describe('recommendTasks', () => {
    it('should return task recommendations for an agent', async () => {
      const mockAgent = {
        id: 'agent-1',
        name: 'AI Expert',
        trustScore: 85,
      };

      const mockTasks = [
        {
          id: 'task-1',
          title: 'Build ML Model',
          category: 'development',
          requirements: JSON.stringify({
            skills: ['machineLearning'],
            difficulty: 'hard',
          }),
          reward: JSON.stringify({ amount: 5000 }),
          deadline: new Date('2026-03-20'),
        },
        {
          id: 'task-2',
          title: 'Web Development',
          category: 'development',
          requirements: JSON.stringify({
            skills: ['coding'],
            difficulty: 'medium',
          }),
          reward: JSON.stringify({ amount: 3000 }),
          deadline: new Date('2026-03-25'),
        },
      ];

      const mockCapabilities = {
        agentId: 'agent-1',
        coding: 90,
        machineLearning: 95,
      };

      const mockPerformance = {
        agentId: 'agent-1',
        tasksCompleted: 50,
        avgResponseTime: 30,
      };

      (prisma.agent.findUnique as jest.Mock).mockResolvedValue(mockAgent);
      (prisma.task.findMany as jest.Mock).mockResolvedValue(mockTasks);
      (prisma.agentCapability.findUnique as jest.Mock).mockResolvedValue(mockCapabilities);
      (prisma.agentPerformance.findFirst as jest.Mock).mockResolvedValue(mockPerformance);
      (prisma.recommendationLog.create as jest.Mock).mockResolvedValue({});

      const result = await service.recommendTasks({
        agentId: 'agent-1',
        limit: 20,
      });

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('taskId');
      expect(result[0]).toHaveProperty('score');
      expect(result[0]).toHaveProperty('matchPercentage');
      expect(result[0].matchPercentage).toBeGreaterThanOrEqual(0);
    });

    it('should throw error if agent not found', async () => {
      (prisma.agent.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.recommendTasks({ agentId: 'non-existent', limit: 20 }),
      ).rejects.toThrow('Agent not found');
    });
  });

  describe('suggestPrice', () => {
    it('should return pricing suggestion for a task', async () => {
      const mockTask = {
        id: 'task-1',
        type: 'independent',
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      };

      const mockHistorical = {
        avgPrice: 4000,
        totalTasks: 50,
      };

      const mockMarketData = {
        openTasks: 10,
        availableAgents: 8,
        ratio: 1.25,
        totalTasks: 15,
      };

      (prisma.task.findUnique as jest.Mock).mockResolvedValue(mockTask);
      (prisma.priceHistory.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.marketTrend.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.task.count as jest.Mock).mockResolvedValue(mockMarketData.openTasks);
      (prisma.agent.count as jest.Mock).mockResolvedValue(mockMarketData.availableAgents);
      (prisma.priceHistory.create as jest.Mock).mockResolvedValue({});

      const result = await service.suggestPrice({
        taskId: 'task-1',
        category: 'development',
        difficulty: 'hard',
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty('minPrice');
      expect(result).toHaveProperty('recommendedPrice');
      expect(result).toHaveProperty('maxPrice');
      expect(result).toHaveProperty('confidence');
      expect(result.recommendedPrice).toBeGreaterThan(result.minPrice);
      expect(result.recommendedPrice).toBeLessThan(result.maxPrice);
    });

    it('should throw error if task not found', async () => {
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.suggestPrice({ taskId: 'non-existent' }),
      ).rejects.toThrow('Task not found');
    });
  });

  describe('extractTaskRequirements', () => {
    it('should extract requirements from task title and description', () => {
      const task = {
        id: 'task-1',
        title: 'Build machine learning model',
        description: 'Create an AI model for image classification using deep learning',
        category: 'ai',
      };

      const requirements = (service as any).extractTaskRequirements(task);

      expect(requirements).toBeDefined();
      expect(requirements.skills).toContain('machineLearning');
      expect(requirements.category).toBe('ai');
    });

    it('should parse requirements from JSON string', () => {
      const task = {
        id: 'task-1',
        title: 'Development task',
        requirements: JSON.stringify({
          skills: ['coding', 'testing'],
          difficulty: 'medium',
          estimatedHours: 20,
        }),
      };

      const requirements = (service as any).extractTaskRequirements(task);

      expect(requirements.skills).toContain('coding');
      expect(requirements.skills).toContain('testing');
      expect(requirements.difficulty).toBe('medium');
      expect(requirements.estimatedHours).toBe(20);
    });
  });

  describe('scoreAgent', () => {
    it('should score agent based on capabilities and performance', () => {
      const agent = {
        id: 'agent-1',
        name: 'Test Agent',
        trustScore: 80,
      };

      const capabilities = {
        coding: 85,
        machineLearning: 90,
      };

      const performance = {
        tasksCompleted: 40,
        tasksFailed: 5,
        avgResponseTime: 30,
      };

      const requirements = {
        skills: ['coding', 'machineLearning'],
        difficulty: 'hard',
      };

      const result = (service as any).scoreAgent(
        agent,
        capabilities,
        performance,
        requirements,
      );

      expect(result).toBeDefined();
      expect(result.agentId).toBe('agent-1');
      expect(result.score).toBeGreaterThan(0);
      expect(result.matchedCapabilities).toContain('coding');
      expect(result.matchedCapabilities).toContain('machineLearning');
      expect(result.successRate).toBe(40 / 45);
    });
  });

  describe('recordFeedback', () => {
    it('should record recommendation feedback', async () => {
      const feedback = {
        recommendationId: 'rec-1',
        type: 'agent' as const,
        selectedId: 'agent-1',
        wasHelpful: true,
      };

      (prisma.recommendationLog.update as jest.Mock).mockResolvedValue({});

      await service.recordFeedback(feedback);

      expect(prisma.recommendationLog.update).toHaveBeenCalledWith({
        where: { id: 'rec-1' },
        data: {
          clicked: true,
          accepted: true,
        },
      });
    });
  });
});
