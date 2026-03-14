import { Test, TestingModule } from '@nestjs/testing';
import { PricingService } from './pricing.service';
import { PrismaService } from '../common/prisma/prisma.service';

describe('PricingService', () => {
  let service: PricingService;
  let prisma: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PricingService,
        {
          provide: PrismaService,
          useValue: {
            task: {
              findMany: jest.fn(),
              count: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<PricingService>(PricingService);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('suggestPrice', () => {
    it('should return a price range for a simple task', async () => {
      const result = await service.suggestPrice({
        category: 'development',
        description: '简单的登录页面开发',
      });

      expect(result).toHaveProperty('min');
      expect(result).toHaveProperty('max');
      expect(result).toHaveProperty('recommended');
      expect(result).toHaveProperty('currency', 'CNY');
      expect(result.min).toBeLessThan(result.recommended);
      expect(result.recommended).toBeLessThan(result.max);
      expect(result.breakdown).toHaveProperty('basePrice');
      expect(result.breakdown).toHaveProperty('complexityMultiplier');
      expect(result.factors).toHaveProperty('category', 'development');
    });

    it('should increase price for complex tasks', async () => {
      const simpleTask = await service.suggestPrice({
        category: 'development',
        description: '简单功能',
      });

      const complexTask = await service.suggestPrice({
        category: 'development',
        description:
          '开发一个基于机器学习的推荐系统，需要集成多个微服务，使用Kubernetes部署，支持高并发',
      });

      expect(complexTask.recommended).toBeGreaterThan(simpleTask.recommended);
    });

    it('should adjust price based on category', async () => {
      const devPrice = await service.suggestPrice({
        category: 'development',
        description: '测试任务',
      });

      const docPrice = await service.suggestPrice({
        category: 'documentation',
        description: '测试任务',
      });

      expect(devPrice.recommended).toBeGreaterThan(docPrice.recommended);
    });

    it('should add skill premium for advanced skills', async () => {
      const noSkills = await service.suggestPrice({
        category: 'development',
        description: '开发任务',
        requirements: { skills: [] },
      });

      const withMLSkills = await service.suggestPrice({
        category: 'development',
        description: '开发任务',
        requirements: { skills: ['machine learning', 'tensorflow'] },
      });

      expect(withMLSkills.recommended).toBeGreaterThan(noSkills.recommended);
    });

    it('should add urgency multiplier for tight deadlines', async () => {
      const noDeadline = await service.suggestPrice({
        category: 'development',
        description: '开发任务',
      });

      const urgentDeadline = new Date();
      urgentDeadline.setDate(urgentDeadline.getDate() + 1);

      const withUrgentDeadline = await service.suggestPrice({
        category: 'development',
        description: '开发任务',
        deadline: urgentDeadline.toISOString(),
      });

      expect(withUrgentDeadline.recommended).toBeGreaterThan(noDeadline.recommended);
    });

    it('should calculate estimated hours based on complexity', async () => {
      const result = await service.suggestPrice({
        category: 'development',
        description: '开发任务',
      });

      expect(result.factors.estimatedHours).toBeGreaterThan(0);
      expect(result.factors.estimatedHours).toBeLessThan(100);
    });
  });

  describe('getMarketPrice', () => {
    it('should return market prices for all categories', async () => {
      (prisma.task.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.task.count as jest.Mock).mockResolvedValue(0);

      const result = await service.getMarketPrice({});

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      result.forEach((market) => {
        expect(market).toHaveProperty('category');
        expect(market).toHaveProperty('avgPrice');
        expect(market).toHaveProperty('minPrice');
        expect(market).toHaveProperty('maxPrice');
        expect(market).toHaveProperty('demandLevel');
        expect(market).toHaveProperty('trend');
      });
    });

    it('should return market prices for specific categories', async () => {
      (prisma.task.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.task.count as jest.Mock).mockResolvedValue(0);

      const result = await service.getMarketPrice({
        categories: ['development', 'design'],
      });

      expect(result).toHaveLength(2);
      expect(result.map((m) => m.category)).toEqual(
        expect.arrayContaining(['development', 'design']),
      );
    });

    it('should calculate market prices from historical data', async () => {
      const mockTasks = [
        {
          reward: JSON.stringify({ credits: 800 }),
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        },
        {
          reward: JSON.stringify({ credits: 1000 }),
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        },
        {
          reward: JSON.stringify({ credits: 600 }),
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
      ];

      (prisma.task.findMany as jest.Mock).mockResolvedValue(mockTasks);
      (prisma.task.count as jest.Mock).mockResolvedValue(mockTasks.length);

      const result = await service.getMarketPrice({
        categories: ['development'],
      });

      expect(result[0].avgPrice).toBe(800); // (800 + 1000 + 600) / 3
      expect(result[0].minPrice).toBe(600);
      expect(result[0].maxPrice).toBe(1000);
      expect(result[0].sampleSize).toBe(3);
    });
  });

  describe('price range calculation', () => {
    it('should ensure min < recommended < max', async () => {
      const result = await service.suggestPrice({
        category: 'development',
        description: '测试任务',
      });

      expect(result.min).toBeLessThan(result.recommended);
      expect(result.recommended).toBeLessThan(result.max);
      expect(result.recommended).toBe((result.min + result.max) / 2);
    });

    it('should round prices to integers', async () => {
      const result = await service.suggestPrice({
        category: 'development',
        description: '测试任务',
      });

      expect(Number.isInteger(result.min)).toBe(true);
      expect(Number.isInteger(result.max)).toBe(true);
      expect(Number.isInteger(result.recommended)).toBe(true);
    });
  });

  describe('complexity calculation', () => {
    it('should increase complexity for long descriptions (>500 chars)', async () => {
      const shortDesc = await service.suggestPrice({
        category: 'development',
        description: '简单任务',
      });

      const longDesc = await service.suggestPrice({
        category: 'development',
        description: 'a'.repeat(600),
      });

      expect(longDesc.breakdown.complexityMultiplier).toBeGreaterThan(
        shortDesc.breakdown.complexityMultiplier,
      );
    });

    it('should increase complexity for medium descriptions (>200 chars)', async () => {
      const shortDesc = await service.suggestPrice({
        category: 'development',
        description: '简单任务',
      });

      const mediumDesc = await service.suggestPrice({
        category: 'development',
        description: 'a'.repeat(300),
      });

      expect(mediumDesc.breakdown.complexityMultiplier).toBeGreaterThan(
        shortDesc.breakdown.complexityMultiplier,
      );
    });

    it('should increase complexity for complex keywords', async () => {
      const simpleTask = await service.suggestPrice({
        category: 'development',
        description: '开发一个简单的功能',
      });

      const complexTask = await service.suggestPrice({
        category: 'development',
        description: '开发一个基于机器学习和微服务架构的分布式系统',
      });

      expect(complexTask.breakdown.complexityMultiplier).toBeGreaterThan(
        simpleTask.breakdown.complexityMultiplier,
      );
    });

    it('should increase complexity for advanced skills in requirements', async () => {
      const noSkills = await service.suggestPrice({
        category: 'development',
        description: '开发任务',
        requirements: { skills: [] },
      });

      const withAdvancedSkills = await service.suggestPrice({
        category: 'development',
        description: '开发任务',
        requirements: {
          skills: ['kubernetes', 'docker', 'tensorflow', 'react'],
        },
      });

      expect(withAdvancedSkills.breakdown.complexityMultiplier).toBeGreaterThan(
        noSkills.breakdown.complexityMultiplier,
      );
    });

    it('should increase complexity for high minTrustScore requirements', async () => {
      const lowTrust = await service.suggestPrice({
        category: 'development',
        description: '开发任务',
        requirements: { minTrustScore: 40 },
      });

      const highTrust = await service.suggestPrice({
        category: 'development',
        description: '开发任务',
        requirements: { minTrustScore: 85 },
      });

      expect(highTrust.breakdown.complexityMultiplier).toBeGreaterThan(
        lowTrust.breakdown.complexityMultiplier,
      );
    });

    it('should increase complexity for medium minTrustScore requirements', async () => {
      const lowTrust = await service.suggestPrice({
        category: 'development',
        description: '开发任务',
        requirements: { minTrustScore: 40 },
      });

      const mediumTrust = await service.suggestPrice({
        category: 'development',
        description: '开发任务',
        requirements: { minTrustScore: 65 },
      });

      expect(mediumTrust.breakdown.complexityMultiplier).toBeGreaterThan(
        lowTrust.breakdown.complexityMultiplier,
      );
    });

    it('should cap complexity multiplier at 3.0', async () => {
      const result = await service.suggestPrice({
        category: 'development',
        description:
          '开发一个基于机器学习、微服务、区块链、AI、分布式架构、高并发、优化算法的复杂系统',
        requirements: {
          skills: [
            'tensorflow',
            'kubernetes',
            'docker',
            'blockchain',
            'pytorch',
          ],
          minTrustScore: 90,
        },
      });

      expect(result.breakdown.complexityMultiplier).toBeLessThanOrEqual(3.0);
    });

    it('should cap complexity multiplier at minimum 0.8', async () => {
      const result = await service.suggestPrice({
        category: 'development',
        description: '简单',
        requirements: { skills: [] },
      });

      expect(result.breakdown.complexityMultiplier).toBeGreaterThanOrEqual(0.8);
    });

    it('should classify complexity as low for multiplier < 1.2', async () => {
      const result = await service.suggestPrice({
        category: 'documentation',
        description: '简单文档',
        requirements: { skills: [] },
      });

      expect(result.factors.complexity).toBe('low');
    });

    it('should classify complexity as medium for multiplier 1.2-1.8', async () => {
      const result = await service.suggestPrice({
        category: 'development',
        description: '开发任务需要一些算法优化',
        requirements: { skills: ['python'] },
      });

      expect(result.factors.complexity).toBe('medium');
    });

    it('should classify complexity as high for multiplier >= 1.8', async () => {
      const result = await service.suggestPrice({
        category: 'development',
        description:
          '开发一个复杂的分布式机器学习系统，需要微服务架构和高并发处理',
        requirements: { skills: ['tensorflow', 'kubernetes'], minTrustScore: 85 },
      });

      expect(result.factors.complexity).toBe('high');
    });
  });

  describe('urgency multiplier', () => {
    it('should add 1.5x multiplier for deadline within 1 day', async () => {
      const deadline = new Date();
      deadline.setHours(deadline.getHours() + 12);

      const result = await service.suggestPrice({
        category: 'development',
        description: '开发任务',
        deadline: deadline.toISOString(),
      });

      expect(result.breakdown.urgencyMultiplier).toBe(1.5);
    });

    it('should add 1.3x multiplier for deadline within 3 days', async () => {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 2);

      const result = await service.suggestPrice({
        category: 'development',
        description: '开发任务',
        deadline: deadline.toISOString(),
      });

      expect(result.breakdown.urgencyMultiplier).toBe(1.3);
    });

    it('should add 1.15x multiplier for deadline within 7 days', async () => {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 5);

      const result = await service.suggestPrice({
        category: 'development',
        description: '开发任务',
        deadline: deadline.toISOString(),
      });

      expect(result.breakdown.urgencyMultiplier).toBe(1.15);
    });

    it('should add 1.05x multiplier for deadline within 14 days', async () => {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 10);

      const result = await service.suggestPrice({
        category: 'development',
        description: '开发任务',
        deadline: deadline.toISOString(),
      });

      expect(result.breakdown.urgencyMultiplier).toBe(1.05);
    });

    it('should add no multiplier for deadline beyond 14 days', async () => {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 20);

      const result = await service.suggestPrice({
        category: 'development',
        description: '开发任务',
        deadline: deadline.toISOString(),
      });

      expect(result.breakdown.urgencyMultiplier).toBe(1.0);
    });
  });

  describe('skill premium', () => {
    it('should return 1.0 for empty skills array', async () => {
      const result = await service.suggestPrice({
        category: 'development',
        description: '开发任务',
        requirements: { skills: [] },
      });

      expect(result.breakdown.skillPremium).toBe(1.0);
    });

    it('should return 1.0 for no requirements', async () => {
      const result = await service.suggestPrice({
        category: 'development',
        description: '开发任务',
      });

      expect(result.breakdown.skillPremium).toBe(1.0);
    });

    it('should add 10% premium per premium skill', async () => {
      const result = await service.suggestPrice({
        category: 'development',
        description: '开发任务',
        requirements: { skills: ['machine learning', 'blockchain'] },
      });

      expect(result.breakdown.skillPremium).toBe(1.2);
    });

    it('should cap skill premium at 1.5 (50%)', async () => {
      const result = await service.suggestPrice({
        category: 'development',
        description: '开发任务',
        requirements: {
          skills: [
            'machine learning',
            'ai',
            'blockchain',
            'kubernetes',
            '微服务',
            '机器学习',
          ],
        },
      });

      expect(result.breakdown.skillPremium).toBeLessThanOrEqual(1.5);
    });

    it('should recognize Chinese premium skills', async () => {
      const result = await service.suggestPrice({
        category: 'development',
        description: '开发任务',
        requirements: { skills: ['微服务', '机器学习', '人工智能'] },
      });

      expect(result.breakdown.skillPremium).toBeGreaterThan(1.0);
    });
  });

  describe('market adjustment', () => {
    it('should use default adjustment when no historical data', async () => {
      (prisma.task.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.suggestPrice({
        category: 'development',
        description: '开发任务',
      });

      expect(result.breakdown.marketAdjustment).toBe(1.2); // development default
    });

    it('should use default adjustment on database error', async () => {
      (prisma.task.findMany as jest.Mock).mockRejectedValue(new Error('DB error'));

      const result = await service.suggestPrice({
        category: 'development',
        description: '开发任务',
      });

      expect(result.breakdown.marketAdjustment).toBe(1.2);
    });

    it('should adjust price based on high demand (>=5 bids per task)', async () => {
      const mockTasks = Array(10)
        .fill(null)
        .map(() => ({ bids: Array(6).fill({}) }));
      (prisma.task.findMany as jest.Mock).mockResolvedValue(mockTasks);

      const result = await service.suggestPrice({
        category: 'development',
        description: '开发任务',
      });

      expect(result.breakdown.marketAdjustment).toBe(1.3);
    });

    it('should adjust price based on medium-high demand (>=3 bids)', async () => {
      const mockTasks = Array(10)
        .fill(null)
        .map(() => ({ bids: Array(4).fill({}) }));
      (prisma.task.findMany as jest.Mock).mockResolvedValue(mockTasks);

      const result = await service.suggestPrice({
        category: 'development',
        description: '开发任务',
      });

      expect(result.breakdown.marketAdjustment).toBe(1.15);
    });

    it('should adjust price based on normal demand (>=1.5 bids)', async () => {
      const mockTasks = Array(10)
        .fill(null)
        .map(() => ({ bids: Array(2).fill({}) }));
      (prisma.task.findMany as jest.Mock).mockResolvedValue(mockTasks);

      const result = await service.suggestPrice({
        category: 'development',
        description: '开发任务',
      });

      expect(result.breakdown.marketAdjustment).toBe(1.0);
    });

    it('should adjust price based on low demand (>=0.5 bids)', async () => {
      const mockTasks = Array(10)
        .fill(null)
        .map(() => ({ bids: [{}] }));
      (prisma.task.findMany as jest.Mock).mockResolvedValue(mockTasks);

      const result = await service.suggestPrice({
        category: 'development',
        description: '开发任务',
      });

      expect(result.breakdown.marketAdjustment).toBe(0.9);
    });

    it('should adjust price based on very low demand (<0.5 bids)', async () => {
      const mockTasks = Array(10)
        .fill(null)
        .map(() => ({ bids: [] }));
      (prisma.task.findMany as jest.Mock).mockResolvedValue(mockTasks);

      const result = await service.suggestPrice({
        category: 'development',
        description: '开发任务',
      });

      expect(result.breakdown.marketAdjustment).toBe(0.8);
    });

    it('should classify demand as low for adjustment < 0.9', async () => {
      const mockTasks = Array(10)
        .fill(null)
        .map(() => ({ bids: [] }));
      (prisma.task.findMany as jest.Mock).mockResolvedValue(mockTasks);

      const result = await service.suggestPrice({
        category: 'development',
        description: '开发任务',
      });

      expect(result.factors.marketDemand).toBe('low');
    });

    it('should classify demand as medium for adjustment 0.9-1.1', async () => {
      const mockTasks = Array(10)
        .fill(null)
        .map(() => ({ bids: [{}] }));
      (prisma.task.findMany as jest.Mock).mockResolvedValue(mockTasks);

      const result = await service.suggestPrice({
        category: 'development',
        description: '开发任务',
      });

      expect(result.factors.marketDemand).toBe('medium');
    });

    it('should classify demand as high for adjustment >= 1.1', async () => {
      const mockTasks = Array(10)
        .fill(null)
        .map(() => ({ bids: Array(5).fill({}) }));
      (prisma.task.findMany as jest.Mock).mockResolvedValue(mockTasks);

      const result = await service.suggestPrice({
        category: 'development',
        description: '开发任务',
      });

      expect(result.factors.marketDemand).toBe('high');
    });
  });

  describe('market price calculation', () => {
    it('should calculate increasing trend', async () => {
      const now = Date.now();
      const earlyTask = {
        reward: JSON.stringify({ credits: 500 }),
        createdAt: new Date(now - 20 * 24 * 60 * 60 * 1000),
      };
      const lateTask = {
        reward: JSON.stringify({ credits: 800 }),
        createdAt: new Date(now - 5 * 24 * 60 * 60 * 1000),
      };

      (prisma.task.findMany as jest.Mock).mockResolvedValue([earlyTask, lateTask]);
      (prisma.task.count as jest.Mock).mockResolvedValue(2);

      const result = await service.getMarketPrice({ categories: ['development'] });

      expect(result[0].trend).toBe('increasing');
    });

    it('should calculate decreasing trend', async () => {
      const now = Date.now();
      const earlyTask = {
        reward: JSON.stringify({ credits: 800 }),
        createdAt: new Date(now - 20 * 24 * 60 * 60 * 1000),
      };
      const lateTask = {
        reward: JSON.stringify({ credits: 500 }),
        createdAt: new Date(now - 5 * 24 * 60 * 60 * 1000),
      };

      (prisma.task.findMany as jest.Mock).mockResolvedValue([earlyTask, lateTask]);
      (prisma.task.count as jest.Mock).mockResolvedValue(2);

      const result = await service.getMarketPrice({ categories: ['development'] });

      expect(result[0].trend).toBe('decreasing');
    });

    it('should calculate stable trend when change < 10%', async () => {
      const now = Date.now();
      const earlyTask = {
        reward: JSON.stringify({ credits: 500 }),
        createdAt: new Date(now - 20 * 24 * 60 * 60 * 1000),
      };
      const lateTask = {
        reward: JSON.stringify({ credits: 520 }),
        createdAt: new Date(now - 5 * 24 * 60 * 60 * 1000),
      };

      (prisma.task.findMany as jest.Mock).mockResolvedValue([earlyTask, lateTask]);
      (prisma.task.count as jest.Mock).mockResolvedValue(2);

      const result = await service.getMarketPrice({ categories: ['development'] });

      expect(result[0].trend).toBe('stable');
    });

    it('should classify demand level based on task count', async () => {
      (prisma.task.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.task.count as jest.Mock).mockResolvedValue(25);

      const result = await service.getMarketPrice({ categories: ['development'] });

      expect(result[0].demandLevel).toBe('high');
    });

    it('should classify low demand level for < 10 tasks', async () => {
      // Provide completed tasks data so it doesn't use defaults
      const mockTasks = [
        { reward: JSON.stringify({ credits: 100 }), createdAt: new Date() },
      ];
      (prisma.task.findMany as jest.Mock).mockResolvedValue(mockTasks);
      (prisma.task.count as jest.Mock).mockResolvedValue(5);

      const result = await service.getMarketPrice({ categories: ['development'] });

      expect(result[0].demandLevel).toBe('low');
    });

    it('should classify medium demand level for 10-20 tasks', async () => {
      // Provide completed tasks data so it doesn't use defaults
      const mockTasks = [
        { reward: JSON.stringify({ credits: 100 }), createdAt: new Date() },
      ];
      (prisma.task.findMany as jest.Mock).mockResolvedValue(mockTasks);
      (prisma.task.count as jest.Mock).mockResolvedValue(15);

      const result = await service.getMarketPrice({ categories: ['development'] });

      expect(result[0].demandLevel).toBe('medium');
    });

    it('should handle reward with amount field', async () => {
      const mockTasks = [
        { reward: JSON.stringify({ amount: 100 }), createdAt: new Date() },
        { reward: JSON.stringify({ amount: 200 }), createdAt: new Date() },
      ];

      (prisma.task.findMany as jest.Mock).mockResolvedValue(mockTasks);
      (prisma.task.count as jest.Mock).mockResolvedValue(2);

      const result = await service.getMarketPrice({ categories: ['development'] });

      expect(result[0].avgPrice).toBe(150);
    });

    it('should use default market price on database error', async () => {
      (prisma.task.findMany as jest.Mock).mockRejectedValue(new Error('DB error'));

      const result = await service.getMarketPrice({ categories: ['development'] });

      expect(result[0]).toHaveProperty('avgPrice');
      expect(result[0].sampleSize).toBe(0);
    });

    it('should handle tasks with null reward', async () => {
      const mockTasks = [
        { reward: null, createdAt: new Date() },
        { reward: JSON.stringify({ credits: 100 }), createdAt: new Date() },
      ];

      (prisma.task.findMany as jest.Mock).mockResolvedValue(mockTasks);
      (prisma.task.count as jest.Mock).mockResolvedValue(2);

      const result = await service.getMarketPrice({ categories: ['development'] });

      expect(result[0].avgPrice).toBe(100);
      expect(result[0].sampleSize).toBe(1);
    });

    it('should use default when all rewards are null', async () => {
      const mockTasks = [
        { reward: null, createdAt: new Date() },
        { reward: null, createdAt: new Date() },
      ];

      (prisma.task.findMany as jest.Mock).mockResolvedValue(mockTasks);
      (prisma.task.count as jest.Mock).mockResolvedValue(2);

      const result = await service.getMarketPrice({ categories: ['development'] });

      expect(result[0].sampleSize).toBe(0);
    });
  });

  describe('category base prices', () => {
    it('should return correct base price for development', async () => {
      const result = await service.suggestPrice({
        category: 'development',
        description: '简单任务',
      });

      expect(result.breakdown.basePrice).toBe(500);
    });

    it('should return correct base price for design', async () => {
      const result = await service.suggestPrice({
        category: 'design',
        description: '简单任务',
      });

      expect(result.breakdown.basePrice).toBe(400);
    });

    it('should return correct base price for testing', async () => {
      const result = await service.suggestPrice({
        category: 'testing',
        description: '简单任务',
      });

      expect(result.breakdown.basePrice).toBe(300);
    });

    it('should return correct base price for documentation', async () => {
      const result = await service.suggestPrice({
        category: 'documentation',
        description: '简单任务',
      });

      expect(result.breakdown.basePrice).toBe(250);
    });

    it('should return correct base price for analysis', async () => {
      const result = await service.suggestPrice({
        category: 'analysis',
        description: '简单任务',
      });

      expect(result.breakdown.basePrice).toBe(350);
    });

    it('should return correct base price for consulting', async () => {
      const result = await service.suggestPrice({
        category: 'consulting',
        description: '简单任务',
      });

      expect(result.breakdown.basePrice).toBe(600);
    });

    it('should return default base price for unknown category', async () => {
      const result = await service.suggestPrice({
        category: 'unknown-category',
        description: '简单任务',
      });

      expect(result.breakdown.basePrice).toBe(400);
    });
  });

  describe('estimated hours', () => {
    it('should estimate hours based on category and complexity', async () => {
      const result = await service.suggestPrice({
        category: 'development',
        description: '简单任务',
      });

      expect(result.factors.estimatedHours).toBeGreaterThan(0);
    });

    it('should estimate more hours for complex tasks', async () => {
      const simpleTask = await service.suggestPrice({
        category: 'development',
        description: '简单任务',
      });

      const complexTask = await service.suggestPrice({
        category: 'development',
        description: '开发一个复杂的机器学习系统',
        requirements: { skills: ['tensorflow', 'kubernetes'] },
      });

      expect(complexTask.factors.estimatedHours).toBeGreaterThan(
        simpleTask.factors.estimatedHours,
      );
    });
  });
});
