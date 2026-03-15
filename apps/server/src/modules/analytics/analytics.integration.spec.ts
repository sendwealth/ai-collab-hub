import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../common/prisma/prisma.service';

/**
 * Integration Tests for Analytics System
 * Tests data aggregation, calculations, and real-time updates
 */
describe('Analytics Integration Tests', () => {
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
  // Dashboard Data Aggregation Tests
  // ============================================
  describe('Dashboard Data Aggregation', () => {
    it('should aggregate data from multiple sources in parallel', async () => {
      // Setup mocks for parallel queries
      prisma.agent.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(3);
      
      prisma.task.count
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(35)
        .mockResolvedValueOnce(10);
      
      prisma.credit.aggregate.mockResolvedValue({ _sum: { balance: 10000 } });
      prisma.creditTransaction.count.mockResolvedValue(200);
      
      prisma.workflowInstance.count
        .mockResolvedValueOnce(15)
        .mockResolvedValueOnce(5);

      const result = await service.getDashboardOverview();

      // Verify all data is aggregated correctly
      expect(result.agents.total).toBe(10);
      expect(result.tasks.total).toBe(50);
      expect(result.credits.totalBalance).toBe(10000);
      expect(result.workflows.total).toBe(15);
    });

    it('should calculate derived metrics from aggregated data', async () => {
      prisma.agent.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(30);
      
      prisma.task.count
        .mockResolvedValueOnce(200)
        .mockResolvedValueOnce(150)
        .mockResolvedValueOnce(30);
      
      prisma.credit.aggregate.mockResolvedValue({ _sum: { balance: 50000 } });
      prisma.creditTransaction.count.mockResolvedValue(500);
      
      prisma.workflowInstance.count
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(10);

      const result = await service.getDashboardOverview();

      // Verify derived calculations
      expect(result.agents.utilizationRate).toBe('70.0'); // (100-30)/100 * 100
      expect(result.tasks.completionRate).toBe('75.0'); // 150/200 * 100
    });

    it('should handle partial data availability', async () => {
      // Only some queries return data
      prisma.agent.count
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(0);
      
      prisma.task.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      
      prisma.credit.aggregate.mockResolvedValue({ _sum: { balance: null } });
      prisma.creditTransaction.count.mockResolvedValue(0);
      
      prisma.workflowInstance.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      const result = await service.getDashboardOverview();

      // Should handle null/zero values gracefully
      expect(result.agents.utilizationRate).toBe('100.0'); // (5-0)/5 * 100
      expect(result.tasks.completionRate).toBe(0);
      expect(result.credits.totalBalance).toBe(0);
    });

    it('should maintain data consistency across queries', async () => {
      const totalAgents = 20;
      const idleAgents = 5;

      prisma.agent.count
        .mockResolvedValueOnce(totalAgents)
        .mockResolvedValueOnce(idleAgents);
      
      prisma.task.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(80)
        .mockResolvedValueOnce(15);
      
      prisma.credit.aggregate.mockResolvedValue({ _sum: { balance: 25000 } });
      prisma.creditTransaction.count.mockResolvedValue(300);
      
      prisma.workflowInstance.count
        .mockResolvedValueOnce(40)
        .mockResolvedValueOnce(8);

      const result = await service.getDashboardOverview();

      // Verify internal consistency
      const busyAgents = totalAgents - idleAgents;
      const utilizationRate = (busyAgents / totalAgents * 100).toFixed(1);
      expect(result.agents.utilizationRate).toBe(utilizationRate);
    });
  });

  // ============================================
  // Trend Data Calculation Tests
  // ============================================
  describe('Trend Data Calculation', () => {
    it('should calculate daily task trends correctly', async () => {
      const mockTasks = [
        { createdAt: new Date('2024-01-01T08:00:00Z'), status: 'completed', category: 'dev' },
        { createdAt: new Date('2024-01-01T12:00:00Z'), status: 'open', category: 'dev' },
        { createdAt: new Date('2024-01-01T16:00:00Z'), status: 'completed', category: 'design' },
        { createdAt: new Date('2024-01-02T10:00:00Z'), status: 'assigned', category: 'dev' },
        { createdAt: new Date('2024-01-02T14:00:00Z'), status: 'completed', category: 'testing' },
        { createdAt: new Date('2024-01-03T10:00:00Z'), status: 'open', category: 'dev' },
      ];

      prisma.task.findMany.mockResolvedValue(mockTasks);

      const result = await service.getTaskTrends(7);

      // Verify daily aggregation
      expect(result.data).toHaveLength(3);
      expect(result.data[0].date).toBe('2024-01-01');
      expect(result.data[0].count).toBe(3);
      expect(result.data[1].date).toBe('2024-01-02');
      expect(result.data[1].count).toBe(2);
      expect(result.data[2].date).toBe('2024-01-03');
      expect(result.data[2].count).toBe(1);
    });

    it('should handle gaps in dates correctly', async () => {
      const mockTasks = [
        { createdAt: new Date('2024-01-01T10:00:00Z'), status: 'completed', category: 'dev' },
        { createdAt: new Date('2024-01-05T10:00:00Z'), status: 'open', category: 'dev' },
      ];

      prisma.task.findMany.mockResolvedValue(mockTasks);

      const result = await service.getTaskTrends(7);

      // Should only include dates with data
      expect(result.data).toHaveLength(2);
      expect(result.data[0].date).toBe('2024-01-01');
      expect(result.data[1].date).toBe('2024-01-05');
    });

    it('should calculate credit flow trends with values', async () => {
      const mockTransactions = [
        { type: 'earn', amount: 100, createdAt: new Date('2024-01-01T10:00:00Z') },
        { type: 'earn', amount: 200, createdAt: new Date('2024-01-01T14:00:00Z') },
        { type: 'spend', amount: 50, createdAt: new Date('2024-01-01T16:00:00Z') },
        { type: 'earn', amount: 150, createdAt: new Date('2024-01-02T10:00:00Z') },
      ];

      prisma.creditTransaction.findMany.mockResolvedValue(mockTransactions);

      const result = await service.getCreditFlow(30);

      // Verify daily totals
      const jan1 = result.byDate.find((d: any) => d.date === '2024-01-01');
      expect(jan1.count).toBe(3);
      expect(jan1.value).toBe(350); // 100 + 200 + 50
      
      const jan2 = result.byDate.find((d: any) => d.date === '2024-01-02');
      expect(jan2.count).toBe(1);
      expect(jan2.value).toBe(150);
    });

    it('should aggregate by transaction type correctly', async () => {
      const mockTransactions = [
        { type: 'earn', amount: 100, createdAt: new Date() },
        { type: 'earn', amount: 200, createdAt: new Date() },
        { type: 'earn', amount: 300, createdAt: new Date() },
        { type: 'spend', amount: 50, createdAt: new Date() },
        { type: 'spend', amount: 100, createdAt: new Date() },
        { type: 'transfer', amount: 75, createdAt: new Date() },
      ];

      prisma.creditTransaction.findMany.mockResolvedValue(mockTransactions);

      const result = await service.getCreditFlow(30);

      const earnType = result.byType.find((t: any) => t.type === 'earn');
      const spendType = result.byType.find((t: any) => t.type === 'spend');
      const transferType = result.byType.find((t: any) => t.type === 'transfer');

      expect(earnType).toEqual({ type: 'earn', count: 3, total: 600 });
      expect(spendType).toEqual({ type: 'spend', count: 2, total: 150 });
      expect(transferType).toEqual({ type: 'transfer', count: 1, total: 75 });
    });
  });

  // ============================================
  // Statistics Accuracy Tests
  // ============================================
  describe('Statistics Accuracy', () => {
    it('should calculate agent completion rate accurately', async () => {
      const mockAgents = [
        { id: 'agent-1', name: 'Agent One', status: 'idle', trustScore: 90, _count: { assignedTasks: 10 } },
        { id: 'agent-2', name: 'Agent Two', status: 'idle', trustScore: 80, _count: { assignedTasks: 8 } },
      ];

      prisma.agent.findMany.mockResolvedValue(mockAgents);
      prisma.task.count
        .mockResolvedValueOnce(7) // agent-1: 7 completed out of 10
        .mockResolvedValueOnce(8); // agent-2: 8 completed out of 8

      const result = await service.getAgentPerformance();

      expect(result[0].completionRate).toBe('70.0'); // 7/10 * 100
      expect(result[1].completionRate).toBe('100.0'); // 8/8 * 100
    });

    it('should calculate workflow average duration accurately', async () => {
      const mockInstances = [
        { status: 'completed', templateId: 't1', startedAt: new Date('2024-01-01T10:00:00Z'), completedAt: new Date('2024-01-01T11:00:00Z') }, // 1 hour = 3600s
        { status: 'completed', templateId: 't1', startedAt: new Date('2024-01-02T10:00:00Z'), completedAt: new Date('2024-01-02T10:30:00Z') }, // 30 min = 1800s
        { status: 'completed', templateId: 't1', startedAt: new Date('2024-01-03T10:00:00Z'), completedAt: new Date('2024-01-03T12:00:00Z') }, // 2 hours = 7200s
      ];

      prisma.workflowInstance.findMany.mockResolvedValue(mockInstances);

      const result = await service.getWorkflowStatistics();

      // Average: (3600 + 1800 + 7200) / 3 = 4200 seconds
      expect(result.avgDuration).toBe(4200);
    });

    it('should count category distribution accurately', async () => {
      const mockTasks = [
        { category: 'development' },
        { category: 'development' },
        { category: 'development' },
        { category: 'design' },
        { category: 'design' },
        { category: 'testing' },
        { category: 'development' },
        { category: 'design' },
      ];

      prisma.task.findMany.mockResolvedValue(mockTasks);

      const result = await service.getCategoryDistribution();

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ category: 'development', count: 4 });
      expect(result[1]).toEqual({ category: 'design', count: 3 });
      expect(result[2]).toEqual({ category: 'testing', count: 1 });
    });

    it('should calculate workflow statistics by status accurately', async () => {
      const mockInstances = [
        { status: 'completed', templateId: 't1', startedAt: new Date(), completedAt: new Date() },
        { status: 'completed', templateId: 't2', startedAt: new Date(), completedAt: new Date() },
        { status: 'completed', templateId: 't1', startedAt: new Date(), completedAt: new Date() },
        { status: 'running', templateId: 't1', startedAt: new Date(), completedAt: null },
        { status: 'running', templateId: 't2', startedAt: new Date(), completedAt: null },
        { status: 'failed', templateId: 't1', startedAt: new Date(), completedAt: new Date() },
      ];

      prisma.workflowInstance.findMany.mockResolvedValue(mockInstances);

      const result = await service.getWorkflowStatistics();

      expect(result.byStatus).toContainEqual({ status: 'completed', count: 3 });
      expect(result.byStatus).toContainEqual({ status: 'running', count: 2 });
      expect(result.byStatus).toContainEqual({ status: 'failed', count: 1 });
      expect(result.total).toBe(6);
    });
  });

  // ============================================
  // Real-time Data Update Tests
  // ============================================
  describe('Real-time Data Updates', () => {
    it('should return current real-time metrics', async () => {
      prisma.agent.count.mockResolvedValue(8);
      prisma.task.count.mockResolvedValue(15);
      prisma.creditTransaction.count.mockResolvedValue(25);
      prisma.workflowInstance.count.mockResolvedValue(4);

      const result = await service.getRealTimeMetrics();

      expect(result.activeAgentsLastHour).toBe(8);
      expect(result.tasksCreatedLastDay).toBe(15);
      expect(result.transactionsLastDay).toBe(25);
      expect(result.activeWorkflows).toBe(4);
    });

    it('should query with correct time filters', async () => {
      prisma.agent.count.mockResolvedValue(0);
      prisma.task.count.mockResolvedValue(0);
      prisma.creditTransaction.count.mockResolvedValue(0);
      prisma.workflowInstance.count.mockResolvedValue(0);

      await service.getRealTimeMetrics();

      // Verify agent query uses 1 hour filter
      const agentCall = prisma.agent.count.mock.calls[0][0];
      const agentFilterDate = agentCall.where.lastSeen.gte;
      const agentDiff = Date.now() - new Date(agentFilterDate).getTime();
      expect(agentDiff).toBeGreaterThanOrEqual(60 * 60 * 1000 - 1000);
      expect(agentDiff).toBeLessThanOrEqual(60 * 60 * 1000 + 1000);

      // Verify task query uses 24 hour filter
      const taskCall = prisma.task.count.mock.calls[0][0];
      const taskFilterDate = taskCall.where.createdAt.gte;
      const taskDiff = Date.now() - new Date(taskFilterDate).getTime();
      expect(taskDiff).toBeGreaterThanOrEqual(24 * 60 * 60 * 1000 - 1000);
      expect(taskDiff).toBeLessThanOrEqual(24 * 60 * 60 * 1000 + 1000);
    });

    it('should reflect data changes between calls', async () => {
      // First call
      prisma.agent.count.mockResolvedValueOnce(5);
      prisma.task.count.mockResolvedValueOnce(10);
      prisma.creditTransaction.count.mockResolvedValueOnce(20);
      prisma.workflowInstance.count.mockResolvedValueOnce(2);

      const result1 = await service.getRealTimeMetrics();

      // Second call with different data
      prisma.agent.count.mockResolvedValueOnce(7);
      prisma.task.count.mockResolvedValueOnce(12);
      prisma.creditTransaction.count.mockResolvedValueOnce(25);
      prisma.workflowInstance.count.mockResolvedValueOnce(3);

      const result2 = await service.getRealTimeMetrics();

      // Verify results are independent
      expect(result1.activeAgentsLastHour).toBe(5);
      expect(result2.activeAgentsLastHour).toBe(7);
      expect(result1.tasksCreatedLastDay).toBe(10);
      expect(result2.tasksCreatedLastDay).toBe(12);
    });

    it('should generate fresh timestamp for each call', async () => {
      prisma.agent.count.mockResolvedValue(0);
      prisma.task.count.mockResolvedValue(0);
      prisma.creditTransaction.count.mockResolvedValue(0);
      prisma.workflowInstance.count.mockResolvedValue(0);

      const result1 = await service.getRealTimeMetrics();
      
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const result2 = await service.getRealTimeMetrics();

      // Timestamps should be different
      expect(result1.timestamp).not.toBe(result2.timestamp);
    });
  });

  // ============================================
  // Data Integrity Tests
  // ============================================
  describe('Data Integrity', () => {
    it('should maintain consistency between overview and detailed stats', async () => {
      // Setup overview data
      prisma.agent.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(3);
      
      prisma.task.count
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(35)
        .mockResolvedValueOnce(10);
      
      prisma.credit.aggregate.mockResolvedValue({ _sum: { balance: 10000 } });
      prisma.creditTransaction.count.mockResolvedValue(200);
      
      prisma.workflowInstance.count
        .mockResolvedValueOnce(15)
        .mockResolvedValueOnce(5);

      const overview = await service.getDashboardOverview();

      // Setup detailed workflow stats
      prisma.workflowInstance.findMany.mockResolvedValue([
        { status: 'completed', templateId: 't1', startedAt: new Date(), completedAt: new Date() },
        { status: 'completed', templateId: 't2', startedAt: new Date(), completedAt: new Date() },
        { status: 'running', templateId: 't1', startedAt: new Date(), completedAt: null },
        { status: 'running', templateId: 't2', startedAt: new Date(), completedAt: null },
        { status: 'running', templateId: 't3', startedAt: new Date(), completedAt: null },
        { status: 'failed', templateId: 't1', startedAt: new Date(), completedAt: new Date() },
      ]);

      const workflowStats = await service.getWorkflowStatistics();

      // Overview shows 5 running, workflow stats should match
      expect(overview.workflows.running).toBe(5);
      const runningInStats = workflowStats.byStatus.find((s: any) => s.status === 'running')?.count || 0;
      expect(runningInStats).toBe(3);
    });

    it('should handle concurrent requests without data corruption', async () => {
      prisma.agent.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(8)
        .mockResolvedValueOnce(2);
      
      prisma.task.count
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(35)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(40)
        .mockResolvedValueOnce(30)
        .mockResolvedValueOnce(8);
      
      prisma.credit.aggregate
        .mockResolvedValueOnce({ _sum: { balance: 10000 } })
        .mockResolvedValueOnce({ _sum: { balance: 8000 } });
      
      prisma.creditTransaction.count
        .mockResolvedValueOnce(200)
        .mockResolvedValueOnce(150);
      
      prisma.workflowInstance.count
        .mockResolvedValueOnce(15)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(12)
        .mockResolvedValueOnce(4);

      const [result1, result2] = await Promise.all([
        service.getDashboardOverview(),
        service.getDashboardOverview(),
      ]);

      // Results should be independent
      expect(result1.agents.total).toBe(10);
      expect(result2.agents.total).toBe(8);
      expect(result1.tasks.total).toBe(50);
      expect(result2.tasks.total).toBe(40);
    });
  });

  // ============================================
  // Boundary Condition Tests
  // ============================================
  describe('Boundary Conditions', () => {
    it('should handle maximum values correctly', async () => {
      prisma.agent.count
        .mockResolvedValueOnce(Number.MAX_SAFE_INTEGER)
        .mockResolvedValueOnce(0);
      
      prisma.task.count
        .mockResolvedValueOnce(Number.MAX_SAFE_INTEGER)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      
      prisma.credit.aggregate.mockResolvedValue({ _sum: { balance: Number.MAX_SAFE_INTEGER } });
      prisma.creditTransaction.count.mockResolvedValue(Number.MAX_SAFE_INTEGER);
      
      prisma.workflowInstance.count
        .mockResolvedValueOnce(Number.MAX_SAFE_INTEGER)
        .mockResolvedValueOnce(0);

      const result = await service.getDashboardOverview();

      expect(result.agents.total).toBe(Number.MAX_SAFE_INTEGER);
      expect(result.credits.totalBalance).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('should handle edge cases in date calculations', async () => {
      // Tasks at midnight
      const mockTasks = [
        { createdAt: new Date('2024-01-01T00:00:00Z'), status: 'completed', category: 'dev' },
        { createdAt: new Date('2024-01-01T23:59:59Z'), status: 'open', category: 'dev' },
      ];

      prisma.task.findMany.mockResolvedValue(mockTasks);

      const result = await service.getTaskTrends(7);

      // Both should be grouped into same date
      expect(result.data).toHaveLength(1);
      expect(result.data[0].count).toBe(2);
    });

    it('should handle timezone variations in date grouping', async () => {
      // Different timezones but same UTC date
      const mockTasks = [
        { createdAt: new Date('2024-01-01T00:00:00Z'), status: 'completed', category: 'dev' },
        { createdAt: new Date('2024-01-01T12:00:00Z'), status: 'open', category: 'dev' },
        { createdAt: new Date('2024-01-01T23:59:59Z'), status: 'assigned', category: 'dev' },
      ];

      prisma.task.findMany.mockResolvedValue(mockTasks);

      const result = await service.getTaskTrends(7);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].date).toBe('2024-01-01');
    });
  });
});
