import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  AgentRecommendationRequestDto,
  AgentRecommendationResponseDto,
  TaskRecommendationRequestDto,
  TaskRecommendationResponseDto,
  PricingSuggestionRequestDto,
  PricingSuggestionResponseDto,
  RecommendationFeedbackDto,
} from './dto/recommendations.dto';

interface AgentWithCapabilities {
  id: string;
  name: string;
  capabilities?: string | null;
  trustScore: number;
  status: string;
}

interface TaskWithRequirements {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  requirements?: string | null;
  reward?: string | null;
  deadline?: Date | null;
}

@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // Agent Recommendation
  // ============================================

  async recommendAgents(
    dto: AgentRecommendationRequestDto,
  ): Promise<AgentRecommendationResponseDto[]> {
    const task = await this.prisma.task.findUnique({
      where: { id: dto.taskId },
    });

    if (!task) {
      throw new Error('Task not found');
    }

    // 1. Extract task requirements
    const requirements = this.extractTaskRequirements(task);

    // 2. Get all available agents
    const agents = await this.prisma.agent.findMany({
      where: {
        status: { not: 'offline' },
        ...(dto.filters?.minTrustScore && {
          trustScore: { gte: dto.filters.minTrustScore },
        }),
      },
    });

    // 3. Get capabilities for all agents
    const capabilities = await this.prisma.agentCapability.findMany({
      where: {
        agentId: { in: agents.map(a => a.id) },
      },
    });

    const capabilitiesMap = new Map(capabilities.map(c => [c.agentId, c]));

    // 4. Get performance metrics for all agents
    const performances = await this.prisma.agentPerformance.findMany({
      where: {
        agentId: { in: agents.map(a => a.id) },
        periodStart: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      orderBy: {
        periodStart: 'desc',
      },
    });

    const performanceMap = new Map<string, typeof performances[0]>();
    for (const perf of performances) {
      if (!performanceMap.has(perf.agentId)) {
        performanceMap.set(perf.agentId, perf);
      }
    }

    // 5. Score agents
    const scoredAgents = agents.map(agent => {
      const caps = capabilitiesMap.get(agent.id);
      const perf = performanceMap.get(agent.id);

      return this.scoreAgent(agent, caps, perf, requirements);
    });

    // 6. Sort by score and return top N
    const limit = dto.limit || 10;
    const topAgents = scoredAgents
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // 7. Log recommendation
    await this.logRecommendation(
      'agent',
      dto.taskId,
      requirements,
      topAgents.map(a => ({ id: a.agentId, score: a.score })),
      dto.filters,
    );

    return topAgents;
  }

  private extractTaskRequirements(task: TaskWithRequirements): any {
    const requirements: any = {
      skills: [],
      difficulty: 'medium',
      category: task.category || 'general',
    };

    // Parse task requirements if available
    if (task.requirements) {
      try {
        const parsed = JSON.parse(task.requirements);
        requirements.skills = parsed.skills || [];
        requirements.difficulty = parsed.difficulty || 'medium';
        requirements.estimatedHours = parsed.estimatedHours || 0;
      } catch (e) {
        this.logger.warn('Failed to parse task requirements');
      }
    }

    // Extract skills from title and description
    const text = `${task.title} ${task.description || ''}`.toLowerCase();
    const skillKeywords = {
      coding: ['code', 'programming', 'development', 'api', 'backend', 'frontend'],
      writing: ['write', 'content', 'article', 'documentation', 'docs'],
      analysis: ['analysis', 'data', 'analytics', 'research', 'report'],
      design: ['design', 'ui', 'ux', 'graphic', 'visual'],
      testing: ['test', 'qa', 'quality', 'automation'],
      devops: ['deploy', 'infrastructure', 'ci/cd', 'cloud', 'docker'],
      dataScience: ['machine learning', 'ml', 'ai', 'data science', 'statistics'],
      machineLearning: ['ml', 'ai', 'neural', 'deep learning', 'nlp'],
      projectMgmt: ['project', 'management', 'coordination', 'planning'],
    };

    for (const [skill, keywords] of Object.entries(skillKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        if (!requirements.skills.includes(skill)) {
          requirements.skills.push(skill);
        }
      }
    }

    return requirements;
  }

  private scoreAgent(
    agent: AgentWithCapabilities,
    capabilities: any,
    performance: any,
    requirements: any,
  ): AgentRecommendationResponseDto {
    let capabilityMatch = 0;
    const matchedCapabilities: string[] = [];

    // Calculate capability match
    if (capabilities && requirements.skills.length > 0) {
      let matchedScore = 0;
      for (const skill of requirements.skills) {
        const skillScore = capabilities[skill] || 0;
        if (skillScore > 50) {
          matchedScore += skillScore;
          matchedCapabilities.push(skill);
        }
      }
      capabilityMatch = matchedScore / (requirements.skills.length * 100);
    }

    // Calculate success rate
    let successRate = 0;
    if (performance) {
      const total = performance.tasksCompleted + performance.tasksFailed;
      if (total > 0) {
        successRate = performance.tasksCompleted / total;
      }
    }

    // Calculate weighted score
    const weights = {
      capabilityMatch: 0.4,
      trustScore: 0.3,
      successRate: 0.2,
      responseTime: 0.1,
    };

    const normalizedTrustScore = agent.trustScore / 100;
    const normalizedResponseTime = performance
      ? Math.max(0, 1 - performance.avgResponseTime / 1440) // Normalize to 24 hours
      : 0.5;

    const score =
      capabilityMatch * weights.capabilityMatch +
      normalizedTrustScore * weights.trustScore +
      successRate * weights.successRate +
      normalizedResponseTime * weights.responseTime;

    // Generate reason
    let reason = 'Recommended based on ';
    const reasons: string[] = [];
    if (matchedCapabilities.length > 0) {
      reasons.push(`matched skills: ${matchedCapabilities.join(', ')}`);
    }
    if (agent.trustScore > 70) {
      reasons.push(`high trust score (${agent.trustScore})`);
    }
    if (successRate > 0.8) {
      reasons.push(`excellent success rate (${(successRate * 100).toFixed(0)}%)`);
    }
    reason += reasons.join(', ') || 'availability';

    return {
      agentId: agent.id,
      agentName: agent.name,
      score: Math.round(score * 100) / 100,
      matchedCapabilities,
      trustScore: agent.trustScore,
      successRate: Math.round(successRate * 100) / 100,
      avgResponseTime: performance?.avgResponseTime || 0,
      reason,
    };
  }

  // ============================================
  // Task Recommendation
  // ============================================

  async recommendTasks(
    dto: TaskRecommendationRequestDto,
  ): Promise<TaskRecommendationResponseDto[]> {
    const agent = await this.prisma.agent.findUnique({
      where: { id: dto.agentId },
    });

    if (!agent) {
      throw new Error('Agent not found');
    }

    // 1. Extract agent skills
    const skills = await this.extractAgentSkills(dto.agentId);

    // 2. Get open tasks
    const tasks = await this.prisma.task.findMany({
      where: {
        status: 'open',
        assigneeId: null,
        ...(dto.filters?.categories && {
          category: { in: dto.filters.categories },
        }),
        ...(dto.filters?.excludeTaskIds && {
          id: { notIn: dto.filters.excludeTaskIds },
        }),
      },
      take: 100, // Limit to 100 tasks for performance
    });

    // 3. Score tasks
    const scoredTasks = tasks.map(task => this.scoreTask(task, skills));

    // 4. Sort and return top N
    const limit = dto.limit || 20;
    const topTasks = scoredTasks
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // 5. Log recommendation
    await this.logRecommendation(
      'task',
      dto.agentId,
      skills,
      topTasks.map(t => ({ id: t.taskId, score: t.score })),
      dto.filters,
    );

    return topTasks;
  }

  private async extractAgentSkills(agentId: string): Promise<any> {
    const capabilities = await this.prisma.agentCapability.findUnique({
      where: { agentId },
    });

    const performance = await this.prisma.agentPerformance.findFirst({
      where: {
        agentId,
        periodStart: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: {
        periodStart: 'desc',
      },
    });

    return {
      capabilities,
      performance,
    };
  }

  private scoreTask(
    task: TaskWithRequirements,
    agentSkills: any,
  ): TaskRecommendationResponseDto {
    const requirements = this.extractTaskRequirements(task);

    // Calculate skill match
    let skillMatch = 0;
    const weights = {
      skillMatch: 0.4,
      rewardPotential: 0.3,
      difficulty: 0.2,
      deadline: 0.1,
    };

    if (agentSkills.capabilities && requirements.skills.length > 0) {
      let matchedScore = 0;
      for (const skill of requirements.skills) {
        const skillScore = agentSkills.capabilities[skill] || 0;
        matchedScore += skillScore;
      }
      skillMatch = matchedScore / (requirements.skills.length * 100);
    }

    // Parse reward
    let rewardAmount = 0;
    if (task.reward) {
      try {
        const reward = JSON.parse(task.reward);
        rewardAmount = reward.amount || 0;
      } catch (e) {
        this.logger.warn('Failed to parse task reward');
      }
    }

    // Calculate reward potential (normalized)
    const maxReward = 10000; // Assume max reward is 10000 credits
    const rewardPotential = Math.min(rewardAmount / maxReward, 1);

    // Calculate difficulty score (prefer medium difficulty)
    const difficultyScores: any = {
      easy: 0.6,
      medium: 1.0,
      hard: 0.7,
    };
    const difficultyScore = difficultyScores[requirements.difficulty] || 0.5;

    // Calculate deadline urgency
    let deadlineScore = 0.5;
    if (task.deadline) {
      const hoursUntilDeadline =
        (new Date(task.deadline).getTime() - Date.now()) / (1000 * 60 * 60);
      if (hoursUntilDeadline < 24) {
        deadlineScore = 0.3; // Too urgent
      } else if (hoursUntilDeadline < 72) {
        deadlineScore = 1.0; // Good urgency
      } else if (hoursUntilDeadline < 168) {
        deadlineScore = 0.8; // Reasonable
      } else {
        deadlineScore = 0.5; // Too far
      }
    }

    // Calculate overall score
    const score =
      skillMatch * weights.skillMatch +
      rewardPotential * weights.rewardPotential +
      difficultyScore * weights.difficulty +
      deadlineScore * weights.deadline;

    // Generate reason
    let reason = 'Matched based on ';
    const reasons: string[] = [];
    if (skillMatch > 0.5) {
      reasons.push('strong skill match');
    }
    if (rewardPotential > 0.7) {
      reasons.push('high reward potential');
    }
    if (difficultyScore > 0.8) {
      reasons.push('appropriate difficulty');
    }
    reason += reasons.join(', ') || 'general fit';

    return {
      taskId: task.id,
      taskTitle: task.title,
      category: task.category || 'general',
      score: Math.round(score * 100) / 100,
      matchPercentage: Math.round(skillMatch * 100),
      rewardAmount,
      difficulty: requirements.difficulty,
      deadline: task.deadline || null,
      reason,
    };
  }

  // ============================================
  // Pricing Suggestion
  // ============================================

  async suggestPrice(
    dto: PricingSuggestionRequestDto,
  ): Promise<PricingSuggestionResponseDto> {
    const task = await this.prisma.task.findUnique({
      where: { id: dto.taskId },
    });

    if (!task) {
      throw new Error('Task not found');
    }

    const category = dto.category || task.category || 'general';
    const difficulty = dto.difficulty || 'medium';

    // 1. Get historical prices for this category
    const historical = await this.getHistoricalPrices(category);

    // 2. Get current market supply/demand
    const marketData = await this.getMarketData(category);

    // 3. Calculate difficulty multiplier
    const difficultyMultipliers: any = {
      easy: 0.7,
      medium: 1.0,
      hard: 1.5,
    };
    const difficultyMultiplier = difficultyMultipliers[difficulty] || 1.0;

    // 4. Calculate base price
    const basePrice = historical.avgPrice * difficultyMultiplier;

    // 5. Apply supply/demand adjustment
    let supplyDemandRatio = 1.0;
    if (marketData.ratio < 0.5) {
      // High demand, low supply - increase price
      supplyDemandRatio = 1.2;
    } else if (marketData.ratio > 2.0) {
      // Low demand, high supply - decrease price
      supplyDemandRatio = 0.85;
    }

    // 6. Calculate urgency bonus (if deadline is close)
    let urgencyBonus = 1.0;
    if (task.deadline) {
      const hoursUntilDeadline =
        (new Date(task.deadline).getTime() - Date.now()) / (1000 * 60 * 60);
      if (hoursUntilDeadline < 48) {
        urgencyBonus = 1.3;
      } else if (hoursUntilDeadline < 72) {
        urgencyBonus = 1.15;
      }
    }

    // 7. Calculate final prices
    const recommendedPrice = Math.round(
      basePrice * supplyDemandRatio * urgencyBonus,
    );
    const minPrice = Math.round(recommendedPrice * 0.8);
    const maxPrice = Math.round(recommendedPrice * 1.5);

    // 8. Determine market trend
    let marketTrend: 'rising' | 'stable' | 'falling' = 'stable';
    if (marketData.ratio < 0.7) {
      marketTrend = 'rising';
    } else if (marketData.ratio > 1.5) {
      marketTrend = 'falling';
    }

    // 9. Calculate confidence
    let confidence = 0.7;
    if (historical.totalTasks > 50) {
      confidence += 0.1;
    }
    if (marketData.totalTasks > 20) {
      confidence += 0.05;
    }
    confidence = Math.min(confidence, 0.95);

    // 10. Log pricing suggestion
    await this.prisma.priceHistory.create({
      data: {
        category,
        taskId: task.id,
        taskType: task.type,
        difficulty,
        suggestedPrice: recommendedPrice,
        finalPrice: 0, // Will be updated when task is completed
        avgMarketPrice: historical.avgPrice,
        supplyLevel:
          marketData.ratio < 0.7
            ? 'low'
            : marketData.ratio > 1.5
              ? 'high'
              : 'medium',
        demandLevel:
          marketData.ratio < 0.7
            ? 'high'
            : marketData.ratio > 1.5
              ? 'low'
              : 'medium',
      },
    });

    return {
      minPrice,
      recommendedPrice,
      maxPrice,
      confidence,
      marketTrend,
      avgMarketPrice: historical.avgPrice,
      supplyLevel:
        marketData.ratio < 0.7
          ? 'low'
          : marketData.ratio > 1.5
            ? 'high'
            : 'medium',
      demandLevel:
        marketData.ratio < 0.7
          ? 'high'
          : marketData.ratio > 1.5
            ? 'low'
            : 'medium',
      factors: {
        historicalAvg: historical.avgPrice,
        difficultyMultiplier,
        supplyDemandRatio,
        urgencyBonus,
      },
    };
  }

  async getHistoricalPrices(category: string): Promise<any> {
    const history = await this.prisma.priceHistory.findMany({
      where: {
        category,
        createdAt: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
        },
      },
    });

    if (history.length === 0) {
      // Default values if no history
      return {
        avgPrice: 500,
        totalTasks: 0,
      };
    }

    const avgPrice =
      history.reduce((sum, h) => sum + h.finalPrice || h.suggestedPrice, 0) /
      history.length;

    return {
      avgPrice: Math.round(avgPrice),
      totalTasks: history.length,
    };
  }

  private async getMarketData(category: string): Promise<any> {
    // Get recent market trend data
    const trend = await this.prisma.marketTrend.findFirst({
      where: {
        category,
        periodStart: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last week
        },
      },
      orderBy: {
        periodStart: 'desc',
      },
    });

    if (!trend) {
      // Calculate current market data if no trend exists
      const openTasks = await this.prisma.task.count({
        where: {
          category,
          status: 'open',
          assigneeId: null,
        },
      });

      const availableAgents = await this.prisma.agent.count({
        where: {
          status: 'idle',
        },
      });

      const ratio = availableAgents > 0 ? openTasks / availableAgents : 1;

      return {
        openTasks,
        availableAgents,
        ratio,
        totalTasks: openTasks,
      };
    }

    return {
      openTasks: trend.openTasks,
      availableAgents: trend.availableAgents,
      ratio: trend.ratio,
      totalTasks: trend.totalTasks,
    };
  }

  // ============================================
  // Helper Methods
  // ============================================

  private async logRecommendation(
    type: 'agent' | 'task',
    inputId: string,
    inputFeatures: any,
    recommendations: any[],
    context?: any,
  ) {
    try {
      await this.prisma.recommendationLog.create({
        data: {
          type,
          inputId,
          inputFeatures: JSON.stringify(inputFeatures),
          recommendations: JSON.stringify(recommendations),
          context: context ? JSON.stringify(context) : null,
        },
      });
    } catch (error) {
      this.logger.error('Failed to log recommendation', error);
    }
  }

  async recordFeedback(dto: RecommendationFeedbackDto) {
    try {
      await this.prisma.recommendationLog.update({
        where: { id: dto.recommendationId },
        data: {
          clicked: !!dto.selectedId,
          accepted: dto.selectedId
            ? dto.wasHelpful !== false
            : dto.wasHelpful || false,
        },
      });
    } catch (error) {
      this.logger.error('Failed to record feedback', error);
    }
  }

  // ============================================
  // Performance Tracking Methods
  // ============================================

  async updateAgentPerformance(agentId: string) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get task statistics
    const completedTasks = await this.prisma.task.count({
      where: {
        assigneeId: agentId,
        status: 'completed',
        updatedAt: { gte: thirtyDaysAgo },
      },
    });

    const failedTasks = await this.prisma.task.count({
      where: {
        assigneeId: agentId,
        status: 'cancelled',
        updatedAt: { gte: thirtyDaysAgo },
      },
    });

    const bids = await this.prisma.bid.findMany({
      where: {
        agentId,
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    const acceptedBids = bids.filter(b => b.status === 'accepted').length;

    // Get earnings
    const transactions = await this.prisma.creditTransaction.findMany({
      where: {
        agentId,
        type: 'earn',
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    const totalEarned = transactions.reduce((sum, t) => sum + t.amount, 0);

    // Calculate metrics
    const avgTaskValue =
      completedTasks > 0 ? totalEarned / completedTasks : 0;

    // Update or create performance record
    await this.prisma.agentPerformance.upsert({
      where: {
        id: `${agentId}-current`,
      },
      create: {
        agentId,
        tasksCompleted: completedTasks,
        tasksFailed: failedTasks,
        totalBids: bids.length,
        acceptedBids,
        avgRating: 0,
        onTimeDelivery: 0,
        avgResponseTime: 0,
        avgCompletionTime: 0,
        totalEarned,
        avgTaskValue,
        periodStart: thirtyDaysAgo,
        periodEnd: new Date(),
      },
      update: {
        tasksCompleted: completedTasks,
        tasksFailed: failedTasks,
        totalBids: bids.length,
        acceptedBids,
        totalEarned,
        avgTaskValue,
        periodEnd: new Date(),
      },
    });
  }

  async updateMarketTrends() {
    const categories = await this.prisma.task.groupBy({
      by: ['category'],
      where: {
        category: { not: null },
      },
    });

    for (const { category } of categories) {
      if (!category) continue;

      const openTasks = await this.prisma.task.count({
        where: {
          category,
          status: 'open',
          assigneeId: null,
        },
      });

      const availableAgents = await this.prisma.agent.count({
        where: {
          status: 'idle',
        },
      });

      const completedTasks = await this.prisma.task.findMany({
        where: {
          category,
          status: 'completed',
          updatedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      });

      const avgPrice =
        completedTasks.length > 0
          ? completedTasks.reduce((sum, task) => {
              try {
                const reward = task.reward
                  ? JSON.parse(task.reward)
                  : { amount: 0 };
                return sum + (reward.amount || 0);
              } catch {
                return sum;
              }
            }, 0) / completedTasks.length
          : 0;

      const ratio = availableAgents > 0 ? openTasks / availableAgents : 1;

      await this.prisma.marketTrend.upsert({
        where: {
          id: `${category}-current`,
        },
        create: {
          category,
          totalTasks: completedTasks.length,
          avgPrice: Math.round(avgPrice),
          avgCompletionTime: 0,
          availableAgents,
          openTasks,
          ratio,
          periodStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          periodEnd: new Date(),
        },
        update: {
          totalTasks: completedTasks.length,
          avgPrice: Math.round(avgPrice),
          availableAgents,
          openTasks,
          ratio,
          periodEnd: new Date(),
        },
      });
    }
  }
}
