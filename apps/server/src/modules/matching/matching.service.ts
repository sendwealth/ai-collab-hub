import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { RatingsService } from '../ratings/ratings.service';
import { SkillsService } from '../skills/skills.service';
import {
  AgentMatchDto,
  TaskMatchDto,
  MatchCalculationResponseDto,
  MatchBreakdownDto,
  RecommendAgentsDto,
  RecommendTasksDto,
} from './dto/matching.dto';

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  // Matching weights
  private readonly WEIGHTS = {
    skill: 0.4,
    performance: 0.3,
    price: 0.15,
    availability: 0.1,
    location: 0.05,
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly ratingsService: RatingsService,
    private readonly skillsService: SkillsService,
  ) {}

  // ============================================
  // Agent Recommendation
  // ============================================

  async recommendAgentsForTask(
    taskId: string,
    options: RecommendAgentsDto = {},
  ): Promise<AgentMatchDto[]> {
    const { limit = 10, minScore = 0, filters } = options;

    // Get task
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Get task skills
    const taskSkills = await this.skillsService.getTaskSkills(taskId);

    // Build agent query
    const where: any = {
      status: { not: 'offline' },
    };

    if (filters?.maxHourlyRate) {
      where.hourlyRate = { lte: filters.maxHourlyRate };
    }

    if (filters?.availableOnly) {
      where.status = 'idle';
    }

    // Get candidate agents
    const agents = await this.prisma.agent.findMany({
      where,
    });

    // Score each agent
    const matches: AgentMatchDto[] = [];

    for (const agent of agents) {
      const score = await this.calculateMatchScore(agent, task, taskSkills);
      
      if (score >= minScore) {
        const breakdown = await this.getMatchBreakdown(agent, task, taskSkills);
        const reasons = this.generateMatchReasons(agent, task, breakdown);

        matches.push({
          agent,
          score,
          reasons,
          breakdown,
        });
      }
    }

    // Sort by score and limit
    const sortedMatches = matches
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // Log recommendation
    await this.logRecommendation('task', taskId, sortedMatches.map(m => ({
      id: m.agent.id,
      score: m.score,
    })));

    return sortedMatches;
  }

  // ============================================
  // Task Recommendation
  // ============================================

  async recommendTasksForAgent(
    agentId: string,
    options: RecommendTasksDto = {},
  ): Promise<TaskMatchDto[]> {
    const { limit = 10, minScore = 0, filters } = options;

    // Get agent
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    // Get agent skills
    const agentSkills = await this.skillsService.getAgentSkills(agentId);

    // Build task query
    const where: any = {
      status: 'open',
    };

    if (filters?.minBudget) {
      where.budget = { ...where.budget, gte: filters.minBudget };
    }

    if (filters?.maxBudget) {
      where.budget = { ...where.budget, lte: filters.maxBudget };
    }

    if (filters?.category) {
      where.category = filters.category;
    }

    // Get open tasks
    const tasks = await this.prisma.task.findMany({
      where,
    });

    // Score each task
    const matches: TaskMatchDto[] = [];

    for (const task of tasks) {
      const taskSkills = await this.skillsService.getTaskSkills(task.id);
      const score = await this.calculateMatchScore(agent, task, taskSkills);

      if (score >= minScore) {
        const breakdown = await this.getMatchBreakdown(agent, task, taskSkills);
        const reasons = this.generateMatchReasons(agent, task, breakdown);

        matches.push({
          task,
          score,
          reasons,
          breakdown,
        });
      }
    }

    // Sort by score and limit
    const sortedMatches = matches
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // Log recommendation
    await this.logRecommendation('agent', agentId, sortedMatches.map(m => ({
      id: m.task.id,
      score: m.score,
    })));

    return sortedMatches;
  }

  // ============================================
  // Match Score Calculation
  // ============================================

  async calculateMatchScore(
    agent: any,
    task: any,
    taskSkills?: any[],
  ): Promise<number> {
    const breakdown = await this.getMatchBreakdown(agent, task, taskSkills);

    return (
      breakdown.skillScore * this.WEIGHTS.skill +
      breakdown.performanceScore * this.WEIGHTS.performance +
      breakdown.priceScore * this.WEIGHTS.price +
      breakdown.availabilityScore * this.WEIGHTS.availability +
      breakdown.locationScore * this.WEIGHTS.location
    );
  }

  async getMatchBreakdown(
    agent: any,
    task: any,
    taskSkills?: any[],
  ): Promise<MatchBreakdownDto> {
    // Get agent skills if not provided
    const agentSkills = await this.skillsService.getAgentSkills(agent.id);

    // Get task skills if not provided
    if (!taskSkills) {
      taskSkills = await this.skillsService.getTaskSkills(task.id);
    }

    // Calculate individual scores
    const skillScore = this.calculateSkillMatch(agentSkills, taskSkills);
    const performanceScore = await this.calculatePerformanceScore(agent.id);
    const priceScore = this.calculatePriceMatch(agent.hourlyRate, task.budget);
    const availabilityScore = this.calculateAvailabilityScore(
      agent.status,
      task.deadline,
    );
    const locationScore = this.calculateLocationMatch(
      agent.timezone,
      task.preferredTimezone,
    );

    return {
      skillScore,
      performanceScore,
      priceScore,
      availabilityScore,
      locationScore,
      weights: {
        skill: this.WEIGHTS.skill,
        performance: this.WEIGHTS.performance,
        price: this.WEIGHTS.price,
        availability: this.WEIGHTS.availability,
        location: this.WEIGHTS.location,
      },
    };
  }

  // ============================================
  // Individual Score Calculations
  // ============================================

  calculateSkillMatch(agentSkills: any[], taskSkills: any[]): number {
    if (taskSkills.length === 0) {
      return 0.5; // Neutral score if no skills required
    }

    let totalScore = 0;
    let requiredCount = 0;

    for (const taskSkill of taskSkills) {
      const agentSkill = agentSkills.find(
        (as) => as.skillId === taskSkill.skillId,
      );

      if (agentSkill) {
        // Check if agent meets minimum level
        if (agentSkill.level >= taskSkill.minLevel) {
          // Score based on how much the agent exceeds the requirement
          const exceedRatio =
            (agentSkill.level - taskSkill.minLevel + 1) / 5;
          totalScore += Math.min(exceedRatio, 1);
        } else {
          // Partial score if below minimum
          totalScore += (agentSkill.level / taskSkill.minLevel) * 0.5;
        }
      } else {
        // No matching skill
        totalScore += taskSkill.required ? 0 : 0.3;
      }

      requiredCount++;
    }

    return requiredCount > 0 ? totalScore / requiredCount : 0.5;
  }

  async calculatePerformanceScore(agentId: string): Promise<number> {
    try {
      const summary = await this.ratingsService.getAgentRatingSummary(agentId);

      if (summary.totalRatings === 0) {
        return 0.5; // Neutral score for new agents
      }

      // Normalize overall rating (1-5) to 0-1
      return (summary.overallRating - 1) / 4;
    } catch {
      return 0.5;
    }
  }

  calculatePriceMatch(hourlyRate: number | null, budget: number | null): number {
    if (!hourlyRate || !budget) {
      return 0.5; // Neutral score if data missing
    }

    // Assume 10 hours of work for simplicity
    const estimatedCost = hourlyRate * 10;

    if (estimatedCost <= budget) {
      return 1;
    }

    // Penalize if over budget
    const overBudgetRatio = (estimatedCost - budget) / budget;
    return Math.max(0, 1 - overBudgetRatio);
  }

  calculateAvailabilityScore(status: string, deadline: Date | null): number {
    if (!deadline) {
      return status === 'idle' ? 1 : status === 'busy' ? 0.5 : 0;
    }

    const now = new Date();
    const timeUntilDeadline = deadline.getTime() - now.getTime();
    const daysUntilDeadline = timeUntilDeadline / (1000 * 60 * 60 * 24);

    if (status === 'offline') {
      return 0;
    }

    if (status === 'busy') {
      return daysUntilDeadline > 7 ? 0.7 : 0.3;
    }

    // Idle status
    return 1;
  }

  calculateLocationMatch(
    agentTimezone: string | null,
    preferredTimezone: string | null,
  ): number {
    if (!agentTimezone || !preferredTimezone) {
      return 0.5; // Neutral score if data missing
    }

    if (agentTimezone === preferredTimezone) {
      return 1;
    }

    // Calculate timezone difference in hours
    try {
      const agentOffset = this.getTimezoneOffset(agentTimezone);
      const preferredOffset = this.getTimezoneOffset(preferredTimezone);
      const diffHours = Math.abs(agentOffset - preferredOffset);

      // Score decreases with timezone difference
      // 0 hours = 1, 12+ hours = 0.5
      return Math.max(0.5, 1 - diffHours / 24);
    } catch {
      return 0.5;
    }
  }

  private getTimezoneOffset(timezone: string): number {
    const offsets: Record<string, number> = {
      'Asia/Shanghai': 8,
      'Asia/Tokyo': 9,
      'America/New_York': -5,
      'America/Los_Angeles': -8,
      'Europe/London': 0,
      'Europe/Paris': 1,
      'UTC': 0,
    };
    return offsets[timezone] || 0;
  }

  // ============================================
  // Match Reasons Generation
  // ============================================

  generateMatchReasons(
    agent: any,
    task: any,
    breakdown: MatchBreakdownDto,
  ): string[] {
    const reasons: string[] = [];

    // Skill reasons
    if (breakdown.skillScore >= 0.8) {
      reasons.push('✅ 技能高度匹配');
    } else if (breakdown.skillScore >= 0.5) {
      reasons.push('⚠️ 技能部分匹配');
    } else {
      reasons.push('❌ 技能匹配度较低');
    }

    // Performance reasons
    if (breakdown.performanceScore >= 0.8) {
      reasons.push('✅ 历史表现优秀');
    } else if (breakdown.performanceScore >= 0.5) {
      reasons.push('⚠️ 历史表现一般');
    } else if (breakdown.performanceScore < 0.5 && breakdown.performanceScore > 0) {
      reasons.push('❌ 历史表现较差');
    }

    // Price reasons
    if (breakdown.priceScore >= 0.9) {
      reasons.push('✅ 价格在预算内');
    } else if (breakdown.priceScore >= 0.5) {
      reasons.push('⚠️ 价格略超预算');
    } else {
      reasons.push('❌ 价格超出预算');
    }

    // Availability reasons
    if (agent.status === 'idle') {
      reasons.push('✅ Agent当前可用');
    } else if (agent.status === 'busy') {
      reasons.push('⚠️ Agent当前忙碌');
    } else {
      reasons.push('❌ Agent离线');
    }

    // Location reasons
    if (breakdown.locationScore >= 0.9) {
      reasons.push('✅ 时区匹配');
    } else if (breakdown.locationScore >= 0.5) {
      reasons.push('⚠️ 时区有差异');
    }

    return reasons;
  }

  // ============================================
  // Calculate Match API
  // ============================================

  async calculateMatch(
    agentId: string,
    taskId: string,
  ): Promise<MatchCalculationResponseDto> {
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const breakdown = await this.getMatchBreakdown(agent, task);
    const overallScore =
      breakdown.skillScore * this.WEIGHTS.skill +
      breakdown.performanceScore * this.WEIGHTS.performance +
      breakdown.priceScore * this.WEIGHTS.price +
      breakdown.availabilityScore * this.WEIGHTS.availability +
      breakdown.locationScore * this.WEIGHTS.location;

    const reasons = this.generateMatchReasons(agent, task, breakdown);

    let recommendation: MatchCalculationResponseDto['recommendation'];
    if (overallScore >= 0.8) {
      recommendation = 'highly_recommended';
    } else if (overallScore >= 0.6) {
      recommendation = 'recommended';
    } else if (overallScore >= 0.4) {
      recommendation = 'neutral';
    } else {
      recommendation = 'not_recommended';
    }

    return {
      agentId,
      taskId,
      overallScore,
      breakdown,
      reasons,
      recommendation,
    };
  }

  // ============================================
  // Logging
  // ============================================

  private async logRecommendation(
    type: 'agent' | 'task',
    inputId: string,
    recommendations: { id: string; score: number }[],
  ) {
    try {
      await this.prisma.recommendationLog.create({
        data: {
          type,
          inputId,
          inputFeatures: '{}',
          recommendations: JSON.stringify(recommendations),
        },
      });
    } catch (error) {
      this.logger.warn('Failed to log recommendation', error);
    }
  }

  // ============================================
  // Statistics
  // ============================================

  async getMatchingStatistics() {
    const logs = await this.prisma.recommendationLog.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    });

    const totalRecommendations = logs.length;
    
    const acceptedCount = logs.filter(l => l.accepted).length;
    const successRate = totalRecommendations > 0 
      ? acceptedCount / totalRecommendations 
      : 0;

    // Calculate average match score
    let totalScore = 0;
    let scoreCount = 0;
    for (const log of logs) {
      try {
        const recs = JSON.parse(log.recommendations);
        for (const rec of recs) {
          totalScore += rec.score;
          scoreCount++;
        }
      } catch {}
    }
    const avgMatchScore = scoreCount > 0 ? totalScore / scoreCount : 0;

    return {
      totalRecommendations,
      avgMatchScore,
      successRate,
      topMatchedSkills: [],
      matchScoreDistribution: [],
    };
  }
}
