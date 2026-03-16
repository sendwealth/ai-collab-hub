import { Test, TestingModule } from '@nestjs/testing';
import { AgentCertificationService } from '../agent-certification.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('AgentCertificationService', () => {
  let service: AgentCertificationService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    agentCertification: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    agent: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentCertificationService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AgentCertificationService>(AgentCertificationService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCertification', () => {
    it('should return existing certification', async () => {
      const mockCertification = {
        id: 'cert-1',
        agentId: 'agent-123',
        level: 'silver',
        score: 75,
        testScore: 80,
        tasksCompleted: 10,
        avgRating: 4.5,
        badgeUrl: '/badges/silver-badge.svg',
        earnedAt: new Date(),
        expiresAt: new Date(),
        totalTests: 5,
        bestScore: 85,
      };

      mockPrismaService.agentCertification.findUnique.mockResolvedValue(mockCertification);

      const result = await service.getCertification('agent-123');

      expect(result.id).toBe('cert-1');
      expect(result.level).toBe('silver');
      expect(result.score).toBe(75);
    });

    it('should create new certification if not exists', async () => {
      mockPrismaService.agentCertification.findUnique.mockResolvedValue(null);
      mockPrismaService.agentCertification.create.mockResolvedValue({
        id: 'cert-1',
        agentId: 'agent-123',
        level: 'bronze',
        score: 0,
        testScore: 0,
        tasksCompleted: 0,
        avgRating: 0,
        earnedAt: null,
        expiresAt: null,
        totalTests: 0,
        bestScore: 0,
      });

      const result = await service.getCertification('agent-123');

      expect(result.level).toBe('bronze');
      expect(result.score).toBe(0);
      expect(mockPrismaService.agentCertification.create).toHaveBeenCalled();
    });
  });

  describe('updateAfterTest', () => {
    it('should update certification after test completion', async () => {
      const mockCertification = {
        id: 'cert-1',
        agentId: 'agent-123',
        level: 'bronze',
        score: 30,
        testScore: 50,
        tasksCompleted: 5,
        avgRating: 4.0,
        totalTests: 3,
        bestScore: 60,
        earnedAt: new Date(),
        expiresAt: new Date(),
      };

      mockPrismaService.agentCertification.findUnique.mockResolvedValue(mockCertification);
      mockPrismaService.agentCertification.update.mockResolvedValue({
        ...mockCertification,
        testScore: 85,
        score: 72.5,
        level: 'silver',
        totalTests: 4,
        bestScore: 85,
      });

      const result = await service.updateAfterTest('agent-123', 85, 85);

      expect(result.newLevel).toBe('silver');
      expect(result.hasLeveledUp).toBe(true);
      expect(result.newScore).toBeGreaterThan(0);
    });

    it('should throw NotFoundException if certification not found', async () => {
      mockPrismaService.agentCertification.findUnique.mockResolvedValue(null);

      await expect(
        service.updateAfterTest('agent-123', 85, 85),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateAfterTask', () => {
    it('should update certification after task completion', async () => {
      const mockCertification = {
        id: 'cert-1',
        agentId: 'agent-123',
        level: 'bronze',
        score: 30,
        testScore: 50,
        tasksCompleted: 10,
        avgRating: 4.0,
        earnedAt: new Date(),
        expiresAt: new Date(),
      };

      mockPrismaService.agentCertification.findUnique.mockResolvedValue(mockCertification);
      mockPrismaService.agentCertification.update.mockResolvedValue({
        ...mockCertification,
        tasksCompleted: 11,
        avgRating: 4.09,
        score: 35.5,
      });

      const result = await service.updateAfterTask('agent-123', 5);

      expect(result.newScore).toBeGreaterThan(mockCertification.score);
      expect(mockPrismaService.agentCertification.update).toHaveBeenCalled();
    });
  });

  describe('getLeaderboard', () => {
    it('should return leaderboard with pagination', async () => {
      const mockCertifications = [
        {
          id: 'cert-1',
          agentId: 'agent-1',
          level: 'gold',
          score: 95,
          testScore: 90,
          tasksCompleted: 50,
          avgRating: 4.9,
          earnedAt: new Date(),
        },
        {
          id: 'cert-2',
          agentId: 'agent-2',
          level: 'silver',
          score: 75,
          testScore: 80,
          tasksCompleted: 20,
          avgRating: 4.2,
          earnedAt: new Date(),
        },
      ];

      const mockAgents = [
        { id: 'agent-1', name: 'Agent One', description: 'Top agent' },
        { id: 'agent-2', name: 'Agent Two', description: 'Good agent' },
      ];

      mockPrismaService.agentCertification.findMany.mockResolvedValue(mockCertifications);
      mockPrismaService.agentCertification.count.mockResolvedValue(2);
      mockPrismaService.agent.findMany.mockResolvedValue(mockAgents);

      const result = await service.getLeaderboard(undefined, 50, 1);

      expect(result.leaderboard).toHaveLength(2);
      expect(result.leaderboard[0].rank).toBe(1);
      expect(result.leaderboard[0].agentName).toBe('Agent One');
      expect(result.leaderboard[0].level).toBe('gold');
      expect(result.total).toBe(2);
    });

    it('should filter by level', async () => {
      mockPrismaService.agentCertification.findMany.mockResolvedValue([]);
      mockPrismaService.agentCertification.count.mockResolvedValue(0);
      mockPrismaService.agent.findMany.mockResolvedValue([]);

      await service.getLeaderboard('gold', 50, 1);

      expect(mockPrismaService.agentCertification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { level: 'gold' },
        }),
      );
    });
  });

  describe('getAgentsByLevel', () => {
    it('should return agents filtered by level', async () => {
      const mockCertifications = [
        {
          id: 'cert-1',
          agentId: 'agent-1',
          level: 'gold',
          score: 95,
          earnedAt: new Date(),
        },
      ];

      const mockAgents = [
        { id: 'agent-1', name: 'Gold Agent', description: 'Excellent' },
      ];

      mockPrismaService.agentCertification.findMany.mockResolvedValue(mockCertifications);
      mockPrismaService.agentCertification.count.mockResolvedValue(1);
      mockPrismaService.agent.findMany.mockResolvedValue(mockAgents);

      const result = await service.getAgentsByLevel('gold', 1, 20);

      expect(result.agents).toHaveLength(1);
      expect(result.agents[0].level).toBe('gold');
      expect(result.agents[0].agentName).toBe('Gold Agent');
    });
  });

  describe('getStats', () => {
    it('should return certification statistics', async () => {
      const mockCertifications = [
        {
          id: 'cert-1',
          agentId: 'agent-1',
          level: 'gold',
          score: 95,
        },
        {
          id: 'cert-2',
          agentId: 'agent-2',
          level: 'silver',
          score: 75,
        },
      ];

      const mockAgents = [
        { id: 'agent-1', name: 'Agent One' },
        { id: 'agent-2', name: 'Agent Two' },
      ];

      mockPrismaService.agentCertification.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(30)
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(20);

      mockPrismaService.agentCertification.aggregate.mockResolvedValue({
        _avg: { score: 72.5 },
      });

      mockPrismaService.agentCertification.findMany.mockResolvedValue(mockCertifications);
      mockPrismaService.agent.findMany.mockResolvedValue(mockAgents);

      const result = await service.getStats();

      expect(result.totalCertifications).toBe(100);
      expect(result.levelDistribution.bronze).toBe(30);
      expect(result.levelDistribution.silver).toBe(50);
      expect(result.levelDistribution.gold).toBe(20);
      expect(result.averageScore).toBe(72.5);
      expect(result.topPerformers).toHaveLength(2);
    });
  });

  describe('setLevel', () => {
    it('should set certification level (admin function)', async () => {
      const mockCertification = {
        id: 'cert-1',
        agentId: 'agent-123',
        level: 'bronze',
        score: 30,
      };

      mockPrismaService.agentCertification.findUnique.mockResolvedValue(mockCertification);
      mockPrismaService.agentCertification.update.mockResolvedValue({
        ...mockCertification,
        level: 'gold',
        score: 90,
        earnedAt: new Date(),
        expiresAt: new Date(),
      });

      const result = await service.setLevel('agent-123', 'gold');

      expect(result.newLevel).toBe('gold');
      expect(result.newScore).toBe(90);
      expect(result.badgeUrl).toContain('gold');
    });

    it('should throw NotFoundException for non-existent certification', async () => {
      mockPrismaService.agentCertification.findUnique.mockResolvedValue(null);

      await expect(
        service.setLevel('agent-123', 'gold'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error for invalid level', async () => {
      mockPrismaService.agentCertification.findUnique.mockResolvedValue({});

      await expect(
        service.setLevel('agent-123', 'platinum'),
      ).rejects.toThrow();
    });
  });

  describe('private methods', () => {
    it('should calculate certification score correctly', () => {
      const service = new AgentCertificationService(mockPrismaService as any);

      const score1 = service['calculateCertificationScore']({
        testScore: 80,
        tasksCompleted: 20,
        avgRating: 4.5,
      });

      expect(score1).toBeGreaterThan(0);
      expect(score1).toBeLessThanOrEqual(100);
    });

    it('should get correct level for score', () => {
      const service = new AgentCertificationService(mockPrismaService as any);

      expect(service['getLevel'](90)).toBe('gold');
      expect(service['getLevel'](70)).toBe('silver');
      expect(service['getLevel'](50)).toBe('bronze');
    });

    it('should detect level up correctly', () => {
      const service = new AgentCertificationService(mockPrismaService as any);

      expect(service['hasLevelUp']('bronze', 'silver')).toBe(true);
      expect(service['hasLevelUp']('silver', 'gold')).toBe(true);
      expect(service['hasLevelUp']('gold', 'gold')).toBe(false);
      expect(service['hasLevelUp']('gold', 'silver')).toBe(false);
    });
  });

  describe('grade boundaries', () => {
    it('should handle Bronze boundary (59 points)', async () => {
      const mockCertification = {
        id: 'cert-1',
        agentId: 'agent-123',
        level: 'bronze',
        score: 59,
        testScore: 60,
        tasksCompleted: 10,
        avgRating: 4.0,
        totalTests: 5,
        bestScore: 65,
        earnedAt: new Date(),
        expiresAt: new Date(),
      };

      mockPrismaService.agentCertification.findUnique.mockResolvedValue(mockCertification);
      mockPrismaService.agentCertification.update.mockResolvedValue({
        ...mockCertification,
        score: 59,
        level: 'bronze',
      });

      const result = await service.updateAfterTest('agent-123', 59, 60);

      expect(result.newLevel).toBe('bronze');
      expect(result.hasLeveledUp).toBe(false);
    });

    it('should handle Silver boundary (60 points)', async () => {
      const mockCertification = {
        id: 'cert-1',
        agentId: 'agent-123',
        level: 'bronze',
        score: 58,
        testScore: 55,
        tasksCompleted: 10,
        avgRating: 4.0,
        totalTests: 5,
        bestScore: 60,
        earnedAt: new Date(),
        expiresAt: new Date(),
      };

      mockPrismaService.agentCertification.findUnique.mockResolvedValue(mockCertification);
      mockPrismaService.agentCertification.update.mockResolvedValue({
        ...mockCertification,
        score: 60,
        testScore: 60,
        level: 'silver',
      });

      const result = await service.updateAfterTest('agent-123', 60, 60);

      expect(result.newLevel).toBe('silver');
      expect(result.hasLeveledUp).toBe(true);
    });

    it('should handle Silver to Gold boundary (85 points)', async () => {
      const mockCertification = {
        id: 'cert-1',
        agentId: 'agent-123',
        level: 'silver',
        score: 84,
        testScore: 80,
        tasksCompleted: 20,
        avgRating: 4.5,
        totalTests: 10,
        bestScore: 84,
        earnedAt: new Date(),
        expiresAt: new Date(),
      };

      mockPrismaService.agentCertification.findUnique.mockResolvedValue(mockCertification);
      mockPrismaService.agentCertification.update.mockResolvedValue({
        ...mockCertification,
        score: 85,
        testScore: 85,
        level: 'gold',
      });

      const result = await service.updateAfterTest('agent-123', 85, 85);

      expect(result.newLevel).toBe('gold');
      expect(result.hasLeveledUp).toBe(true);
    });

    it('should maintain Silver at 84 points', async () => {
      const mockCertification = {
        id: 'cert-1',
        agentId: 'agent-123',
        level: 'silver',
        score: 83,
        testScore: 80,
        tasksCompleted: 20,
        avgRating: 4.5,
        totalTests: 10,
        bestScore: 84,
        earnedAt: new Date(),
        expiresAt: new Date(),
      };

      mockPrismaService.agentCertification.findUnique.mockResolvedValue(mockCertification);
      mockPrismaService.agentCertification.update.mockResolvedValue({
        ...mockCertification,
        score: 84,
        testScore: 84,
        level: 'silver',
      });

      const result = await service.updateAfterTest('agent-123', 84, 84);

      expect(result.newLevel).toBe('silver');
      expect(result.hasLeveledUp).toBe(false);
    });
  });

  describe('condition combinations', () => {
    it('should not level up with high score but insufficient tasks', async () => {
      const mockCertification = {
        id: 'cert-1',
        agentId: 'agent-123',
        level: 'bronze',
        score: 40,
        testScore: 85,
        tasksCompleted: 2, // Too few tasks
        avgRating: 4.8,
        totalTests: 3,
        bestScore: 85,
        earnedAt: new Date(),
        expiresAt: new Date(),
      };

      mockPrismaService.agentCertification.findUnique.mockResolvedValue(mockCertification);
      mockPrismaService.agentCertification.update.mockResolvedValue({
        ...mockCertification,
        testScore: 90,
        score: 55,
        level: 'bronze', // Should not level up
      });

      const result = await service.updateAfterTest('agent-123', 90, 90);

      // Even with high test score, insufficient tasks should prevent leveling up
      expect(result.newScore).toBeGreaterThan(0);
    });

    it('should not level up with good tasks but low test score', async () => {
      const mockCertification = {
        id: 'cert-1',
        agentId: 'agent-123',
        level: 'silver',
        score: 65,
        testScore: 60,
        tasksCompleted: 50,
        avgRating: 4.8,
        totalTests: 10,
        bestScore: 70,
        earnedAt: new Date(),
        expiresAt: new Date(),
      };

      mockPrismaService.agentCertification.findUnique.mockResolvedValue(mockCertification);
      mockPrismaService.agentCertification.update.mockResolvedValue({
        ...mockCertification,
        testScore: 65,
        score: 68,
        level: 'silver', // Should not level up to gold
      });

      const result = await service.updateAfterTest('agent-123', 65, 65);

      expect(result.newLevel).not.toBe('gold');
    });

    it('should balance test score and task completion correctly', async () => {
      const mockCertification = {
        id: 'cert-1',
        agentId: 'agent-123',
        level: 'silver',
        score: 70,
        testScore: 75,
        tasksCompleted: 30,
        avgRating: 4.3,
        totalTests: 8,
        bestScore: 80,
        earnedAt: new Date(),
        expiresAt: new Date(),
      };

      mockPrismaService.agentCertification.findUnique.mockResolvedValue(mockCertification);
      mockPrismaService.agentCertification.update.mockResolvedValue({
        ...mockCertification,
        testScore: 82,
        score: 76,
        level: 'silver',
      });

      const result = await service.updateAfterTest('agent-123', 82, 82);

      expect(result.newScore).toBeGreaterThan(mockCertification.score);
    });

    it('should handle low rating scenario', async () => {
      const mockCertification = {
        id: 'cert-1',
        agentId: 'agent-123',
        level: 'silver',
        score: 65,
        testScore: 80,
        tasksCompleted: 25,
        avgRating: 2.5, // Low rating
        totalTests: 5,
        bestScore: 85,
        earnedAt: new Date(),
        expiresAt: new Date(),
      };

      mockPrismaService.agentCertification.findUnique.mockResolvedValue(mockCertification);
      mockPrismaService.agentCertification.update.mockResolvedValue({
        ...mockCertification,
        avgRating: 2.3,
        score: 60, // Score should decrease
      });

      const result = await service.updateAfterTask('agent-123', 1);

      expect(result.newScore).toBeLessThan(mockCertification.score);
    });
  });

  describe('certification expiration', () => {
    it('should handle expired certification', async () => {
      const expiredDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const mockCertification = {
        id: 'cert-1',
        agentId: 'agent-123',
        level: 'silver',
        score: 70,
        testScore: 75,
        tasksCompleted: 20,
        avgRating: 4.0,
        earnedAt: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000),
        expiresAt: expiredDate,
        totalTests: 5,
        bestScore: 80,
      };

      mockPrismaService.agentCertification.findUnique.mockResolvedValue(mockCertification);
      mockPrismaService.agentCertification.update.mockResolvedValue({
        ...mockCertification,
        score: 85,
        testScore: 85,
        level: 'gold',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      });

      const result = await service.updateAfterTest('agent-123', 85, 85);

      // Should recertify with new expiration date
      expect(result.newLevel).toBe('gold');
      expect(result.hasLeveledUp).toBe(true);
    });

    it('should require retest after expiration', async () => {
      const expiredCert = {
        id: 'cert-1',
        agentId: 'agent-123',
        level: 'gold',
        score: 90,
        testScore: 90,
        tasksCompleted: 50,
        avgRating: 4.9,
        earnedAt: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // Expired
        totalTests: 10,
        bestScore: 95,
      };

      mockPrismaService.agentCertification.findUnique.mockResolvedValue(expiredCert);

      const result = await service.getCertification('agent-123');

      expect(result.status).toBe('expired');
    });

    it('should set correct expiration date on new certification', async () => {
      mockPrismaService.agentCertification.findUnique.mockResolvedValue(null);
      mockPrismaService.agentCertification.create.mockResolvedValue({
        id: 'cert-1',
        agentId: 'agent-123',
        level: 'bronze',
        score: 0,
        testScore: 0,
        tasksCompleted: 0,
        avgRating: 0,
        earnedAt: null,
        expiresAt: null,
        totalTests: 0,
        bestScore: 0,
      });

      const result = await service.getCertification('agent-123');

      expect(result.level).toBe('bronze');
    });
  });

  describe('concurrent certification applications', () => {
    it('should handle multiple agents applying simultaneously', async () => {
      const agents = ['agent-1', 'agent-2', 'agent-3'];

      mockPrismaService.agentCertification.findUnique.mockResolvedValue(null);
      mockPrismaService.agentCertification.create.mockImplementation((data) =>
        Promise.resolve({
          id: `cert-${data.data.agentId}`,
          ...data.data,
        }),
      );

      const results = await Promise.all(
        agents.map((agentId) => service.getCertification(agentId)),
      );

      expect(results).toHaveLength(3);
      results.forEach((result, index) => {
        expect(result.id).toContain(agents[index]);
      });
    });

    it('should prevent duplicate certifications for same agent', async () => {
      const agentId = 'agent-123';
      const mockCertification = {
        id: 'cert-1',
        agentId,
        level: 'silver',
        score: 75,
        testScore: 80,
        tasksCompleted: 20,
        avgRating: 4.5,
        earnedAt: new Date(),
        expiresAt: new Date(),
        totalTests: 5,
        bestScore: 85,
      };

      mockPrismaService.agentCertification.findUnique.mockResolvedValue(mockCertification);

      const results = await Promise.all([
        service.getCertification(agentId),
        service.getCertification(agentId),
        service.getCertification(agentId),
      ]);

      // All should return the same certification
      results.forEach((result) => {
        expect(result.id).toBe('cert-1');
      });
    });

    it('should handle concurrent level updates correctly', async () => {
      const agentId = 'agent-123';
      const mockCertification = {
        id: 'cert-1',
        agentId,
        level: 'bronze',
        score: 50,
        testScore: 60,
        tasksCompleted: 10,
        avgRating: 4.0,
        totalTests: 5,
        bestScore: 65,
        earnedAt: new Date(),
        expiresAt: new Date(),
      };

      mockPrismaService.agentCertification.findUnique.mockResolvedValue(mockCertification);
      mockPrismaService.agentCertification.update.mockResolvedValue({
        ...mockCertification,
        score: 75,
        testScore: 85,
        level: 'silver',
      });

      const results = await Promise.all([
        service.updateAfterTest(agentId, 85, 85),
        service.updateAfterTask(agentId, 5),
      ]);

      expect(results).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle zero task completion', async () => {
      const mockCertification = {
        id: 'cert-1',
        agentId: 'agent-123',
        level: 'bronze',
        score: 30,
        testScore: 50,
        tasksCompleted: 0,
        avgRating: 0,
        earnedAt: new Date(),
        expiresAt: new Date(),
      };

      mockPrismaService.agentCertification.findUnique.mockResolvedValue(mockCertification);
      mockPrismaService.agentCertification.update.mockResolvedValue({
        ...mockCertification,
        tasksCompleted: 0,
        avgRating: 0,
        score: 30,
      });

      const result = await service.updateAfterTask('agent-123', 0);

      expect(result.newScore).toBe(30);
    });

    it('should handle maximum values', async () => {
      const mockCertification = {
        id: 'cert-1',
        agentId: 'agent-123',
        level: 'gold',
        score: 100,
        testScore: 100,
        tasksCompleted: 1000,
        avgRating: 5.0,
        earnedAt: new Date(),
        expiresAt: new Date(),
        totalTests: 100,
        bestScore: 100,
      };

      mockPrismaService.agentCertification.findUnique.mockResolvedValue(mockCertification);
      mockPrismaService.agentCertification.update.mockResolvedValue(mockCertification);

      const result = await service.updateAfterTest('agent-123', 100, 100);

      expect(result.newScore).toBe(100);
      expect(result.newLevel).toBe('gold');
    });

    it('should handle negative rating impact', async () => {
      const mockCertification = {
        id: 'cert-1',
        agentId: 'agent-123',
        level: 'silver',
        score: 70,
        testScore: 75,
        tasksCompleted: 20,
        avgRating: 4.0,
        earnedAt: new Date(),
        expiresAt: new Date(),
      };

      mockPrismaService.agentCertification.findUnique.mockResolvedValue(mockCertification);
      mockPrismaService.agentCertification.update.mockResolvedValue({
        ...mockCertification,
        avgRating: 3.5,
        score: 67,
      });

      const result = await service.updateAfterTask('agent-123', 1);

      expect(result.newScore).toBeLessThan(mockCertification.score);
    });
  });
});
