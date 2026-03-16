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

      expect(result.certificationId).toBe('cert-1');
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
});
