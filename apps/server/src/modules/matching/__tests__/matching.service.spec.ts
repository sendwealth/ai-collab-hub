import { Test, TestingModule } from '@nestjs/testing';
import { MatchingService } from '../matching.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RatingsService } from '../../ratings/ratings.service';
import { SkillsService } from '../../skills/skills.service';

describe('MatchingService', () => {
  let service: MatchingService;
  let prisma: jest.Mocked<PrismaService>;
  let ratingsService: jest.Mocked<RatingsService>;
  let skillsService: jest.Mocked<SkillsService>;

  const mockAgent = {
    id: 'agent-1',
    name: 'Test Agent',
    status: 'idle',
    hourlyRate: 100,
    timezone: 'Asia/Shanghai',
    trustScore: 80,
  };

  const mockTask = {
    id: 'task-1',
    title: 'Test Task',
    description: 'Build a React frontend',
    budget: 1000,
    preferredTimezone: 'Asia/Shanghai',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    status: 'open',
  };

  const mockAgentSkills = [
    { agentId: 'agent-1', skillId: 'skill-1', level: 4, skill: { id: 'skill-1', name: 'React', category: 'frontend', level: 3 } },
    { agentId: 'agent-1', skillId: 'skill-2', level: 5, skill: { id: 'skill-2', name: 'TypeScript', category: 'frontend', level: 3 } },
  ];

  const mockTaskSkills = [
    { taskId: 'task-1', skillId: 'skill-1', required: true, minLevel: 3, skill: { id: 'skill-1', name: 'React', category: 'frontend', level: 3 } },
    { taskId: 'task-1', skillId: 'skill-2', required: true, minLevel: 3, skill: { id: 'skill-2', name: 'TypeScript', category: 'frontend', level: 3 } },
  ];

  const mockRatingSummary = {
    agentId: 'agent-1',
    avgQuality: 4.5,
    avgSpeed: 4.0,
    avgCommunication: 4.5,
    avgProfessionalism: 4.0,
    overallRating: 4.25,
    totalRatings: 10,
  };

  beforeEach(async () => {
    const mockPrisma = {
      agent: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      task: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      agentSkill: {
        findMany: jest.fn(),
      },
      taskSkill: {
        findMany: jest.fn(),
      },
      agentRatingSummary: {
        findUnique: jest.fn(),
      },
      recommendationLog: {
        create: jest.fn(),
      },
    };

    const mockRatingsService = {
      getAgentRatingSummary: jest.fn(),
    };

    const mockSkillsService = {
      getAgentSkills: jest.fn(),
      getTaskSkills: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchingService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: RatingsService,
          useValue: mockRatingsService,
        },
        {
          provide: SkillsService,
          useValue: mockSkillsService,
        },
      ],
    }).compile();

    service = module.get<MatchingService>(MatchingService);
    prisma = module.get(PrismaService);
    ratingsService = module.get(RatingsService);
    skillsService = module.get(SkillsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ============================================
  // Agent Recommendation Tests
  // ============================================

  describe('recommendAgentsForTask', () => {
    it('should recommend agents for a task', async () => {
      prisma.task.findUnique.mockResolvedValue(mockTask as any);
      prisma.agent.findMany.mockResolvedValue([mockAgent as any]);
      skillsService.getTaskSkills.mockResolvedValue(mockTaskSkills as any);
      skillsService.getAgentSkills.mockResolvedValue(mockAgentSkills as any);
      ratingsService.getAgentRatingSummary.mockResolvedValue(mockRatingSummary as any);
      prisma.recommendationLog.create.mockResolvedValue({} as any);

      const result = await service.recommendAgentsForTask('task-1');

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('agent');
      expect(result[0]).toHaveProperty('score');
      expect(result[0]).toHaveProperty('reasons');
    });

    it('should throw error if task not found', async () => {
      prisma.task.findUnique.mockResolvedValue(null);

      await expect(service.recommendAgentsForTask('non-existent')).rejects.toThrow(
        'Task not found',
      );
    });

    it('should filter agents by availability', async () => {
      prisma.task.findUnique.mockResolvedValue(mockTask as any);
      prisma.agent.findMany.mockResolvedValue([
        mockAgent,
        { ...mockAgent, id: 'agent-2', status: 'offline' },
      ] as any);
      skillsService.getTaskSkills.mockResolvedValue(mockTaskSkills as any);
      skillsService.getAgentSkills.mockResolvedValue(mockAgentSkills as any);
      ratingsService.getAgentRatingSummary.mockResolvedValue(mockRatingSummary as any);
      prisma.recommendationLog.create.mockResolvedValue({} as any);

      const result = await service.recommendAgentsForTask('task-1');

      // Offline agents should have lower availability score
      expect(result.every((r: any) => r.agent.status !== 'offline' || r.score < 1)).toBe(true);
    });
  });

  // ============================================
  // Task Recommendation Tests
  // ============================================

  describe('recommendTasksForAgent', () => {
    it('should recommend tasks for an agent', async () => {
      prisma.agent.findUnique.mockResolvedValue(mockAgent as any);
      prisma.task.findMany.mockResolvedValue([mockTask as any]);
      skillsService.getAgentSkills.mockResolvedValue(mockAgentSkills as any);
      skillsService.getTaskSkills.mockResolvedValue(mockTaskSkills as any);
      ratingsService.getAgentRatingSummary.mockResolvedValue(mockRatingSummary as any);
      prisma.recommendationLog.create.mockResolvedValue({} as any);

      const result = await service.recommendTasksForAgent('agent-1');

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('task');
      expect(result[0]).toHaveProperty('score');
    });

    it('should throw error if agent not found', async () => {
      prisma.agent.findUnique.mockResolvedValue(null);

      await expect(service.recommendTasksForAgent('non-existent')).rejects.toThrow(
        'Agent not found',
      );
    });
  });

  // ============================================
  // Match Score Calculation Tests
  // ============================================

  describe('calculateMatchScore', () => {
    it('should calculate match score correctly', async () => {
      skillsService.getAgentSkills.mockResolvedValue(mockAgentSkills as any);
      skillsService.getTaskSkills.mockResolvedValue(mockTaskSkills as any);
      ratingsService.getAgentRatingSummary.mockResolvedValue(mockRatingSummary as any);

      const score = await service.calculateMatchScore(
        mockAgent as any,
        mockTask as any,
      );

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('should return 0 if no skills match', async () => {
      skillsService.getAgentSkills.mockResolvedValue(mockAgentSkills as any);
      skillsService.getTaskSkills.mockResolvedValue([
        { taskId: 'task-1', skillId: 'skill-3', required: true, minLevel: 3, skill: { id: 'skill-3', name: 'Python', category: 'backend' } },
      ] as any);
      ratingsService.getAgentRatingSummary.mockResolvedValue(mockRatingSummary as any);

      const score = await service.calculateMatchScore(
        mockAgent as any,
        mockTask as any,
      );

      // Skill match should be 0, but other factors might still contribute
      expect(score).toBeLessThan(0.5);
    });
  });

  // ============================================
  // Skill Match Calculation Tests
  // ============================================

  describe('calculateSkillMatch', () => {
    it('should return 1 for perfect skill match', () => {
      const agentSkills = [
        { skillId: 'skill-1', level: 5 },
        { skillId: 'skill-2', level: 5 },
      ];
      const taskSkills = [
        { skillId: 'skill-1', minLevel: 3 },
        { skillId: 'skill-2', minLevel: 3 },
      ];

      const score = service.calculateSkillMatch(agentSkills as any, taskSkills as any);

      expect(score).toBe(1);
    });

    it('should return 0 for no skill match', () => {
      const agentSkills = [
        { skillId: 'skill-1', level: 5 },
      ];
      const taskSkills = [
        { skillId: 'skill-2', minLevel: 3 },
      ];

      const score = service.calculateSkillMatch(agentSkills as any, taskSkills as any);

      expect(score).toBe(0);
    });

    it('should calculate partial match', () => {
      const agentSkills = [
        { skillId: 'skill-1', level: 4 },
        { skillId: 'skill-2', level: 3 },
      ];
      const taskSkills = [
        { skillId: 'skill-1', minLevel: 3 },
        { skillId: 'skill-2', minLevel: 4 }, // Agent doesn't meet min level
      ];

      const score = service.calculateSkillMatch(agentSkills as any, taskSkills as any);

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(1);
    });
  });

  // ============================================
  // Performance Score Calculation Tests
  // ============================================

  describe('calculatePerformanceScore', () => {
    it('should return score based on rating summary', async () => {
      ratingsService.getAgentRatingSummary.mockResolvedValue({
        ...mockRatingSummary,
        overallRating: 4.5,
      } as any);

      const score = await service.calculatePerformanceScore('agent-1');

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('should return 0.5 for agent with no ratings', async () => {
      ratingsService.getAgentRatingSummary.mockResolvedValue({
        agentId: 'agent-1',
        overallRating: 0,
        totalRatings: 0,
      } as any);

      const score = await service.calculatePerformanceScore('agent-1');

      expect(score).toBe(0.5); // Neutral score
    });
  });

  // ============================================
  // Price Match Calculation Tests
  // ============================================

  describe('calculatePriceMatch', () => {
    it('should return 1 for perfect price match', () => {
      const score = service.calculatePriceMatch(100, 1000);
      expect(score).toBe(1);
    });

    it('should return lower score for higher price', () => {
      const score1 = service.calculatePriceMatch(100, 1000);
      const score2 = service.calculatePriceMatch(200, 1000);
      expect(score2).toBeLessThan(score1);
    });

    it('should handle null values', () => {
      const score = service.calculatePriceMatch(null, 1000);
      expect(score).toBe(0.5); // Neutral score
    });
  });

  // ============================================
  // Availability Score Calculation Tests
  // ============================================

  describe('calculateAvailabilityScore', () => {
    it('should return 1 for available agent with sufficient time', () => {
      const deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const score = service.calculateAvailabilityScore('idle', deadline);
      expect(score).toBe(1);
    });

    it('should return 0 for offline agent', () => {
      const deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const score = service.calculateAvailabilityScore('offline', deadline);
      expect(score).toBe(0);
    });

    it('should return lower score for busy agent', () => {
      const deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const score = service.calculateAvailabilityScore('busy', deadline);
      expect(score).toBeLessThan(1);
    });
  });

  // ============================================
  // Location Match Calculation Tests
  // ============================================

  describe('calculateLocationMatch', () => {
    it('should return 1 for matching timezone', () => {
      const score = service.calculateLocationMatch('Asia/Shanghai', 'Asia/Shanghai');
      expect(score).toBe(1);
    });

    it('should return lower score for different timezone', () => {
      const score = service.calculateLocationMatch('Asia/Shanghai', 'America/New_York');
      expect(score).toBeLessThan(1);
    });

    it('should return neutral score for null values', () => {
      const score = service.calculateLocationMatch(null, 'Asia/Shanghai');
      expect(score).toBe(0.5);
    });
  });

  // ============================================
  // Match Reasons Generation Tests
  // ============================================

  describe('generateMatchReasons', () => {
    it('should generate reasons for high match', () => {
      const reasons = service.generateMatchReasons(
        { ...mockAgent, status: 'idle' } as any,
        mockTask as any,
        { skillScore: 0.9, performanceScore: 0.8, priceScore: 0.9, availabilityScore: 1, locationScore: 1 },
      );

      expect(reasons.length).toBeGreaterThan(0);
      expect(reasons.some((r: string) => r.includes('skill'))).toBe(true);
    });

    it('should include warnings for low scores', () => {
      const reasons = service.generateMatchReasons(
        { ...mockAgent, status: 'busy' } as any,
        mockTask as any,
        { skillScore: 0.5, performanceScore: 0.3, priceScore: 0.5, availabilityScore: 0.5, locationScore: 0.5 },
      );

      expect(reasons.some((r: string) => r.includes('注意') || r.includes('warning') || r.includes('low'))).toBe(true);
    });
  });

  // ============================================
  // Calculate Match API Tests
  // ============================================

  describe('calculateMatch', () => {
    it('should return detailed match calculation', async () => {
      prisma.agent.findUnique.mockResolvedValue(mockAgent as any);
      prisma.task.findUnique.mockResolvedValue(mockTask as any);
      skillsService.getAgentSkills.mockResolvedValue(mockAgentSkills as any);
      skillsService.getTaskSkills.mockResolvedValue(mockTaskSkills as any);
      ratingsService.getAgentRatingSummary.mockResolvedValue(mockRatingSummary as any);

      const result = await service.calculateMatch('agent-1', 'task-1');

      expect(result).toHaveProperty('overallScore');
      expect(result).toHaveProperty('breakdown');
      expect(result.breakdown).toHaveProperty('skillScore');
      expect(result.breakdown).toHaveProperty('performanceScore');
      expect(result.breakdown).toHaveProperty('priceScore');
      expect(result.breakdown).toHaveProperty('availabilityScore');
      expect(result.breakdown).toHaveProperty('locationScore');
    });
  });
});
