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
});
