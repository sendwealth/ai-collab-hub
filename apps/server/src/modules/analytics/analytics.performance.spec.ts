import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../common/prisma/prisma.service';

/**
 * Performance Tests for Analytics System
 * Tests large data queries, complex calculations, and performance characteristics
 */
describe('Analytics Performance Tests', () => {
  let service: AnalyticsService;
  let prisma: any;

  const mockPrismaService: any = {
    agent: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    task: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    credit: {
      aggregate: jest.fn(),
    },
    creditTransaction: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    workflowInstance: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // Large Data Query Tests
  // ============================================
  describe('Large Data Queries', () => {
    it('should handle large number of tasks in trends', async () => {
      // Generate 10000 tasks over 30 days
      const mockTasks = Array.from({ length: 10000 }, (_, i) => ({
        createdAt: new Date(2024, 0, (i % 30) + 1, i % 24, i % 60),
        status: ['completed', 'open', 'assigned'][i % 3],
        category: ['development', 'design', 'testing', 'devops'][i % 4],
      }));

      prisma.task.findMany.mockResolvedValue(mockTasks);

      const startTime = Date.now();
      const result = await service.getTaskTrends(30);
      const duration = Date.now() - startTime;

      expect(result.total).toBe(10000);
      expect(result.data.length).toBeLessThanOrEqual(30);
      // Should complete within reasonable time
      expect(duration).toBeLessThan(5000);
    });

    it('should handle large number of transactions in credit flow', async () => {
      // Generate 50000 transactions
      const mockTransactions = Array.from({ length: 50000 }, (_, i) => ({
        type: ['earn', 'spend', 'transfer'][i % 3],
        amount: Math.floor(Math.random() * 1000) + 1,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      }));

      prisma.creditTransaction.findMany.mockResolvedValue(mockTransactions);

      const startTime = Date.now();
      const result = await service.getCreditFlow(30);
      const duration = Date.now() - startTime;

      expect(result.byType).toHaveLength(3);
      expect(duration).toBeLessThan(5000);
    });

    it('should handle large number of workflow instances', async () => {
      // Generate 20000 workflow instances
      const mockInstances = Array.from({ length: 20000 }, (_, i) => ({
        status: ['completed', 'running', 'failed'][i % 3],
        templateId: `template-${i % 10}`,
        startedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        completedAt: i % 3 === 1 ? null : new Date(Date.now() - Math.random() * 6 * 24 * 60 * 60 * 1000),
      }));

      prisma.workflowInstance.findMany.mockResolvedValue(mockInstances);

      const startTime = Date.now();
      const result = await service.getWorkflowStatistics();
      const duration = Date.now() - startTime;

      expect(result.total).toBe(20000);
      expect(result.byStatus.length).toBeLessThanOrEqual(3);
      expect(result.byTemplate.length).toBeLessThanOrEqual(10);
      expect(duration).toBeLessThan(5000);
    });

    it('should handle large number of agents in performance report', async () => {
      // Generate 100 agents with tasks
      const mockAgents = Array.from({ length: 100 }, (_, i) => ({
        id: `agent-${i}`,
        name: `Agent ${i}`,
        status: ['idle', 'busy', 'offline'][i % 3],
        trustScore: 50 + (i % 50),
        _count: { assignedTasks: Math.floor(Math.random() * 100) },
      }));

      prisma.agent.findMany.mockResolvedValue(mockAgents);
      prisma.task.count.mockImplementation(() => 
        Promise.resolve(Math.floor(Math.random() * 50))
      );

      const startTime = Date.now();
      const result = await service.getAgentPerformance(100);
      const duration = Date.now() - startTime;

      expect(result).toHaveLength(100);
      expect(duration).toBeLessThan(5000);
    });
  });

  // ============================================
  // Complex Calculation Tests
  // ============================================
  describe('Complex Calculations', () => {
    it('should efficiently calculate average duration for many instances', async () => {
      // Generate 5000 completed instances with varying durations
      const mockInstances = Array.from({ length: 5000 }, (_, i) => {
        const start = new Date(2024, 0, 1, 10, 0, 0);
        const durationMinutes = Math.floor(Math.random() * 120) + 10; // 10-130 minutes
        const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
        return {
          status: 'completed',
          templateId: `template-${i % 5}`,
          startedAt: start,
          completedAt: end,
        };
      });

      prisma.workflowInstance.findMany.mockResolvedValue(mockInstances);

      const startTime = Date.now();
      const result = await service.getWorkflowStatistics();
      const duration = Date.now() - startTime;

      // Average should be around 70 minutes = 4200 seconds
      expect(result.avgDuration).toBeGreaterThan(0);
      expect(result.avgDuration).toBeLessThan(10000);
      expect(duration).toBeLessThan(2000);
    });

    it('should handle complex aggregation in dashboard overview', async () => {
      // Multiple database calls with varying delays
      prisma.agent.count
        .mockImplementationOnce(() => new Promise(r => setTimeout(() => r(1000), 10)))
        .mockImplementationOnce(() => new Promise(r => setTimeout(() => r(250), 10)));
      
      prisma.task.count
        .mockImplementationOnce(() => new Promise(r => setTimeout(() => r(5000), 15)))
        .mockImplementationOnce(() => new Promise(r => setTimeout(() => r(4000), 12)))
        .mockImplementationOnce(() => new Promise(r => setTimeout(() => r(800), 8)));
      
      prisma.credit.aggregate.mockImplementationOnce(() => 
        new Promise(r => setTimeout(() => r({ _sum: { balance: 100000 } }), 20))
      );
      prisma.creditTransaction.count.mockImplementationOnce(() => 
        new Promise(r => setTimeout(() => r(5000), 18))
      );
      
      prisma.workflowInstance.count
        .mockImplementationOnce(() => new Promise(r => setTimeout(() => r(500), 15)))
        .mockImplementationOnce(() => new Promise(r => setTimeout(() => r(100), 12)));

      const startTime = Date.now();
      const result = await service.getDashboardOverview();
      const duration = Date.now() - startTime;

      // Parallel execution should be faster than sequential
      expect(duration).toBeLessThan(100);
      expect(result.agents.total).toBe(1000);
      expect(result.tasks.total).toBe(5000);
    });

    it('should efficiently process category distribution', async () => {
      // Generate 10000 tasks with various categories
      const mockTasks = Array.from({ length: 10000 }, (_, i) => ({
        category: [
          'development', 'design', 'testing', 'devops', 
          'documentation', 'research', 'maintenance', 'security',
          'infrastructure', 'ml-ops'
        ][i % 10],
      }));

      prisma.task.findMany.mockResolvedValue(mockTasks);

      const startTime = Date.now();
      const result = await service.getCategoryDistribution();
      const duration = Date.now() - startTime;

      expect(result).toHaveLength(10);
      // Each category should have 1000 tasks
      result.forEach((item: any) => {
        expect(item.count).toBe(1000);
      });
      expect(duration).toBeLessThan(1000);
    });
  });

  // ============================================
  // Memory and Resource Tests
  // ============================================
  describe('Memory and Resources', () => {
    it('should not leak memory with repeated calls', async () => {
      prisma.agent.count.mockResolvedValue(10);
      prisma.task.count.mockResolvedValue(50);
      prisma.credit.aggregate.mockResolvedValue({ _sum: { balance: 1000 } });
      prisma.creditTransaction.count.mockResolvedValue(100);
      prisma.workflowInstance.count.mockResolvedValue(20);

      // Run many iterations
      const iterations = 100;
      for (let i = 0; i < iterations; i++) {
        await service.getRealTimeMetrics();
      }

      // If we get here without OOM, memory is handled correctly
      expect(prisma.agent.count).toHaveBeenCalledTimes(iterations);
    });

    it('should handle concurrent requests efficiently', async () => {
      prisma.agent.count.mockResolvedValue(10);
      prisma.task.count.mockResolvedValue(50);
      prisma.credit.aggregate.mockResolvedValue({ _sum: { balance: 1000 } });
      prisma.creditTransaction.count.mockResolvedValue(100);
      prisma.workflowInstance.count.mockResolvedValue(20);

      const concurrentRequests = 50;
      const startTime = Date.now();

      const promises = Array.from({ length: concurrentRequests }, () =>
        service.getRealTimeMetrics()
      );

      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;

      expect(results).toHaveLength(concurrentRequests);
      // Concurrent execution should be efficient
      expect(duration).toBeLessThan(5000);
    });
  });

  // ============================================
  // Performance Benchmarks
  // ============================================
  describe('Performance Benchmarks', () => {
    it('dashboard overview should complete within 100ms with mocked data', async () => {
      prisma.agent.count.mockResolvedValue(10);
      prisma.task.count.mockResolvedValue(50);
      prisma.credit.aggregate.mockResolvedValue({ _sum: { balance: 1000 } });
      prisma.creditTransaction.count.mockResolvedValue(100);
      prisma.workflowInstance.count.mockResolvedValue(20);

      const iterations = 10;
      const durations: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        await service.getDashboardOverview();
        durations.push(Date.now() - start);
      }

      const avgDuration = durations.reduce((a, b) => a + b, 0) / iterations;
      expect(avgDuration).toBeLessThan(100);
    });

    it('task trends should scale linearly with data size', async () => {
      const sizes = [100, 500, 1000, 2000];
      const durations: number[] = [];

      for (const size of sizes) {
        const mockTasks = Array.from({ length: size }, (_, i) => ({
          createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          status: 'completed',
          category: 'dev',
        }));

        prisma.task.findMany.mockResolvedValue(mockTasks);

        const start = Date.now();
        await service.getTaskTrends(7);
        durations.push(Date.now() - start);
      }

      // Check rough linear scaling (last duration should be ~20x first, not 100x)
      const ratio = durations[durations.length - 1] / durations[0];
      expect(ratio).toBeLessThan(50);
    });

    it('category distribution should handle unique categories efficiently', async () => {
      // Many unique categories
      const mockTasks = Array.from({ length: 1000 }, (_, i) => ({
        category: `category-${i}`,
      }));

      prisma.task.findMany.mockResolvedValue(mockTasks);

      const start = Date.now();
      const result = await service.getCategoryDistribution();
      const duration = Date.now() - start;

      expect(result).toHaveLength(1000);
      expect(duration).toBeLessThan(500);
    });
  });

  // ============================================
  // Query Optimization Tests
  // ============================================
  describe('Query Optimization', () => {
    it('should use select to limit returned fields', async () => {
      prisma.task.findMany.mockResolvedValue([]);

      await service.getTaskTrends(7);

      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: {
            createdAt: true,
            status: true,
            category: true,
          },
        })
      );
    });

    it('should use appropriate ordering for trends', async () => {
      prisma.task.findMany.mockResolvedValue([]);

      await service.getTaskTrends(7);

      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'asc' },
        })
      );
    });

    it('should limit agent performance results', async () => {
      prisma.agent.findMany.mockResolvedValue([]);

      await service.getAgentPerformance(10);

      expect(prisma.agent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        })
      );
    });

    it('should use aggregate for credit total', async () => {
      prisma.credit.aggregate.mockResolvedValue({ _sum: { balance: 1000 } });
      prisma.agent.count.mockResolvedValue(0);
      prisma.task.count.mockResolvedValue(0);
      prisma.creditTransaction.count.mockResolvedValue(0);
      prisma.workflowInstance.count.mockResolvedValue(0);

      await service.getDashboardOverview();

      expect(prisma.credit.aggregate).toHaveBeenCalledWith({
        _sum: { balance: true },
      });
    });
  });

  // ============================================
  // Stress Tests
  // ============================================
  describe('Stress Tests', () => {
    it('should handle rapid successive calls', async () => {
      prisma.agent.count.mockResolvedValue(0);
      prisma.task.count.mockResolvedValue(0);
      prisma.credit.aggregate.mockResolvedValue({ _sum: { balance: 0 } });
      prisma.creditTransaction.count.mockResolvedValue(0);
      prisma.workflowInstance.count.mockResolvedValue(0);

      const rapidCalls = 100;
      const promises = [];

      for (let i = 0; i < rapidCalls; i++) {
        promises.push(service.getDashboardOverview());
      }

      const results = await Promise.all(promises);
      expect(results).toHaveLength(rapidCalls);
    });

    it('should handle mixed operation types simultaneously', async () => {
      // Setup all mocks
      prisma.agent.count.mockResolvedValue(10);
      prisma.agent.findMany.mockResolvedValue([]);
      prisma.task.count.mockResolvedValue(50);
      prisma.task.findMany.mockResolvedValue([]);
      prisma.credit.aggregate.mockResolvedValue({ _sum: { balance: 1000 } });
      prisma.creditTransaction.count.mockResolvedValue(100);
      prisma.creditTransaction.findMany.mockResolvedValue([]);
      prisma.workflowInstance.count.mockResolvedValue(20);
      prisma.workflowInstance.findMany.mockResolvedValue([]);

      const operations = [
        service.getDashboardOverview(),
        service.getTaskTrends(7),
        service.getAgentPerformance(10),
        service.getCategoryDistribution(),
        service.getWorkflowStatistics(),
        service.getCreditFlow(30),
        service.getRealTimeMetrics(),
      ];

      const results = await Promise.all(operations);
      
      expect(results).toHaveLength(7);
      results.forEach(result => {
        expect(result).toBeDefined();
      });
    });
  });

  // ============================================
  // Timeout Handling
  // ============================================
  describe('Timeout Handling', () => {
    it('should complete dashboard overview before typical timeout', async () => {
      prisma.agent.count.mockResolvedValue(100);
      prisma.task.count.mockResolvedValue(500);
      prisma.credit.aggregate.mockResolvedValue({ _sum: { balance: 10000 } });
      prisma.creditTransaction.count.mockResolvedValue(1000);
      prisma.workflowInstance.count.mockResolvedValue(200);

      const timeout = 5000; // 5 seconds
      const result = await Promise.race([
        service.getDashboardOverview(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), timeout)
        ),
      ]);

      expect(result).toBeDefined();
    });

    it('should handle slow database responses gracefully', async () => {
      // Simulate slow responses
      prisma.agent.count.mockImplementation(() => 
        new Promise(r => setTimeout(() => r(10), 100))
      );
      prisma.task.count.mockImplementation(() => 
        new Promise(r => setTimeout(() => r(50), 100))
      );
      prisma.credit.aggregate.mockImplementation(() => 
        new Promise(r => setTimeout(() => r({ _sum: { balance: 1000 } }), 100))
      );
      prisma.creditTransaction.count.mockImplementation(() => 
        new Promise(r => setTimeout(() => r(100), 100))
      );
      prisma.workflowInstance.count.mockImplementation(() => 
        new Promise(r => setTimeout(() => r(20), 100))
      );

      const start = Date.now();
      const result = await service.getDashboardOverview();
      const duration = Date.now() - start;

      // Even with 100ms delays, parallel execution should complete in ~100ms
      expect(duration).toBeLessThan(200);
      expect(result).toBeDefined();
    });
  });
});
