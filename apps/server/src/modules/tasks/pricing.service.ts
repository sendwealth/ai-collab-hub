import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { GetPricingDto, GetMarketPriceDto } from './dto';

export interface PriceRange {
  min: number;
  max: number;
  recommended: number;
  currency: string;
  breakdown: {
    basePrice: number;
    complexityMultiplier: number;
    marketAdjustment: number;
    skillPremium: number;
    urgencyMultiplier: number;
  };
  factors: {
    category: string;
    estimatedHours: number;
    complexity: 'low' | 'medium' | 'high';
    marketDemand: 'low' | 'medium' | 'high';
  };
}

export interface MarketPrice {
  category: string;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  demandLevel: 'low' | 'medium' | 'high';
  sampleSize: number;
  trend: 'increasing' | 'stable' | 'decreasing';
}

@Injectable()
export class PricingService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取价格建议
   */
  async suggestPrice(getPricingDto: GetPricingDto): Promise<PriceRange> {
    // 基础价格 (按类别)
    const basePrice = this.getBasePriceByCategory(getPricingDto.category);

    // 复杂度系数
    const complexityMultiplier = this.calculateComplexity(
      getPricingDto.description,
      getPricingDto.requirements,
    );

    // 市场调整
    const marketAdjustment = await this.getMarketAdjustment(getPricingDto.category);

    // 技能溢价
    const skillPremium = this.calculateSkillPremium(getPricingDto.requirements?.skills || []);

    // 紧急程度系数
    const urgencyMultiplier = this.calculateUrgencyMultiplier(getPricingDto.deadline);

    // 计算最终价格
    const adjustedBase =
      basePrice * complexityMultiplier * marketAdjustment * skillPremium * urgencyMultiplier;

    const minPrice = adjustedBase * 0.8;
    const maxPrice = adjustedBase * 1.2;
    const recommended = (minPrice + maxPrice) / 2;

    // 估算工时
    const estimatedHours = this.estimateHours(
      getPricingDto.category,
      getPricingDto.description,
      complexityMultiplier,
    );

    return {
      min: Math.round(minPrice),
      max: Math.round(maxPrice),
      recommended: Math.round(recommended),
      currency: 'CNY',
      breakdown: {
        basePrice,
        complexityMultiplier,
        marketAdjustment,
        skillPremium,
        urgencyMultiplier,
      },
      factors: {
        category: getPricingDto.category,
        estimatedHours,
        complexity:
          complexityMultiplier < 1.2 ? 'low' : complexityMultiplier < 1.8 ? 'medium' : 'high',
        marketDemand: marketAdjustment < 0.9 ? 'low' : marketAdjustment < 1.1 ? 'medium' : 'high',
      },
    };
  }

  /**
   * 获取市场价格参考
   */
  async getMarketPrice(getMarketPriceDto: GetMarketPriceDto): Promise<MarketPrice[]> {
    const categories = getMarketPriceDto.categories || [
      'development',
      'design',
      'testing',
      'documentation',
    ];

    const marketPrices: MarketPrice[] = [];

    for (const category of categories) {
      const marketData = await this.calculateMarketPrice(category);
      marketPrices.push(marketData);
    }

    return marketPrices;
  }

  /**
   * 根据类别获取基础价格 (单位: CNY)
   */
  private getBasePriceByCategory(category: string): number {
    const basePrices: Record<string, number> = {
      development: 500, // 开发类任务基础价格
      design: 400, // 设计类任务基础价格
      testing: 300, // 测试类任务基础价格
      documentation: 250, // 文档类任务基础价格
      analysis: 350, // 分析类任务基础价格
      consulting: 600, // 咨询类任务基础价格
      default: 400, // 默认基础价格
    };

    return basePrices[category] || basePrices['default'];
  }

  /**
   * 计算复杂度系数
   */
  private calculateComplexity(
    description: string,
    requirements?: any,
  ): number {
    let complexity = 1.0;

    // 基于描述长度和关键词
    if (description) {
      const descLength = description.length;
      const complexKeywords = [
        '算法',
        '优化',
        '架构',
        '集成',
        '分布式',
        '微服务',
        '机器学习',
        'AI',
        '区块链',
        '高并发',
        'algorithm',
        'optimization',
        'architecture',
        'integration',
        'distributed',
        'microservice',
        'machine learning',
        'blockchain',
        'concurrent',
      ];

      // 描述长度影响
      if (descLength > 500) complexity += 0.3;
      else if (descLength > 200) complexity += 0.15;

      // 复杂度关键词
      const keywordCount = complexKeywords.filter((keyword) =>
        description.toLowerCase().includes(keyword.toLowerCase()),
      ).length;
      complexity += keywordCount * 0.15;
    }

    // 基于需求技能
    if (requirements?.skills) {
      const advancedSkills = [
        'tensorflow',
        'pytorch',
        'kubernetes',
        'docker',
        'aws',
        'gcp',
        'azure',
        'react',
        'vue',
        'angular',
        'node.js',
        'python',
        'go',
        'rust',
        'blockchain',
      ];
      const advancedCount = requirements.skills.filter((skill: string) =>
        advancedSkills.some((adv) => skill.toLowerCase().includes(adv)),
      ).length;
      complexity += advancedCount * 0.1;
    }

    // 基于最低信任分要求
    if (requirements?.minTrustScore) {
      if (requirements.minTrustScore >= 80) complexity += 0.3;
      else if (requirements.minTrustScore >= 60) complexity += 0.15;
    }

    // 限制范围在 0.8 - 3.0
    return Math.max(0.8, Math.min(3.0, complexity));
  }

  /**
   * 获取市场调整系数 (基于历史数据)
   */
  private async getMarketAdjustment(category: string): Promise<number> {
    try {
      // 获取最近30天该类别的任务数据
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const tasks = await this.prisma.task.findMany({
        where: {
          category,
          createdAt: { gte: thirtyDaysAgo },
          status: { in: ['completed', 'assigned', 'reviewing'] },
        },
        include: {
          bids: true,
        },
      });

      if (tasks.length === 0) {
        // 没有历史数据,使用默认值
        return this.getDefaultMarketAdjustment(category);
      }

      // 计算供需比
      const totalBids = tasks.reduce((sum, task) => sum + task.bids.length, 0);
      const avgBidsPerTask = totalBids / tasks.length;

      // 竞标越多,说明需求旺盛,价格应该上调
      if (avgBidsPerTask >= 5) return 1.3; // 高需求
      if (avgBidsPerTask >= 3) return 1.15; // 中高需求
      if (avgBidsPerTask >= 1.5) return 1.0; // 正常需求
      if (avgBidsPerTask >= 0.5) return 0.9; // 低需求
      return 0.8; // 非常低需求
    } catch (error) {
      // 数据库查询失败,使用默认值
      return this.getDefaultMarketAdjustment(category);
    }
  }

  /**
   * 获取默认市场调整系数
   */
  private getDefaultMarketAdjustment(category: string): number {
    const adjustments: Record<string, number> = {
      development: 1.2, // 开发需求旺盛
      design: 1.1, // 设计需求较高
      testing: 0.95, // 测试需求一般
      documentation: 0.9, // 文档需求较低
      analysis: 1.05, // 分析需求中等
      consulting: 1.25, // 咨询需求旺盛
    };

    return adjustments[category] || 1.0;
  }

  /**
   * 计算技能溢价
   */
  private calculateSkillPremium(skills: string[]): number {
    if (!skills || skills.length === 0) return 1.0;

    // 高价值技能
    const premiumSkills = [
      'machine learning',
      'ai',
      'blockchain',
      'kubernetes',
      '微服务',
      '机器学习',
      '人工智能',
      '区块链',
    ];

    const premiumCount = skills.filter((skill) =>
      premiumSkills.some((premium) => skill.toLowerCase().includes(premium.toLowerCase())),
    ).length;

    // 每个高价值技能增加10%溢价,最多50%
    return Math.min(1.5, 1.0 + premiumCount * 0.1);
  }

  /**
   * 计算紧急程度系数
   */
  private calculateUrgencyMultiplier(deadline?: string): number {
    if (!deadline) return 1.0;

    const deadlineDate = new Date(deadline);
    const now = new Date();
    const daysUntilDeadline = Math.ceil(
      (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    // 越紧急,价格越高
    if (daysUntilDeadline <= 1) return 1.5; // 1天内
    if (daysUntilDeadline <= 3) return 1.3; // 3天内
    if (daysUntilDeadline <= 7) return 1.15; // 1周内
    if (daysUntilDeadline <= 14) return 1.05; // 2周内
    return 1.0; // 更长时间
  }

  /**
   * 估算工时
   */
  private estimateHours(category: string, _description: string, complexity: number): number {
    const baseHours: Record<string, number> = {
      development: 8,
      design: 6,
      testing: 4,
      documentation: 3,
      analysis: 5,
      consulting: 2,
    };

    const base = baseHours[category] || 5;

    // 根据复杂度调整
    return Math.round(base * complexity);
  }

  /**
   * 计算市场价格
   */
  private async calculateMarketPrice(category: string): Promise<MarketPrice> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // 获取已完成任务的价格数据
      const completedTasks = await this.prisma.task.findMany({
        where: {
          category,
          status: 'completed',
          createdAt: { gte: thirtyDaysAgo },
        },
        select: {
          reward: true,
          createdAt: true,
        },
      });

      if (completedTasks.length === 0) {
        return this.getDefaultMarketPrice(category);
      }

      // 提取价格数据
      const prices = completedTasks
        .map((task) => {
          const reward = task.reward ? JSON.parse(task.reward) : null;
          return reward?.credits || reward?.amount || 0;
        })
        .filter((price) => price > 0);

      if (prices.length === 0) {
        return this.getDefaultMarketPrice(category);
      }

      // 计算统计数据
      const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);

      // 计算趋势 (比较前15天和后15天)
      const midPoint = new Date();
      midPoint.setDate(midPoint.getDate() - 15);

      const earlyPrices = completedTasks
        .filter((t) => t.createdAt < midPoint)
        .map((t) => {
          const reward = t.reward ? JSON.parse(t.reward) : null;
          return reward?.credits || reward?.amount || 0;
        })
        .filter((p) => p > 0);

      const latePrices = completedTasks
        .filter((t) => t.createdAt >= midPoint)
        .map((t) => {
          const reward = t.reward ? JSON.parse(t.reward) : null;
          return reward?.credits || reward?.amount || 0;
        })
        .filter((p) => p > 0);

      let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
      if (earlyPrices.length > 0 && latePrices.length > 0) {
        const earlyAvg = earlyPrices.reduce((sum, p) => sum + p, 0) / earlyPrices.length;
        const lateAvg = latePrices.reduce((sum, p) => sum + p, 0) / latePrices.length;
        const change = (lateAvg - earlyAvg) / earlyAvg;

        if (change > 0.1) trend = 'increasing';
        else if (change < -0.1) trend = 'decreasing';
      }

      // 计算需求水平
      const allTasks = await this.prisma.task.count({
        where: {
          category,
          createdAt: { gte: thirtyDaysAgo },
        },
      });

      let demandLevel: 'low' | 'medium' | 'high' = 'medium';
      if (allTasks >= 20) demandLevel = 'high';
      else if (allTasks < 10) demandLevel = 'low';

      return {
        category,
        avgPrice: Math.round(avgPrice),
        minPrice: Math.round(minPrice),
        maxPrice: Math.round(maxPrice),
        demandLevel,
        sampleSize: prices.length,
        trend,
      };
    } catch (error) {
      return this.getDefaultMarketPrice(category);
    }
  }

  /**
   * 获取默认市场价格
   */
  private getDefaultMarketPrice(category: string): MarketPrice {
    const defaults: Record<string, Omit<MarketPrice, 'category'>> = {
      development: {
        avgPrice: 800,
        minPrice: 400,
        maxPrice: 1500,
        demandLevel: 'high',
        sampleSize: 0,
        trend: 'stable',
      },
      design: {
        avgPrice: 600,
        minPrice: 300,
        maxPrice: 1200,
        demandLevel: 'medium',
        sampleSize: 0,
        trend: 'stable',
      },
      testing: {
        avgPrice: 400,
        minPrice: 200,
        maxPrice: 800,
        demandLevel: 'medium',
        sampleSize: 0,
        trend: 'stable',
      },
      documentation: {
        avgPrice: 350,
        minPrice: 200,
        maxPrice: 600,
        demandLevel: 'low',
        sampleSize: 0,
        trend: 'stable',
      },
    };

    return {
      category,
      ...(defaults[category] || defaults['development']),
    };
  }
}
