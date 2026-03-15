import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../common/prisma/prisma.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prisma: any;

  // Mock PrismaService with all required methods
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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ============================================
  // getDashboardOverview() Tests
  // ============================================
  describe('getDashboardOverview', () => {
    it('should return complete dashboard overview', async () => {
      // Setup mocks
      prisma.agent.count
        .mockResolvedValueOnce(10) // totalAgents
        .mockResolvedValueOnce(3); // activeAgents (idle status)
      
      prisma.task.count
        .mockResolvedValueOnce(50) // totalTasks
        .mockResolvedValueOnce(35) // completedTasks
        .mockResolvedValueOnce(10); // runningTasks (open + assigned)
      
      prisma.credit.aggregate.mockResolvedValue({ _sum: { balance: 10000 } });
      prisma.creditTransaction.count.mockResolvedValue(200);
      
      prisma.workflowInstance.count
        .mockResolvedValueOnce(15) // totalWorkflows
        .mockResolvedValueOnce(5); // runningWorkflows

      const result = await service.getDashboardOverview();

      expect(result).toHaveProperty('agents');
      expect(result).toHaveProperty('tasks');
      expect(result).toHaveProperty('credits');
      expect(result).toHaveProperty('workflows');
      expect(result).toHaveProperty('timestamp');
      
      expect(result.agents).toEqual({
        total: 10,
        active: 3,
        utilizationRate: '70.0', // (10-3)/10 * 100
      });
      
      expect(result.tasks).toEqual({
        total: 50,
        completed: 35,
        running: 10,
        completionRate: '70.0', // 35/50 * 100
      });
      
      expect(result.credits).toEqual({
        totalBalance: 10000,
        totalTransactions: 200,
      });
      
      expect(result.workflows).toEqual({
        total: 15,
        running: 5,
      });
    });

    it('should handle zero agents gracefully', async () => {
      prisma.agent.count
        .mockResolvedValueOnce(0)
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

      expect(result.agents.utilizationRate).toBe(0);
      expect(result.tasks.completionRate).toBe(0);
      expect(result.credits.totalBalance).toBe(0);
    });

    it('should calculate utilization rate correctly', async () => {
      // 8 total agents, 2 idle = 6 busy = 75% utilization
      prisma.agent.count
        .mockResolvedValueOnce(8)
        .mockResolvedValueOnce(2);
      
      prisma.task.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      
      prisma.credit.aggregate.mockResolvedValue({ _sum: { balance: 0 } });
      prisma.creditTransaction.count.mockResolvedValue(0);
      
      prisma.workflowInstance.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      const result = await service.getDashboardOverview();

      expect(result.agents.utilizationRate).toBe('75.0');
    });

    it('should handle parallel database queries', async () => {
      prisma.agent.count
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(2);
      
      prisma.task.count
        .mockResolvedValueOnce(20)
        .mockResolvedValueOnce(15)
        .mockResolvedValueOnce(3);
      
      prisma.credit.aggregate.mockResolvedValue({ _sum: { balance: 5000 } });
      prisma.creditTransaction.count.mockResolvedValue(100);
      
      prisma.workflowInstance.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(4);

      // Should complete without timeout
      const result = await service.getDashboardOverview();
      expect(result).toBeDefined();
    });
  });

  // ============================================
  // getTaskTrends() Tests
  // ============================================
  describe('getTaskTrends', () => {
    it('should return task trends for default 7 days', async () => {
      const mockTasks = [
        { createdAt: new Date('2024-01-01T10:00:00Z'), status: 'completed', category: 'dev' },
        { createdAt: new Date('2024-01-01T14:00:00Z'), status: 'open', category: 'dev' },
        { createdAt: new Date('2024-01-02T10:00:00Z'), status: 'completed', category: 'design' },
        { createdAt: new Date('2024-01-03T10:00:00Z'), status: 'assigned', category: 'dev' },
      ];

      prisma.task.findMany.mockResolvedValue(mockTasks);

      const result = await service.getTaskTrends();

      expect(result.period).toBe('7 days');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total');
      expect(result.total).toBe(4);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should return task trends for custom days', async () => {
      const mockTasks = [
        { createdAt: new Date('2024-01-01T10:00:00Z'), status: 'completed', category: 'dev' },
        { createdAt: new Date('2024-01-05T10:00:00Z'), status: 'open', category: 'dev' },
      ];

      prisma.task.findMany.mockResolvedValue(mockTasks);

      const result = await service.getTaskTrends(14);

      expect(result.period).toBe('14 days');
      expect(result.total).toBe(2);
    });

    it('should group tasks by date correctly', async () => {
      const mockTasks = [
        { createdAt: new Date('2024-01-01T08:00:00Z'), status: 'completed', category: 'dev' },
        { createdAt: new Date('2024-01-01T12:00:00Z'), status: 'open', category: 'dev' },
        { createdAt: new Date('2024-01-01T16:00:00Z'), status: 'completed', category: 'design' },
        { createdAt: new Date('2024-01-02T10:00:00Z'), status: 'open', category: 'dev' },
      ];

      prisma.task.findMany.mockResolvedValue(mockTasks);

      const result = await service.getTaskTrends(7);

      // Should have 2 date groups
      const jan1Group = result.data.find((d: any) => d.date === '2024-01-01');
      const jan2Group = result.data.find((d: any) => d.date === '2024-01-02');

      expect(jan1Group).toBeDefined();
      expect(jan1Group!.count).toBe(3);
      expect(jan2Group).toBeDefined();
      expect(jan2Group!.count).toBe(1);
    });

    it('should sort data by date ascending', async () => {
      const mockTasks = [
        { createdAt: new Date('2024-01-05T10:00:00Z'), status: 'completed', category: 'dev' },
        { createdAt: new Date('2024-01-01T10:00:00Z'), status: 'open', category: 'dev' },
        { createdAt: new Date('2024-01-03T10:00:00Z'), status: 'assigned', category: 'dev' },
      ];

      prisma.task.findMany.mockResolvedValue(mockTasks);

      const result = await service.getTaskTrends(7);

      // Verify ascending order
      for (let i = 1; i < result.data.length; i++) {
        expect(result.data[i].date >= result.data[i - 1].date).toBe(true);
      }
    });

    it('should return empty data when no tasks exist', async () => {
      prisma.task.findMany.mockResolvedValue([]);

      const result = await service.getTaskTrends(7);

      expect(result.total).toBe(0);
      expect(result.data).toEqual([]);
    });

    it('should query with correct date filter', async () => {
      prisma.task.findMany.mockResolvedValue([]);

      await service.getTaskTrends(30);

      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
            }),
          },
          select: {
            createdAt: true,
            status: true,
            category: true,
          },
          orderBy: { createdAt: 'asc' },
        })
      );
    });
  });

  // ============================================
  // getAgentPerformance() Tests
  // ============================================
  describe('getAgentPerformance', () => {
    it('should return agent performance metrics', async () => {
      const mockAgents = [
        {
          id: 'agent-1',
          name: 'Agent One',
          status: 'idle',
          trustScore: 95,
          _count: { assignedTasks: 10 },
        },
        {
          id: 'agent-2',
          name: 'Agent Two',
          status: 'busy',
          trustScore: 85,
          _count: { assignedTasks: 8 },
        },
      ];

      prisma.agent.findMany.mockResolvedValue(mockAgents);
      prisma.task.count
        .mockResolvedValueOnce(8) // agent-1 completed tasks
        .mockResolvedValueOnce(6); // agent-2 completed tasks

      const result = await service.getAgentPerformance();

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('status');
      expect(result[0]).toHaveProperty('trustScore');
      expect(result[0]).toHaveProperty('totalTasks');
      expect(result[0]).toHaveProperty('completedTasks');
      expect(result[0]).toHaveProperty('completionRate');
    });

    it('should limit results to specified number', async () => {
      const mockAgents = Array(5).fill(null).map((_, i) => ({
        id: `agent-${i}`,
        name: `Agent ${i}`,
        status: 'idle',
        trustScore: 90 - i * 5,
        _count: { assignedTasks: 10 },
      }));

      prisma.agent.findMany.mockResolvedValue(mockAgents);
      prisma.task.count.mockResolvedValue(5);

      await service.getAgentPerformance(5);

      expect(prisma.agent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
        })
      );
    });

    it('should sort agents by trustScore descending', async () => {
      const mockAgents = [
        { id: 'agent-1', name: 'High', status: 'idle', trustScore: 95, _count: { assignedTasks: 5 } },
        { id: 'agent-2', name: 'Low', status: 'idle', trustScore: 60, _count: { assignedTasks: 5 } },
      ];

      prisma.agent.findMany.mockResolvedValue(mockAgents);
      prisma.task.count.mockResolvedValue(3);

      await service.getAgentPerformance(10);

      expect(prisma.agent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { trustScore: 'desc' },
        })
      );
    });

    it('should calculate completion rate correctly', async () => {
      const mockAgents = [
        {
          id: 'agent-1',
          name: 'Agent One',
          status: 'idle',
          trustScore: 90,
          _count: { assignedTasks: 10 },
        },
      ];

      prisma.agent.findMany.mockResolvedValue(mockAgents);
      prisma.task.count.mockResolvedValueOnce(7); // 7 completed out of 10

      const result = await service.getAgentPerformance();

      expect(result[0].completionRate).toBe('70.0');
    });

    it('should handle zero assigned tasks', async () => {
      const mockAgents = [
        {
          id: 'agent-1',
          name: 'New Agent',
          status: 'idle',
          trustScore: 50,
          _count: { assignedTasks: 0 },
        },
      ];

      prisma.agent.findMany.mockResolvedValue(mockAgents);
      prisma.task.count.mockResolvedValueOnce(0);

      const result = await service.getAgentPerformance();

      expect(result[0].completionRate).toBe(0);
    });

    it('should return empty array when no agents exist', async () => {
      prisma.agent.findMany.mockResolvedValue([]);

      const result = await service.getAgentPerformance();

      expect(result).toEqual([]);
    });

    it('should use default limit of 10', async () => {
      prisma.agent.findMany.mockResolvedValue([]);

      await service.getAgentPerformance();

      expect(prisma.agent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        })
      );
    });
  });

  // ============================================
  // getCategoryDistribution() Tests
  // ============================================
  describe('getCategoryDistribution', () => {
    it('should return category distribution', async () => {
      const mockTasks = [
        { category: 'development' },
        { category: 'development' },
        { category: 'design' },
        { category: 'development' },
        { category: 'design' },
        { category: 'testing' },
      ];

      prisma.task.findMany.mockResolvedValue(mockTasks);

      const result = await service.getCategoryDistribution();

      expect(result).toHaveLength(3);
      expect(result.find((c: any) => c.category === 'development')?.count).toBe(3);
      expect(result.find((c: any) => c.category === 'design')?.count).toBe(2);
      expect(result.find((c: any) => c.category === 'testing')?.count).toBe(1);
    });

    it('should sort by count descending', async () => {
      const mockTasks = [
        { category: 'design' },
        { category: 'development' },
        { category: 'development' },
        { category: 'development' },
        { category: 'testing' },
      ];

      prisma.task.findMany.mockResolvedValue(mockTasks);

      const result = await service.getCategoryDistribution();

      expect(result[0].category).toBe('development');
      expect(result[0].count).toBe(3);
    });

    it('should handle null categories as uncategorized', async () => {
      const mockTasks = [
        { category: 'development' },
        { category: null },
        { category: null },
      ];

      prisma.task.findMany.mockResolvedValue(mockTasks);

      const result = await service.getCategoryDistribution();

      expect(result.find((c: any) => c.category === 'uncategorized')?.count).toBe(2);
    });

    it('should return empty array when no tasks exist', async () => {
      prisma.task.findMany.mockResolvedValue([]);

      const result = await service.getCategoryDistribution();

      expect(result).toEqual([]);
    });

    it('should exclude tasks with null category from filter', async () => {
      prisma.task.findMany.mockResolvedValue([]);

      await service.getCategoryDistribution();

      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { category: { not: null } },
        })
      );
    });
  });

  // ============================================
  // getWorkflowStatistics() Tests
  // ============================================
  describe('getWorkflowStatistics', () => {
    it('should return workflow statistics', async () => {
      const mockInstances = [
        { status: 'completed', templateId: 'template-1', startedAt: new Date('2024-01-01T10:00:00Z'), completedAt: new Date('2024-01-01T11:00:00Z') },
        { status: 'completed', templateId: 'template-1', startedAt: new Date('2024-01-02T10:00:00Z'), completedAt: new Date('2024-01-02T10:30:00Z') },
        { status: 'running', templateId: 'template-2', startedAt: new Date('2024-01-03T10:00:00Z'), completedAt: null },
        { status: 'failed', templateId: 'template-1', startedAt: new Date('2024-01-04T10:00:00Z'), completedAt: new Date('2024-01-04T10:15:00Z') },
      ];

      prisma.workflowInstance.findMany.mockResolvedValue(mockInstances);

      const result = await service.getWorkflowStatistics();

      expect(result).toHaveProperty('byStatus');
      expect(result).toHaveProperty('byTemplate');
      expect(result).toHaveProperty('avgDuration');
      expect(result).toHaveProperty('total');
      expect(result.total).toBe(4);
    });

    it('should group by status correctly', async () => {
      const mockInstances = [
        { status: 'completed', templateId: 'template-1', startedAt: new Date(), completedAt: new Date() },
        { status: 'completed', templateId: 'template-2', startedAt: new Date(), completedAt: new Date() },
        { status: 'running', templateId: 'template-1', startedAt: new Date(), completedAt: null },
      ];

      prisma.workflowInstance.findMany.mockResolvedValue(mockInstances);

      const result = await service.getWorkflowStatistics();

      const completedStatus = result.byStatus.find((s: any) => s.status === 'completed');
      const runningStatus = result.byStatus.find((s: any) => s.status === 'running');

      expect(completedStatus?.count).toBe(2);
      expect(runningStatus?.count).toBe(1);
    });

    it('should group by template correctly', async () => {
      const mockInstances = [
        { status: 'completed', templateId: 'template-1', startedAt: new Date(), completedAt: new Date() },
        { status: 'completed', templateId: 'template-1', startedAt: new Date(), completedAt: new Date() },
        { status: 'running', templateId: 'template-2', startedAt: new Date(), completedAt: null },
      ];

      prisma.workflowInstance.findMany.mockResolvedValue(mockInstances);

      const result = await service.getWorkflowStatistics();

      const template1 = result.byTemplate.find((t: any) => t.templateId === 'template-1');
      const template2 = result.byTemplate.find((t: any) => t.templateId === 'template-2');

      expect(template1?.count).toBe(2);
      expect(template2?.count).toBe(1);
    });

    it('should calculate average duration correctly', async () => {
      const mockInstances = [
        { status: 'completed', templateId: 'template-1', startedAt: new Date('2024-01-01T10:00:00Z'), completedAt: new Date('2024-01-01T11:00:00Z') }, // 1 hour = 3600 seconds
        { status: 'completed', templateId: 'template-1', startedAt: new Date('2024-01-02T10:00:00Z'), completedAt: new Date('2024-01-02T10:30:00Z') }, // 30 min = 1800 seconds
      ];

      prisma.workflowInstance.findMany.mockResolvedValue(mockInstances);

      const result = await service.getWorkflowStatistics();

      // Average: (3600 + 1800) / 2 = 2700 seconds
      expect(result.avgDuration).toBe(2700);
    });

    it('should return 0 avgDuration when no completed instances', async () => {
      const mockInstances = [
        { status: 'running', templateId: 'template-1', startedAt: new Date(), completedAt: null },
      ];

      prisma.workflowInstance.findMany.mockResolvedValue(mockInstances);

      const result = await service.getWorkflowStatistics();

      expect(result.avgDuration).toBe(0);
    });

    it('should handle empty instances', async () => {
      prisma.workflowInstance.findMany.mockResolvedValue([]);

      const result = await service.getWorkflowStatistics();

      expect(result.total).toBe(0);
      expect(result.byStatus).toEqual([]);
      expect(result.byTemplate).toEqual([]);
      expect(result.avgDuration).toBe(0);
    });

    it('should handle instances without startedAt or completedAt', async () => {
      const mockInstances = [
        { status: 'completed', templateId: 'template-1', startedAt: null, completedAt: new Date() },
        { status: 'completed', templateId: 'template-2', startedAt: new Date(), completedAt: null },
      ];

      prisma.workflowInstance.findMany.mockResolvedValue(mockInstances);

      const result = await service.getWorkflowStatistics();

      // Should not include in avgDuration calculation
      expect(result.avgDuration).toBe(0);
    });
  });

  // ============================================
  // getCreditFlow() Tests
  // ============================================
  describe('getCreditFlow', () => {
    it('should return credit flow for default 30 days', async () => {
      const mockTransactions = [
        { type: 'earn', amount: 100, createdAt: new Date('2024-01-01T10:00:00Z') },
        { type: 'spend', amount: 50, createdAt: new Date('2024-01-02T10:00:00Z') },
        { type: 'earn', amount: 200, createdAt: new Date('2024-01-03T10:00:00Z') },
      ];

      prisma.creditTransaction.findMany.mockResolvedValue(mockTransactions);

      const result = await service.getCreditFlow();

      expect(result.period).toBe('30 days');
      expect(result).toHaveProperty('byType');
      expect(result).toHaveProperty('byDate');
    });

    it('should return credit flow for custom days', async () => {
      const mockTransactions = [
        { type: 'earn', amount: 100, createdAt: new Date() },
      ];

      prisma.creditTransaction.findMany.mockResolvedValue(mockTransactions);

      const result = await service.getCreditFlow(7);

      expect(result.period).toBe('7 days');
    });

    it('should group by transaction type correctly', async () => {
      const mockTransactions = [
        { type: 'earn', amount: 100, createdAt: new Date() },
        { type: 'earn', amount: 200, createdAt: new Date() },
        { type: 'spend', amount: 50, createdAt: new Date() },
        { type: 'transfer', amount: 75, createdAt: new Date() },
      ];

      prisma.creditTransaction.findMany.mockResolvedValue(mockTransactions);

      const result = await service.getCreditFlow();

      const earnType = result.byType.find((t: any) => t.type === 'earn');
      const spendType = result.byType.find((t: any) => t.type === 'spend');
      const transferType = result.byType.find((t: any) => t.type === 'transfer');

      expect(earnType).toEqual({ type: 'earn', count: 2, total: 300 });
      expect(spendType).toEqual({ type: 'spend', count: 1, total: 50 });
      expect(transferType).toEqual({ type: 'transfer', count: 1, total: 75 });
    });

    it('should group by date correctly', async () => {
      const mockTransactions = [
        { type: 'earn', amount: 100, createdAt: new Date('2024-01-01T10:00:00Z') },
        { type: 'earn', amount: 200, createdAt: new Date('2024-01-01T14:00:00Z') },
        { type: 'spend', amount: 50, createdAt: new Date('2024-01-02T10:00:00Z') },
      ];

      prisma.creditTransaction.findMany.mockResolvedValue(mockTransactions);

      const result = await service.getCreditFlow();

      const jan1 = result.byDate.find((d: any) => d.date === '2024-01-01');
      const jan2 = result.byDate.find((d: any) => d.date === '2024-01-02');

      expect(jan1).toBeDefined();
      expect(jan1.count).toBe(2);
      expect(jan1.value).toBe(300);
      expect(jan2).toBeDefined();
      expect(jan2.count).toBe(1);
      expect(jan2.value).toBe(50);
    });

    it('should handle empty transactions', async () => {
      prisma.creditTransaction.findMany.mockResolvedValue([]);

      const result = await service.getCreditFlow();

      expect(result.byType).toEqual([]);
      expect(result.byDate).toEqual([]);
    });

    it('should query with correct date filter', async () => {
      prisma.creditTransaction.findMany.mockResolvedValue([]);

      await service.getCreditFlow(14);

      expect(prisma.creditTransaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
            }),
          },
        })
      );
    });
  });

  // ============================================
  // getRealTimeMetrics() Tests
  // ============================================
  describe('getRealTimeMetrics', () => {
    it('should return real-time metrics', async () => {
      prisma.agent.count.mockResolvedValue(5);
      prisma.task.count.mockResolvedValue(12);
      prisma.creditTransaction.count.mockResolvedValue(30);
      prisma.workflowInstance.count.mockResolvedValue(3);

      const result = await service.getRealTimeMetrics();

      expect(result).toHaveProperty('activeAgentsLastHour');
      expect(result).toHaveProperty('tasksCreatedLastDay');
      expect(result).toHaveProperty('transactionsLastDay');
      expect(result).toHaveProperty('activeWorkflows');
      expect(result).toHaveProperty('timestamp');
      
      expect(result.activeAgentsLastHour).toBe(5);
      expect(result.tasksCreatedLastDay).toBe(12);
      expect(result.transactionsLastDay).toBe(30);
      expect(result.activeWorkflows).toBe(3);
    });

    it('should return valid ISO timestamp', async () => {
      prisma.agent.count.mockResolvedValue(0);
      prisma.task.count.mockResolvedValue(0);
      prisma.creditTransaction.count.mockResolvedValue(0);
      prisma.workflowInstance.count.mockResolvedValue(0);

      const result = await service.getRealTimeMetrics();

      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should query agents with lastSeen filter', async () => {
      prisma.agent.count.mockResolvedValue(0);
      prisma.task.count.mockResolvedValue(0);
      prisma.creditTransaction.count.mockResolvedValue(0);
      prisma.workflowInstance.count.mockResolvedValue(0);

      await service.getRealTimeMetrics();

      expect(prisma.agent.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            lastSeen: expect.objectContaining({
              gte: expect.any(Date),
            }),
          },
        })
      );
    });

    it('should query tasks with createdAt filter', async () => {
      prisma.agent.count.mockResolvedValue(0);
      prisma.task.count.mockResolvedValue(0);
      prisma.creditTransaction.count.mockResolvedValue(0);
      prisma.workflowInstance.count.mockResolvedValue(0);

      await service.getRealTimeMetrics();

      expect(prisma.task.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
            }),
          },
        })
      );
    });

    it('should query workflow instances with running status', async () => {
      prisma.agent.count.mockResolvedValue(0);
      prisma.task.count.mockResolvedValue(0);
      prisma.creditTransaction.count.mockResolvedValue(0);
      prisma.workflowInstance.count.mockResolvedValue(0);

      await service.getRealTimeMetrics();

      expect(prisma.workflowInstance.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'running' },
        })
      );
    });

    it('should handle all zero counts', async () => {
      prisma.agent.count.mockResolvedValue(0);
      prisma.task.count.mockResolvedValue(0);
      prisma.creditTransaction.count.mockResolvedValue(0);
      prisma.workflowInstance.count.mockResolvedValue(0);

      const result = await service.getRealTimeMetrics();

      expect(result.activeAgentsLastHour).toBe(0);
      expect(result.tasksCreatedLastDay).toBe(0);
      expect(result.transactionsLastDay).toBe(0);
      expect(result.activeWorkflows).toBe(0);
    });
  });

  // ============================================
  // Edge Cases and Error Handling
  // ============================================
  describe('Edge Cases and Error Handling', () => {
    it('should handle database errors in getDashboardOverview', async () => {
      prisma.agent.count.mockRejectedValue(new Error('Database error'));

      await expect(service.getDashboardOverview()).rejects.toThrow('Database error');
    });

    it('should handle database errors in getTaskTrends', async () => {
      prisma.task.findMany.mockRejectedValue(new Error('Query failed'));

      await expect(service.getTaskTrends()).rejects.toThrow('Query failed');
    });

    it('should handle database errors in getAgentPerformance', async () => {
      prisma.agent.findMany.mockRejectedValue(new Error('Connection lost'));

      await expect(service.getAgentPerformance()).rejects.toThrow('Connection lost');
    });

    it('should handle database errors in getCategoryDistribution', async () => {
      prisma.task.findMany.mockRejectedValue(new Error('Timeout'));

      await expect(service.getCategoryDistribution()).rejects.toThrow('Timeout');
    });

    it('should handle database errors in getWorkflowStatistics', async () => {
      prisma.workflowInstance.findMany.mockRejectedValue(new Error('Server error'));

      await expect(service.getWorkflowStatistics()).rejects.toThrow('Server error');
    });

    it('should handle database errors in getCreditFlow', async () => {
      prisma.creditTransaction.findMany.mockRejectedValue(new Error('Network error'));

      await expect(service.getCreditFlow()).rejects.toThrow('Network error');
    });

    it('should handle database errors in getRealTimeMetrics', async () => {
      prisma.agent.count.mockRejectedValue(new Error('Service unavailable'));

      await expect(service.getRealTimeMetrics()).rejects.toThrow('Service unavailable');
    });
  });

  // ============================================
  // Private Helper Method Tests (via public methods)
  // ============================================
  describe('groupByDate helper', () => {
    it('should correctly group data with value extraction', async () => {
      const mockTransactions = [
        { type: 'earn', amount: 100, createdAt: new Date('2024-01-01T10:00:00Z') },
        { type: 'earn', amount: 200, createdAt: new Date('2024-01-01T14:00:00Z') },
      ];

      prisma.creditTransaction.findMany.mockResolvedValue(mockTransactions);

      const result = await service.getCreditFlow();

      // value extraction should sum amounts
      expect(result.byDate[0].value).toBe(300);
    });

    it('should correctly group data without value extraction', async () => {
      const mockTasks = [
        { createdAt: new Date('2024-01-01T10:00:00Z'), status: 'completed', category: 'dev' },
        { createdAt: new Date('2024-01-01T14:00:00Z'), status: 'open', category: 'design' },
      ];

      prisma.task.findMany.mockResolvedValue(mockTasks);

      const result = await service.getTaskTrends();

      // should only have count, not value
      expect(result.data[0].count).toBe(2);
      expect(result.data[0].value).toBeUndefined();
    });
  });
});
