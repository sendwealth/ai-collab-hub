import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let service: AnalyticsService;

  const mockAnalyticsService = {
    getDashboardOverview: jest.fn(),
    getTaskTrends: jest.fn(),
    getAgentPerformance: jest.fn(),
    getCategoryDistribution: jest.fn(),
    getWorkflowStatistics: jest.fn(),
    getCreditFlow: jest.fn(),
    getRealTimeMetrics: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        {
          provide: AnalyticsService,
          useValue: mockAnalyticsService,
        },
      ],
    }).compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
    service = module.get<AnalyticsService>(AnalyticsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ============================================
  // GET /api/v1/analytics/dashboard
  // ============================================
  describe('getDashboardOverview', () => {
    it('should return dashboard overview', async () => {
      const mockDashboard = {
        agents: { total: 10, active: 3, utilizationRate: '70.0' },
        tasks: { total: 50, completed: 35, running: 10, completionRate: '70.0' },
        credits: { totalBalance: 10000, totalTransactions: 200 },
        workflows: { total: 15, running: 5 },
        timestamp: '2024-01-01T10:00:00Z',
      };

      mockAnalyticsService.getDashboardOverview.mockResolvedValue(mockDashboard);

      const result = await controller.getDashboardOverview();

      expect(result).toEqual(mockDashboard);
      expect(service.getDashboardOverview).toHaveBeenCalledTimes(1);
    });

    it('should handle service errors', async () => {
      mockAnalyticsService.getDashboardOverview.mockRejectedValue(
        new Error('Service error')
      );

      await expect(controller.getDashboardOverview()).rejects.toThrow('Service error');
    });
  });

  // ============================================
  // GET /api/v1/analytics/tasks/trends
  // ============================================
  describe('getTaskTrends', () => {
    it('should return task trends with default days', async () => {
      const mockTrends = {
        period: '7 days',
        data: [
          { date: '2024-01-01', count: 5 },
          { date: '2024-01-02', count: 8 },
        ],
        total: 13,
      };

      mockAnalyticsService.getTaskTrends.mockResolvedValue(mockTrends);

      const result = await controller.getTaskTrends();

      expect(result).toEqual(mockTrends);
      expect(service.getTaskTrends).toHaveBeenCalledWith(7);
    });

    it('should return task trends with custom days', async () => {
      const mockTrends = {
        period: '30 days',
        data: [],
        total: 50,
      };

      mockAnalyticsService.getTaskTrends.mockResolvedValue(mockTrends);

      const result = await controller.getTaskTrends('30');

      expect(result).toEqual(mockTrends);
      expect(service.getTaskTrends).toHaveBeenCalledWith(30);
    });

    it('should handle string to number conversion', async () => {
      mockAnalyticsService.getTaskTrends.mockResolvedValue({ period: '14 days', data: [], total: 0 });

      await controller.getTaskTrends('14');

      expect(service.getTaskTrends).toHaveBeenCalledWith(14);
    });

    it('should handle undefined days parameter', async () => {
      mockAnalyticsService.getTaskTrends.mockResolvedValue({ period: '7 days', data: [], total: 0 });

      await controller.getTaskTrends(undefined);

      expect(service.getTaskTrends).toHaveBeenCalledWith(7);
    });

    it('should handle empty string days parameter', async () => {
      mockAnalyticsService.getTaskTrends.mockResolvedValue({ period: '7 days', data: [], total: 0 });

      await controller.getTaskTrends('');

      // Empty string parseInt returns NaN, which should fallback to default
      expect(service.getTaskTrends).toHaveBeenCalledWith(7);
    });

    it('should handle service errors', async () => {
      mockAnalyticsService.getTaskTrends.mockRejectedValue(
        new Error('Query failed')
      );

      await expect(controller.getTaskTrends('7')).rejects.toThrow('Query failed');
    });
  });

  // ============================================
  // GET /api/v1/analytics/agents/performance
  // ============================================
  describe('getAgentPerformance', () => {
    it('should return agent performance with default limit', async () => {
      const mockPerformance = [
        { id: 'agent-1', name: 'Agent One', status: 'idle', trustScore: 95, totalTasks: 10, completedTasks: 8, completionRate: '80.0' },
        { id: 'agent-2', name: 'Agent Two', status: 'busy', trustScore: 85, totalTasks: 8, completedTasks: 6, completionRate: '75.0' },
      ];

      mockAnalyticsService.getAgentPerformance.mockResolvedValue(mockPerformance);

      const result = await controller.getAgentPerformance();

      expect(result).toEqual(mockPerformance);
      expect(service.getAgentPerformance).toHaveBeenCalledWith(10);
    });

    it('should return agent performance with custom limit', async () => {
      const mockPerformance = [
        { id: 'agent-1', name: 'Agent One', status: 'idle', trustScore: 95 },
      ];

      mockAnalyticsService.getAgentPerformance.mockResolvedValue(mockPerformance);

      const result = await controller.getAgentPerformance('5');

      expect(result).toEqual(mockPerformance);
      expect(service.getAgentPerformance).toHaveBeenCalledWith(5);
    });

    it('should handle string to number conversion', async () => {
      mockAnalyticsService.getAgentPerformance.mockResolvedValue([]);

      await controller.getAgentPerformance('20');

      expect(service.getAgentPerformance).toHaveBeenCalledWith(20);
    });

    it('should handle undefined limit parameter', async () => {
      mockAnalyticsService.getAgentPerformance.mockResolvedValue([]);

      await controller.getAgentPerformance(undefined);

      expect(service.getAgentPerformance).toHaveBeenCalledWith(10);
    });

    it('should handle empty string limit parameter', async () => {
      mockAnalyticsService.getAgentPerformance.mockResolvedValue([]);

      await controller.getAgentPerformance('');

      expect(service.getAgentPerformance).toHaveBeenCalledWith(10);
    });

    it('should handle service errors', async () => {
      mockAnalyticsService.getAgentPerformance.mockRejectedValue(
        new Error('Database error')
      );

      await expect(controller.getAgentPerformance()).rejects.toThrow('Database error');
    });
  });

  // ============================================
  // GET /api/v1/analytics/tasks/categories
  // ============================================
  describe('getCategoryDistribution', () => {
    it('should return category distribution', async () => {
      const mockDistribution = [
        { category: 'development', count: 15 },
        { category: 'design', count: 10 },
        { category: 'testing', count: 5 },
      ];

      mockAnalyticsService.getCategoryDistribution.mockResolvedValue(mockDistribution);

      const result = await controller.getCategoryDistribution();

      expect(result).toEqual(mockDistribution);
      expect(service.getCategoryDistribution).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no categories', async () => {
      mockAnalyticsService.getCategoryDistribution.mockResolvedValue([]);

      const result = await controller.getCategoryDistribution();

      expect(result).toEqual([]);
    });

    it('should handle service errors', async () => {
      mockAnalyticsService.getCategoryDistribution.mockRejectedValue(
        new Error('Query timeout')
      );

      await expect(controller.getCategoryDistribution()).rejects.toThrow('Query timeout');
    });
  });

  // ============================================
  // GET /api/v1/analytics/workflows/statistics
  // ============================================
  describe('getWorkflowStatistics', () => {
    it('should return workflow statistics', async () => {
      const mockStats = {
        byStatus: [
          { status: 'completed', count: 20 },
          { status: 'running', count: 5 },
          { status: 'failed', count: 2 },
        ],
        byTemplate: [
          { templateId: 'template-1', count: 15 },
          { templateId: 'template-2', count: 12 },
        ],
        avgDuration: 1800,
        total: 27,
      };

      mockAnalyticsService.getWorkflowStatistics.mockResolvedValue(mockStats);

      const result = await controller.getWorkflowStatistics();

      expect(result).toEqual(mockStats);
      expect(service.getWorkflowStatistics).toHaveBeenCalledTimes(1);
    });

    it('should return empty statistics when no workflows', async () => {
      const mockStats = {
        byStatus: [],
        byTemplate: [],
        avgDuration: 0,
        total: 0,
      };

      mockAnalyticsService.getWorkflowStatistics.mockResolvedValue(mockStats);

      const result = await controller.getWorkflowStatistics();

      expect(result).toEqual(mockStats);
    });

    it('should handle service errors', async () => {
      mockAnalyticsService.getWorkflowStatistics.mockRejectedValue(
        new Error('Connection lost')
      );

      await expect(controller.getWorkflowStatistics()).rejects.toThrow('Connection lost');
    });
  });

  // ============================================
  // GET /api/v1/analytics/credits/flow
  // ============================================
  describe('getCreditFlow', () => {
    it('should return credit flow with default days', async () => {
      const mockFlow = {
        period: '30 days',
        byType: [
          { type: 'earn', count: 50, total: 5000 },
          { type: 'spend', count: 30, total: 3000 },
        ],
        byDate: [
          { date: '2024-01-01', count: 5, value: 500 },
          { date: '2024-01-02', count: 3, value: 300 },
        ],
      };

      mockAnalyticsService.getCreditFlow.mockResolvedValue(mockFlow);

      const result = await controller.getCreditFlow();

      expect(result).toEqual(mockFlow);
      expect(service.getCreditFlow).toHaveBeenCalledWith(30);
    });

    it('should return credit flow with custom days', async () => {
      const mockFlow = {
        period: '7 days',
        byType: [],
        byDate: [],
      };

      mockAnalyticsService.getCreditFlow.mockResolvedValue(mockFlow);

      const result = await controller.getCreditFlow('7');

      expect(result).toEqual(mockFlow);
      expect(service.getCreditFlow).toHaveBeenCalledWith(7);
    });

    it('should handle string to number conversion', async () => {
      mockAnalyticsService.getCreditFlow.mockResolvedValue({ period: '14 days', byType: [], byDate: [] });

      await controller.getCreditFlow('14');

      expect(service.getCreditFlow).toHaveBeenCalledWith(14);
    });

    it('should handle undefined days parameter', async () => {
      mockAnalyticsService.getCreditFlow.mockResolvedValue({ period: '30 days', byType: [], byDate: [] });

      await controller.getCreditFlow(undefined);

      expect(service.getCreditFlow).toHaveBeenCalledWith(30);
    });

    it('should handle empty string days parameter', async () => {
      mockAnalyticsService.getCreditFlow.mockResolvedValue({ period: '30 days', byType: [], byDate: [] });

      await controller.getCreditFlow('');

      expect(service.getCreditFlow).toHaveBeenCalledWith(30);
    });

    it('should handle service errors', async () => {
      mockAnalyticsService.getCreditFlow.mockRejectedValue(
        new Error('Network error')
      );

      await expect(controller.getCreditFlow()).rejects.toThrow('Network error');
    });
  });

  // ============================================
  // GET /api/v1/analytics/realtime
  // ============================================
  describe('getRealTimeMetrics', () => {
    it('should return real-time metrics', async () => {
      const mockMetrics = {
        activeAgentsLastHour: 5,
        tasksCreatedLastDay: 12,
        transactionsLastDay: 30,
        activeWorkflows: 3,
        timestamp: '2024-01-01T10:00:00Z',
      };

      mockAnalyticsService.getRealTimeMetrics.mockResolvedValue(mockMetrics);

      const result = await controller.getRealTimeMetrics();

      expect(result).toEqual(mockMetrics);
      expect(service.getRealTimeMetrics).toHaveBeenCalledTimes(1);
    });

    it('should return zero metrics when no activity', async () => {
      const mockMetrics = {
        activeAgentsLastHour: 0,
        tasksCreatedLastDay: 0,
        transactionsLastDay: 0,
        activeWorkflows: 0,
        timestamp: expect.any(String),
      };

      mockAnalyticsService.getRealTimeMetrics.mockResolvedValue(mockMetrics);

      const result = await controller.getRealTimeMetrics();

      expect(result.activeAgentsLastHour).toBe(0);
      expect(result.tasksCreatedLastDay).toBe(0);
      expect(result.transactionsLastDay).toBe(0);
      expect(result.activeWorkflows).toBe(0);
    });

    it('should handle service errors', async () => {
      mockAnalyticsService.getRealTimeMetrics.mockRejectedValue(
        new Error('Service unavailable')
      );

      await expect(controller.getRealTimeMetrics()).rejects.toThrow('Service unavailable');
    });
  });

  // ============================================
  // Integration-like Tests (Controller + Service interaction)
  // ============================================
  describe('Controller-Service Integration', () => {
    it('should pass correct parameters to service methods', async () => {
      mockAnalyticsService.getTaskTrends.mockResolvedValue({ period: '7 days', data: [], total: 0 });
      mockAnalyticsService.getAgentPerformance.mockResolvedValue([]);
      mockAnalyticsService.getCreditFlow.mockResolvedValue({ period: '30 days', byType: [], byDate: [] });

      await controller.getTaskTrends('14');
      await controller.getAgentPerformance('25');
      await controller.getCreditFlow('60');

      expect(service.getTaskTrends).toHaveBeenCalledWith(14);
      expect(service.getAgentPerformance).toHaveBeenCalledWith(25);
      expect(service.getCreditFlow).toHaveBeenCalledWith(60);
    });

    it('should handle multiple concurrent requests', async () => {
      mockAnalyticsService.getDashboardOverview.mockResolvedValue({});
      mockAnalyticsService.getRealTimeMetrics.mockResolvedValue({});
      mockAnalyticsService.getCategoryDistribution.mockResolvedValue([]);

      const results = await Promise.all([
        controller.getDashboardOverview(),
        controller.getRealTimeMetrics(),
        controller.getCategoryDistribution(),
      ]);

      expect(results).toHaveLength(3);
      expect(service.getDashboardOverview).toHaveBeenCalledTimes(1);
      expect(service.getRealTimeMetrics).toHaveBeenCalledTimes(1);
      expect(service.getCategoryDistribution).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================
  // Input Validation Tests
  // ============================================
  describe('Input Validation', () => {
    it('should handle non-numeric string for days parameter', async () => {
      mockAnalyticsService.getTaskTrends.mockResolvedValue({ period: '7 days', data: [], total: 0 });

      await controller.getTaskTrends('invalid');

      // NaN should fallback to default 7
      expect(service.getTaskTrends).toHaveBeenCalledWith(7);
    });

    it('should handle negative numbers for days parameter', async () => {
      mockAnalyticsService.getTaskTrends.mockResolvedValue({ period: '-5 days', data: [], total: 0 });

      await controller.getTaskTrends('-5');

      expect(service.getTaskTrends).toHaveBeenCalledWith(-5);
    });

    it('should handle non-numeric string for limit parameter', async () => {
      mockAnalyticsService.getAgentPerformance.mockResolvedValue([]);

      await controller.getAgentPerformance('invalid');

      // NaN should fallback to default 10
      expect(service.getAgentPerformance).toHaveBeenCalledWith(10);
    });

    it('should handle decimal numbers for limit parameter', async () => {
      mockAnalyticsService.getAgentPerformance.mockResolvedValue([]);

      await controller.getAgentPerformance('10.5');

      // parseInt will truncate to 10
      expect(service.getAgentPerformance).toHaveBeenCalledWith(10);
    });
  });
});
