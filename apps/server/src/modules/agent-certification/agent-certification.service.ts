import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class AgentCertificationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get or create agent certification
   */
  async getCertification(agentId: string) {
    let certification = await this.prisma.agentCertification.findUnique({
      where: { agentId },
    });

    if (!certification) {
      certification = await this.prisma.agentCertification.create({
        data: {
          agentId,
          level: 'bronze',
          score: 0,
        },
      });
    }

    return {
      id: certification.id,
      agentId: certification.agentId,
      level: this.capitalizeLevel(certification.level),
      score: certification.score,
      testScore: certification.testScore,
      tasksCompleted: certification.tasksCompleted,
      avgRating: certification.avgRating,
      badgeUrl: this.getBadgeUrl(certification.level),
      testDate: certification.earnedAt,
      expiryDate: certification.expiresAt,
      status: this.getCertificationStatus(certification.expiresAt),
      dimensions: this.getDimensions(certification),
    };
  }

  /**
   * Apply for certification
   */
  async applyForCertification(agentId: string) {
    let certification = await this.prisma.agentCertification.findUnique({
      where: { agentId },
    });

    if (!certification) {
      certification = await this.prisma.agentCertification.create({
        data: {
          agentId,
          level: 'bronze',
          score: 0,
        },
      });
    }

    return {
      certificationId: certification.id,
      agentId: certification.agentId,
      level: this.capitalizeLevel(certification.level),
      status: 'pending',
      message: 'Certification application submitted. Please complete the test.',
    };
  }

  /**
   * Get certification status based on expiry date
   */
  private getCertificationStatus(expiresAt: Date): string {
    if (!expiresAt) return 'pending';
    const now = new Date();
    if (now > expiresAt) return 'expired';
    return 'active';
  }

  /**
   * Get dimensions from certification
   */
  private getDimensions(certification: any): any[] {
    return [
      {
        category: 'Code Generation',
        score: certification.testScore || 0,
      },
      {
        category: 'Problem Solving',
        score: Math.round((certification.tasksCompleted || 0) * 5),
      },
      {
        category: 'Quality',
        score: Math.round((certification.avgRating || 0) * 20),
      },
    ];
  }

  /**
   * Capitalize first letter of level
   */
  private capitalizeLevel(level: string): string {
    return level.charAt(0).toUpperCase() + level.slice(1);
  }

  /**
   * Update certification after test completion
   */
  async updateAfterTest(agentId: string, testScore: number, percentage: number) {
    const certification = await this.prisma.agentCertification.findUnique({
      where: { agentId },
    });

    if (!certification) {
      throw new NotFoundException('Certification not found');
    }

    // Update statistics
    const newTotalTests = certification.totalTests + 1;
    const newBestScore = Math.max(certification.bestScore, testScore);

    // Calculate new certification score
    const newScore = this.calculateCertificationScore({
      testScore: percentage,
      tasksCompleted: certification.tasksCompleted,
      avgRating: certification.avgRating,
    });

    const newLevel = this.getLevel(newScore);

    // Update certification
    const updated = await this.prisma.agentCertification.update({
      where: { agentId },
      data: {
        testScore: percentage,
        score: newScore,
        level: newLevel,
        totalTests: newTotalTests,
        bestScore: newBestScore,
        earnedAt: this.hasLevelUp(certification.level, newLevel) ? new Date() : certification.earnedAt,
        expiresAt: this.calculateExpiryDate(newLevel),
      },
    });

    return {
      certificationId: updated.id,
      previousLevel: certification.level,
      newLevel: updated.level,
      newScore: updated.score,
      badgeUrl: this.getBadgeUrl(updated.level),
      earnedAt: updated.earnedAt,
      expiresAt: updated.expiresAt,
      hasLeveledUp: this.hasLevelUp(certification.level, newLevel),
    };
  }

  /**
   * Update certification after task completion
   */
  async updateAfterTask(agentId: string, rating: number) {
    const certification = await this.prisma.agentCertification.findUnique({
      where: { agentId },
    });

    if (!certification) {
      throw new NotFoundException('Certification not found');
    }

    // Update statistics
    const newTasksCompleted = certification.tasksCompleted + 1;
    const newAvgRating = (certification.avgRating * certification.tasksCompleted + rating) / newTasksCompleted;

    // Calculate new certification score
    const newScore = this.calculateCertificationScore({
      testScore: certification.testScore,
      tasksCompleted: newTasksCompleted,
      avgRating: newAvgRating,
    });

    const newLevel = this.getLevel(newScore);

    // Update certification
    const updated = await this.prisma.agentCertification.update({
      where: { agentId },
      data: {
        tasksCompleted: newTasksCompleted,
        avgRating: newAvgRating,
        score: newScore,
        level: newLevel,
        earnedAt: this.hasLevelUp(certification.level, newLevel) ? new Date() : certification.earnedAt,
        expiresAt: this.calculateExpiryDate(newLevel),
      },
    });

    return {
      certificationId: updated.id,
      previousLevel: certification.level,
      newLevel: updated.level,
      newScore: updated.score,
      badgeUrl: this.getBadgeUrl(updated.level),
      earnedAt: updated.earnedAt,
      expiresAt: updated.expiresAt,
      hasLeveledUp: this.hasLevelUp(certification.level, newLevel),
    };
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(level?: string, limit = 50, page = 1) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (level && level !== 'all') {
      where.level = level;
    }

    const [certifications, total] = await Promise.all([
      this.prisma.agentCertification.findMany({
        where,
        orderBy: [{ score: 'desc' }, { earnedAt: 'asc' }],
        skip,
        take: limit,
      }),
      this.prisma.agentCertification.count({ where }),
    ]);

    // Get agent details
    const agentIds = certifications.map(c => c.agentId);
    const agents = await this.prisma.agent.findMany({
      where: { id: { in: agentIds } },
      select: { id: true, name: true, description: true },
    });

    const agentMap = new Map(agents.map(a => [a.id, a]));

    const leaderboard = certifications.map((cert, index) => ({
      rank: skip + index + 1,
      agentId: cert.agentId,
      agentName: agentMap.get(cert.agentId)?.name || 'Unknown',
      level: cert.level,
      score: cert.score,
      testScore: cert.testScore,
      tasksCompleted: cert.tasksCompleted,
      avgRating: cert.avgRating,
      badgeUrl: this.getBadgeUrl(cert.level),
      earnedAt: cert.earnedAt,
    }));

    return {
      leaderboard,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get agents by level
   */
  async getAgentsByLevel(level: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [certifications, total] = await Promise.all([
      this.prisma.agentCertification.findMany({
        where: { level },
        orderBy: [{ score: 'desc' }, { earnedAt: 'asc' }],
        skip,
        take: limit,
      }),
      this.prisma.agentCertification.count({ where: { level } }),
    ]);

    // Get agent details
    const agentIds = certifications.map(c => c.agentId);
    const agents = await this.prisma.agent.findMany({
      where: { id: { in: agentIds } },
      select: { id: true, name: true, description: true },
    });

    const agentMap = new Map(agents.map(a => [a.id, a]));

    return {
      agents: certifications.map(cert => ({
        agentId: cert.agentId,
        agentName: agentMap.get(cert.agentId)?.name || 'Unknown',
        agentDescription: agentMap.get(cert.agentId)?.description,
        level: cert.level,
        score: cert.score,
        badgeUrl: this.getBadgeUrl(cert.level),
        earnedAt: cert.earnedAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get certification statistics
   */
  async getStats() {
    const [
      totalCertifications,
      bronzeCount,
      silverCount,
      goldCount,
      avgScore,
      topPerformers,
    ] = await Promise.all([
      this.prisma.agentCertification.count(),
      this.prisma.agentCertification.count({ where: { level: 'bronze' } }),
      this.prisma.agentCertification.count({ where: { level: 'silver' } }),
      this.prisma.agentCertification.count({ where: { level: 'gold' } }),
      this.prisma.agentCertification.aggregate({
        _avg: { score: true },
      }),
      this.prisma.agentCertification.findMany({
        orderBy: { score: 'desc' },
        take: 10,
      }),
    ]);

    // Get agent names for top performers
    const agentIds = topPerformers.map(c => c.agentId);
    const agents = await this.prisma.agent.findMany({
      where: { id: { in: agentIds } },
      select: { id: true, name: true },
    });

    const agentMap = new Map(agents.map(a => [a.id, a.name]));

    return {
      totalCertifications,
      levelDistribution: {
        bronze: bronzeCount,
        silver: silverCount,
        gold: goldCount,
      },
      averageScore: avgScore._avg.score || 0,
      topPerformers: topPerformers.map((cert, index) => ({
        rank: index + 1,
        agentId: cert.agentId,
        agentName: agentMap.get(cert.agentId) || 'Unknown',
        level: cert.level,
        score: cert.score,
      })),
    };
  }

  /**
   * Calculate certification score based on multiple factors
   */
  private calculateCertificationScore(data: {
    testScore: number;
    tasksCompleted: number;
    avgRating: number;
  }): number {
    const { testScore, tasksCompleted, avgRating } = data;

    // Weight factors
    const TEST_WEIGHT = 0.5;
    const TASK_WEIGHT = 0.3;
    const RATING_WEIGHT = 0.2;

    // Calculate task score (max 100 points from tasks)
    const taskScore = Math.min(tasksCompleted * 2, 100);

    // Calculate rating score (1-5 scale to 0-100)
    const ratingScore = (avgRating / 5) * 100;

    // Calculate weighted score
    const finalScore =
      testScore * TEST_WEIGHT +
      taskScore * TASK_WEIGHT +
      ratingScore * RATING_WEIGHT;

    return Math.round(finalScore * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Get level based on score
   */
  private getLevel(score: number): string {
    if (score >= 85) return 'gold';
    if (score >= 60) return 'silver';
    return 'bronze';
  }

  /**
   * Check if level has increased
   */
  private hasLevelUp(oldLevel: string, newLevel: string): boolean {
    const levels = { bronze: 1, silver: 2, gold: 3 };
    return levels[newLevel] > levels[oldLevel];
  }

  /**
   * Calculate expiry date for certification
   */
  private calculateExpiryDate(level: string): Date {
    const now = new Date();
    const validityPeriod = {
      bronze: 90, // 90 days
      silver: 180, // 180 days
      gold: 365, // 365 days
    };

    const days = validityPeriod[level] || 90;
    return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  }

  /**
   * Get badge URL based on level
   */
  private getBadgeUrl(level: string): string {
    const baseUrl = process.env.BADGE_BASE_URL || '/badges';
    return `${baseUrl}/${level}-badge.svg`;
  }

  /**
   * Manually set certification level (admin function)
   */
  async setLevel(agentId: string, level: string) {
    const certification = await this.prisma.agentCertification.findUnique({
      where: { agentId },
    });

    if (!certification) {
      throw new NotFoundException('Certification not found');
    }

    const validLevels = ['bronze', 'silver', 'gold'];
    if (!validLevels.includes(level)) {
      throw new Error(`Invalid level. Must be one of: ${validLevels.join(', ')}`);
    }

    const updated = await this.prisma.agentCertification.update({
      where: { agentId },
      data: {
        level,
        score: this.getLevelScore(level),
        earnedAt: new Date(),
        expiresAt: this.calculateExpiryDate(level),
      },
    });

    return {
      certificationId: updated.id,
      agentId: updated.agentId,
      newLevel: updated.level,
      newScore: updated.score,
      badgeUrl: this.getBadgeUrl(updated.level),
    };
  }

  /**
   * Get base score for level
   */
  private getLevelScore(level: string): number {
    const scores = { bronze: 30, silver: 70, gold: 90 };
    return scores[level] || 30;
  }
}
