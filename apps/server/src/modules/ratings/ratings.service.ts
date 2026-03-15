import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  CreateRatingDto,
  RatingQueryDto,
  PaginatedRatingsResponseDto,
  AgentRatingSummaryDto,
  RatingStatisticsDto,
  AnomalyDetectionDto,
  RatingHistoryDto,
  RatingHistoryPointDto,
} from './dto/ratings.dto';

@Injectable()
export class RatingsService {
  private readonly logger = new Logger(RatingsService.name);

  // Rating weights for overall calculation
  private readonly RATING_WEIGHTS = {
    quality: 0.3,
    speed: 0.25,
    communication: 0.2,
    professionalism: 0.25,
  };

  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // Rating CRUD
  // ============================================

  async createRating(dto: CreateRatingDto) {
    // Validate all ratings are between 1 and 5
    const { quality, speed, communication, professionalism } = dto;
    if (
      quality < 1 ||
      quality > 5 ||
      speed < 1 ||
      speed > 5 ||
      communication < 1 ||
      communication > 5 ||
      professionalism < 1 ||
      professionalism > 5
    ) {
      throw new BadRequestException('All ratings must be between 1 and 5');
    }

    // Check agent exists
    const agent = await this.prisma.agent.findUnique({
      where: { id: dto.toAgentId },
    });

    if (!agent) {
      throw new NotFoundException(
        `Agent with id "${dto.toAgentId}" not found`,
      );
    }

    // Check if rating already exists for same task (if taskId provided)
    if (dto.taskId) {
      const existing = await this.prisma.rating.findFirst({
        where: {
          fromUserId: dto.fromUserId,
          toAgentId: dto.toAgentId,
          taskId: dto.taskId,
        },
      });

      if (existing) {
        throw new BadRequestException(
          'Rating already exists for this user, agent, and task combination',
        );
      }
    }

    // Create rating
    const rating = await this.prisma.rating.create({
      data: dto,
    });

    // Update rating summary
    await this.updateRatingSummary(dto.toAgentId);

    return rating;
  }

  async getAgentRatings(
    agentId: string,
    query: RatingQueryDto,
  ): Promise<PaginatedRatingsResponseDto> {
    const { page = 1, limit = 10, minRating } = query;
    const skip = (page - 1) * limit;

    const where: any = { toAgentId: agentId };

    // Filter by minimum overall rating
    if (minRating) {
      // This is a simplified filter - in production, you might need raw query
    }

    const [data, total] = await Promise.all([
      this.prisma.rating.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.rating.count({ where }),
    ]);

    // Calculate overall rating for each
    const ratingsWithOverall = data.map((rating) => ({
      ...rating,
      overallRating: this.calculateOverallRating(rating),
    }));

    return {
      data: ratingsWithOverall as any,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getTaskRatings(taskId: string) {
    return this.prisma.rating.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteRating(id: string) {
    const rating = await this.prisma.rating.findUnique({
      where: { id },
    });

    if (!rating) {
      throw new NotFoundException(`Rating with id "${id}" not found`);
    }

    const deleted = await this.prisma.rating.delete({
      where: { id },
    });

    // Update rating summary
    await this.updateRatingSummary(rating.toAgentId);

    return deleted;
  }

  // ============================================
  // Rating Summary
  // ============================================

  async getAgentRatingSummary(agentId: string): Promise<AgentRatingSummaryDto> {
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      throw new NotFoundException(`Agent with id "${agentId}" not found`);
    }

    const summary = await this.prisma.agentRatingSummary.findUnique({
      where: { agentId },
    });

    if (!summary) {
      // Return default summary
      return {
        agentId,
        avgQuality: 0,
        avgSpeed: 0,
        avgCommunication: 0,
        avgProfessionalism: 0,
        overallRating: 0,
        totalRatings: 0,
        rating5Count: 0,
        rating4Count: 0,
        rating3Count: 0,
        rating2Count: 0,
        rating1Count: 0,
        ratingDistribution: [],
      };
    }

    // Calculate rating distribution
    const total = summary.totalRatings;
    const ratingDistribution = [
      { rating: 5, count: summary.rating5Count, percentage: total > 0 ? (summary.rating5Count / total) * 100 : 0 },
      { rating: 4, count: summary.rating4Count, percentage: total > 0 ? (summary.rating4Count / total) * 100 : 0 },
      { rating: 3, count: summary.rating3Count, percentage: total > 0 ? (summary.rating3Count / total) * 100 : 0 },
      { rating: 2, count: summary.rating2Count, percentage: total > 0 ? (summary.rating2Count / total) * 100 : 0 },
      { rating: 1, count: summary.rating1Count, percentage: total > 0 ? (summary.rating1Count / total) * 100 : 0 },
    ];

    return {
      ...summary,
      ratingDistribution,
    };
  }

  async updateRatingSummary(agentId: string): Promise<AgentRatingSummaryDto> {
    // Calculate averages
    const aggregates = await this.prisma.rating.aggregate({
      where: { toAgentId: agentId },
      _avg: {
        quality: true,
        speed: true,
        communication: true,
        professionalism: true,
      },
      _count: { id: true },
    });

    const totalRatings = aggregates._count.id;
    const avgQuality = aggregates._avg.quality || 0;
    const avgSpeed = aggregates._avg.speed || 0;
    const avgCommunication = aggregates._avg.communication || 0;
    const avgProfessionalism = aggregates._avg.professionalism || 0;

    // Calculate overall rating
    const overallRating =
      avgQuality * this.RATING_WEIGHTS.quality +
      avgSpeed * this.RATING_WEIGHTS.speed +
      avgCommunication * this.RATING_WEIGHTS.communication +
      avgProfessionalism * this.RATING_WEIGHTS.professionalism;

    // Count ratings by level (using quality as proxy for overall)
    const ratings = await this.prisma.rating.findMany({
      where: { toAgentId: agentId },
      select: { quality: true, speed: true, communication: true, professionalism: true },
    });

    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of ratings) {
      const avg = (r.quality + r.speed + r.communication + r.professionalism) / 4;
      const roundedRating = Math.round(avg);
      if (roundedRating >= 1 && roundedRating <= 5) {
        ratingCounts[roundedRating as keyof typeof ratingCounts]++;
      }
    }

    const summary = await this.prisma.agentRatingSummary.upsert({
      where: { agentId },
      update: {
        avgQuality,
        avgSpeed,
        avgCommunication,
        avgProfessionalism,
        overallRating,
        totalRatings,
        rating5Count: ratingCounts[5],
        rating4Count: ratingCounts[4],
        rating3Count: ratingCounts[3],
        rating2Count: ratingCounts[2],
        rating1Count: ratingCounts[1],
      },
      create: {
        agentId,
        avgQuality,
        avgSpeed,
        avgCommunication,
        avgProfessionalism,
        overallRating,
        totalRatings,
        rating5Count: ratingCounts[5],
        rating4Count: ratingCounts[4],
        rating3Count: ratingCounts[3],
        rating2Count: ratingCounts[2],
        rating1Count: ratingCounts[1],
      },
    });

    const total = summary.totalRatings;
    const ratingDistribution = [
      { rating: 5, count: summary.rating5Count, percentage: total > 0 ? (summary.rating5Count / total) * 100 : 0 },
      { rating: 4, count: summary.rating4Count, percentage: total > 0 ? (summary.rating4Count / total) * 100 : 0 },
      { rating: 3, count: summary.rating3Count, percentage: total > 0 ? (summary.rating3Count / total) * 100 : 0 },
      { rating: 2, count: summary.rating2Count, percentage: total > 0 ? (summary.rating2Count / total) * 100 : 0 },
      { rating: 1, count: summary.rating1Count, percentage: total > 0 ? (summary.rating1Count / total) * 100 : 0 },
    ];

    return {
      ...summary,
      ratingDistribution,
    };
  }

  // ============================================
  // Rating Analysis
  // ============================================

  async detectAnomalousRatings(agentId: string): Promise<AnomalyDetectionDto> {
    const ratings = await this.prisma.rating.findMany({
      where: { toAgentId: agentId },
    });

    const anomalousUsers: string[] = [];
    const suspiciousPatterns: string[] = [];

    // Group ratings by user
    const userRatings = new Map<string, typeof ratings>();
    for (const rating of ratings) {
      const existing = userRatings.get(rating.fromUserId) || [];
      existing.push(rating);
      userRatings.set(rating.fromUserId, existing);
    }

    // Detect anomalous patterns
    for (const [userId, userRatingList] of userRatings) {
      // Pattern 1: All 1s (possible malicious)
      if (userRatingList.length >= 3) {
        const allOnes = userRatingList.every(
          (r) =>
            r.quality === 1 &&
            r.speed === 1 &&
            r.communication === 1 &&
            r.professionalism === 1,
        );
        if (allOnes) {
          anomalousUsers.push(userId);
          suspiciousPatterns.push(
            `User ${userId} gave all 1-star ratings multiple times`,
          );
        }

        // Pattern 2: All 5s (possible manipulation)
        const allFives = userRatingList.every(
          (r) =>
            r.quality === 5 &&
            r.speed === 5 &&
            r.communication === 5 &&
            r.professionalism === 5,
        );
        if (allFives) {
          suspiciousPatterns.push(
            `User ${userId} gave all 5-star ratings multiple times`,
          );
        }
      }
    }

    let recommendation = 'No anomalies detected';
    if (anomalousUsers.length > 0) {
      recommendation =
        'Consider reviewing ratings from flagged users for potential abuse';
    }

    return {
      agentId,
      anomalousUsers,
      suspiciousPatterns,
      recommendation,
    };
  }

  async getRatingHistory(
    agentId: string,
    days: number = 30,
  ): Promise<RatingHistoryDto> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const ratings = await this.prisma.rating.findMany({
      where: {
        toAgentId: agentId,
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const dateMap = new Map<string, { total: number; count: number }>();

    for (const rating of ratings) {
      const date = rating.createdAt.toISOString().split('T')[0];
      const overall = this.calculateOverallRating(rating);
      const existing = dateMap.get(date) || { total: 0, count: 0 };
      dateMap.set(date, {
        total: existing.total + overall,
        count: existing.count + 1,
      });
    }

    const history: RatingHistoryPointDto[] = [];
    for (const [date, data] of dateMap) {
      history.push({
        date,
        avgRating: data.total / data.count,
        count: data.count,
      });
    }

    // Calculate trend
    let trend: 'up' | 'down' | 'stable' = 'stable';
    let changePercent = 0;

    if (history.length >= 2) {
      const firstHalf = history.slice(0, Math.floor(history.length / 2));
      const secondHalf = history.slice(Math.floor(history.length / 2));

      const firstAvg =
        firstHalf.reduce((sum, h) => sum + h.avgRating, 0) / firstHalf.length;
      const secondAvg =
        secondHalf.reduce((sum, h) => sum + h.avgRating, 0) / secondHalf.length;

      changePercent = ((secondAvg - firstAvg) / firstAvg) * 100;

      if (changePercent > 5) {
        trend = 'up';
      } else if (changePercent < -5) {
        trend = 'down';
      }
    }

    return { history, trend, changePercent };
  }

  calculateOverallRating(rating: {
    quality: number;
    speed: number;
    communication: number;
    professionalism: number;
  }): number {
    return (
      rating.quality * this.RATING_WEIGHTS.quality +
      rating.speed * this.RATING_WEIGHTS.speed +
      rating.communication * this.RATING_WEIGHTS.communication +
      rating.professionalism * this.RATING_WEIGHTS.professionalism
    );
  }

  // ============================================
  // Statistics
  // ============================================

  async getRatingStatistics(): Promise<RatingStatisticsDto> {
    const aggregates = await this.prisma.rating.aggregate({
      _avg: {
        quality: true,
        speed: true,
        communication: true,
        professionalism: true,
      },
      _count: { id: true },
    });

    const totalRatedAgents = await this.prisma.agentRatingSummary.count({
      where: { totalRatings: { gt: 0 } },
    });

    const avgQuality = aggregates._avg.quality || 0;
    const avgSpeed = aggregates._avg.speed || 0;
    const avgCommunication = aggregates._avg.communication || 0;
    const avgProfessionalism = aggregates._avg.professionalism || 0;

    const avgOverall =
      avgQuality * this.RATING_WEIGHTS.quality +
      avgSpeed * this.RATING_WEIGHTS.speed +
      avgCommunication * this.RATING_WEIGHTS.communication +
      avgProfessionalism * this.RATING_WEIGHTS.professionalism;

    return {
      totalRatings: aggregates._count.id,
      totalRatedAgents,
      avgQuality,
      avgSpeed,
      avgCommunication,
      avgProfessionalism,
      avgOverall,
    };
  }
}
