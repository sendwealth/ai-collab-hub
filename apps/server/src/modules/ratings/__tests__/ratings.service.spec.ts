import { Test, TestingModule } from '@nestjs/testing';
import { RatingsService } from '../ratings.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('RatingsService', () => {
  let service: RatingsService;
  let prisma: jest.Mocked<PrismaService>;

  const mockRating = {
    id: 'rating-1',
    fromUserId: 'user-1',
    toAgentId: 'agent-1',
    taskId: 'task-1',
    quality: 5,
    speed: 4,
    communication: 5,
    professionalism: 4,
    comment: 'Great work!',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRatingSummary = {
    agentId: 'agent-1',
    avgQuality: 4.5,
    avgSpeed: 4.0,
    avgCommunication: 4.5,
    avgProfessionalism: 4.0,
    overallRating: 4.25,
    totalRatings: 10,
    rating5Count: 4,
    rating4Count: 4,
    rating3Count: 2,
    rating2Count: 0,
    rating1Count: 0,
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrisma = {
      rating: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        aggregate: jest.fn(),
      },
      agentRatingSummary: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
      },
      agent: {
        findUnique: jest.fn(),
      },
      task: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RatingsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<RatingsService>(RatingsService);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ============================================
  // Rating CRUD Tests
  // ============================================

  describe('createRating', () => {
    it('should create a new rating', async () => {
      const createDto = {
        fromUserId: 'user-1',
        toAgentId: 'agent-1',
        taskId: 'task-1',
        quality: 5,
        speed: 4,
        communication: 5,
        professionalism: 4,
        comment: 'Great work!',
      };

      prisma.agent.findUnique.mockResolvedValue({ id: 'agent-1' } as any);
      prisma.rating.findFirst.mockResolvedValue(null);
      prisma.rating.create.mockResolvedValue(mockRating);
      prisma.rating.aggregate.mockResolvedValue({
        _avg: {
          quality: 4.5,
          speed: 4.0,
          communication: 4.5,
          professionalism: 4.0,
        },
        _count: { id: 10 },
      });
      prisma.rating.groupBy.mockResolvedValue([
        { quality: 5, _count: 4 },
        { quality: 4, _count: 4 },
        { quality: 3, _count: 2 },
      ] as any);
      prisma.agentRatingSummary.upsert.mockResolvedValue(mockRatingSummary);

      const result = await service.createRating(createDto);

      expect(prisma.rating.create).toHaveBeenCalled();
      expect(result).toEqual(mockRating);
    });

    it('should throw NotFoundException if agent not found', async () => {
      const createDto = {
        fromUserId: 'user-1',
        toAgentId: 'non-existent',
        quality: 5,
        speed: 5,
        communication: 5,
        professionalism: 5,
      };

      prisma.agent.findUnique.mockResolvedValue(null);

      await expect(service.createRating(createDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if rating already exists for same task', async () => {
      const createDto = {
        fromUserId: 'user-1',
        toAgentId: 'agent-1',
        taskId: 'task-1',
        quality: 5,
        speed: 5,
        communication: 5,
        professionalism: 5,
      };

      prisma.agent.findUnique.mockResolvedValue({ id: 'agent-1' } as any);
      prisma.rating.findFirst.mockResolvedValue(mockRating);

      await expect(service.createRating(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should validate all ratings are between 1 and 5', async () => {
      const createDto = {
        fromUserId: 'user-1',
        toAgentId: 'agent-1',
        quality: 6,
        speed: 5,
        communication: 5,
        professionalism: 5,
      };

      await expect(service.createRating(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getAgentRatings', () => {
    it('should return all ratings for an agent with pagination', async () => {
      prisma.rating.findMany.mockResolvedValue([mockRating]);
      prisma.rating.count.mockResolvedValue(1);

      const result = await service.getAgentRatings('agent-1', {
        page: 1,
        limit: 10,
      });

      expect(result.data).toEqual([mockRating]);
      expect(result.total).toBe(1);
    });
  });

  describe('getTaskRatings', () => {
    it('should return all ratings for a task', async () => {
      prisma.rating.findMany.mockResolvedValue([mockRating]);

      const result = await service.getTaskRatings('task-1');

      expect(result).toEqual([mockRating]);
    });
  });

  describe('deleteRating', () => {
    it('should delete a rating', async () => {
      prisma.rating.findUnique.mockResolvedValue(mockRating);
      prisma.rating.delete.mockResolvedValue(mockRating);

      await service.deleteRating('rating-1');

      expect(prisma.rating.delete).toHaveBeenCalledWith({
        where: { id: 'rating-1' },
      });
    });

    it('should throw NotFoundException if rating not found', async () => {
      prisma.rating.findUnique.mockResolvedValue(null);

      await expect(service.deleteRating('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ============================================
  // Rating Summary Tests
  // ============================================

  describe('getAgentRatingSummary', () => {
    it('should return rating summary for an agent', async () => {
      prisma.agent.findUnique.mockResolvedValue({ id: 'agent-1' } as any);
      prisma.agentRatingSummary.findUnique.mockResolvedValue(mockRatingSummary);

      const result = await service.getAgentRatingSummary('agent-1');

      expect(result).toEqual(mockRatingSummary);
    });

    it('should throw NotFoundException if agent not found', async () => {
      prisma.agent.findUnique.mockResolvedValue(null);

      await expect(
        service.getAgentRatingSummary('non-existent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return default summary if no ratings exist', async () => {
      prisma.agent.findUnique.mockResolvedValue({ id: 'agent-1' } as any);
      prisma.agentRatingSummary.findUnique.mockResolvedValue(null);

      const result = await service.getAgentRatingSummary('agent-1');

      expect(result.overallRating).toBe(0);
      expect(result.totalRatings).toBe(0);
    });
  });

  describe('updateRatingSummary', () => {
    it('should update rating summary after new rating', async () => {
      prisma.rating.aggregate.mockResolvedValue({
        _avg: {
          quality: 4.5,
          speed: 4.0,
          communication: 4.5,
          professionalism: 4.0,
        },
        _count: { id: 10 },
      });
      prisma.rating.groupBy.mockResolvedValue([
        { quality: 5, _count: 4 },
        { quality: 4, _count: 4 },
        { quality: 3, _count: 2 },
      ] as any);
      prisma.agentRatingSummary.upsert.mockResolvedValue(mockRatingSummary);

      const result = await service.updateRatingSummary('agent-1');

      expect(prisma.agentRatingSummary.upsert).toHaveBeenCalled();
      expect(result.overallRating).toBeGreaterThan(0);
    });
  });

  // ============================================
  // Rating Analysis Tests
  // ============================================

  describe('detectAnomalousRatings', () => {
    it('should detect anomalous ratings (all 1s or all 5s from same user)', async () => {
      prisma.rating.findMany.mockResolvedValue([
        { ...mockRating, fromUserId: 'suspicious-user', quality: 1, speed: 1, communication: 1, professionalism: 1 },
        { ...mockRating, fromUserId: 'suspicious-user', id: 'rating-2', quality: 1, speed: 1, communication: 1, professionalism: 1 },
        { ...mockRating, fromUserId: 'suspicious-user', id: 'rating-3', quality: 1, speed: 1, communication: 1, professionalism: 1 },
      ]);

      const result = await service.detectAnomalousRatings('agent-1');

      expect(result.anomalousUsers).toContain('suspicious-user');
    });

    it('should return empty array if no anomalies detected', async () => {
      prisma.rating.findMany.mockResolvedValue([]);

      const result = await service.detectAnomalousRatings('agent-1');

      expect(result.anomalousUsers).toEqual([]);
    });
  });

  describe('getRatingHistory', () => {
    it('should return rating history over time', async () => {
      prisma.rating.findMany.mockResolvedValue([
        { ...mockRating, createdAt: new Date('2024-01-01') },
        { ...mockRating, createdAt: new Date('2024-01-02') },
      ]);

      const result = await service.getRatingHistory('agent-1', 30);

      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('calculateOverallRating', () => {
    it('should calculate weighted overall rating', () => {
      const rating = {
        quality: 5,
        speed: 4,
        communication: 5,
        professionalism: 4,
      };

      const result = service.calculateOverallRating(rating);

      // Weights: quality 30%, speed 25%, communication 20%, professionalism 25%
      const expected = 5 * 0.3 + 4 * 0.25 + 5 * 0.2 + 4 * 0.25;
      expect(result).toBeCloseTo(expected, 2);
    });
  });

  // ============================================
  // Statistics Tests
  // ============================================

  describe('getRatingStatistics', () => {
    it('should return global rating statistics', async () => {
      prisma.rating.aggregate.mockResolvedValue({
        _avg: {
          quality: 4.2,
          speed: 4.0,
          communication: 4.3,
          professionalism: 4.1,
        },
        _count: { id: 100 },
      });
      prisma.agentRatingSummary.count.mockResolvedValue(20);

      const result = await service.getRatingStatistics();

      expect(result.totalRatings).toBe(100);
      expect(result.totalRatedAgents).toBe(20);
    });
  });
});
