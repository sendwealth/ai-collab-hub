import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get dashboard overview
   */
  async getDashboardOverview() {
    const [
      totalAgents,
      activeAgents,
      totalTasks,
      completedTasks,
      runningTasks,
      totalCredits,
      totalTransactions,
      totalWorkflows,
      runningWorkflows,
    ] = await Promise.all([
      this.prisma.agent.count(),
      this.prisma.agent.count({ where: { status: 'idle' } }),
      this.prisma.task.count(),
      this.prisma.task.count({ where: { status: 'completed' } }),
      this.prisma.task.count({ where: { status: { in: ['open', 'assigned'] } } }),
      this.prisma.credit.aggregate({ _sum: { balance: true } }),
      this.prisma.creditTransaction.count(),
      this.prisma.workflowInstance.count(),
      this.prisma.workflowInstance.count({ where: { status: 'running' } }),
    ]);

    return {
      agents: {
        total: totalAgents,
        active: activeAgents,
        utilizationRate: totalAgents > 0 ? ((totalAgents - activeAgents) / totalAgents * 100).toFixed(1) : 0,
      },
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        running: runningTasks,
        completionRate: totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(1) : 0,
      },
      credits: {
        totalBalance: totalCredits._sum.balance || 0,
        totalTransactions,
      },
      workflows: {
        total: totalWorkflows,
        running: runningWorkflows,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get task trends
   */
  async getTaskTrends(days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const tasks = await this.prisma.task.findMany({
      where: {
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
        status: true,
        category: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const trends = this.groupByDate(tasks, 'createdAt');

    return {
      period: `${days} days`,
      data: trends,
      total: tasks.length,
    };
  }

  /**
   * Get agent performance
   */
  async getAgentPerformance(limit: number = 10) {
    const agents = await this.prisma.agent.findMany({
      include: {
        _count: {
          select: {
            assignedTasks: true,
          },
        },
      },
      orderBy: { trustScore: 'desc' },
      take: limit,
    });

    const performances = await Promise.all(
      agents.map(async agent => {
        const completedTasks = await this.prisma.task.count({
          where: {
            assigneeId: agent.id,
            status: 'completed',
          },
        });

        return {
          id: agent.id,
          name: agent.name,
          status: agent.status,
          trustScore: agent.trustScore,
          totalTasks: agent._count.assignedTasks,
          completedTasks,
          completionRate: agent._count.assignedTasks > 0
            ? (completedTasks / agent._count.assignedTasks * 100).toFixed(1)
            : 0,
        };
      })
    );

    return performances;
  }

  /**
   * Get category distribution
   */
  async getCategoryDistribution() {
    const tasks = await this.prisma.task.findMany({
      where: { category: { not: null } },
      select: { category: true },
    });

    const distribution: Record<string, number> = {};
    tasks.forEach(task => {
      const category = task.category || 'uncategorized';
      distribution[category] = (distribution[category] || 0) + 1;
    });

    return Object.entries(distribution)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Get workflow statistics
   */
  async getWorkflowStatistics() {
    const instances = await this.prisma.workflowInstance.findMany({
      select: {
        status: true,
        templateId: true,
        startedAt: true,
        completedAt: true,
      },
    });

    const statusCount: Record<string, number> = {};
    const templateCount: Record<string, number> = {};

    let totalDuration = 0;
    let completedCount = 0;

    instances.forEach(instance => {
      statusCount[instance.status] = (statusCount[instance.status] || 0) + 1;
      templateCount[instance.templateId] = (templateCount[instance.templateId] || 0) + 1;

      if (instance.startedAt && instance.completedAt) {
        totalDuration += instance.completedAt.getTime() - instance.startedAt.getTime();
        completedCount++;
      }
    });

    return {
      byStatus: Object.entries(statusCount).map(([status, count]) => ({ status, count })),
      byTemplate: Object.entries(templateCount).map(([templateId, count]) => ({ templateId, count })),
      avgDuration: completedCount > 0 ? Math.round(totalDuration / completedCount / 1000) : 0, // seconds
      total: instances.length,
    };
  }

  /**
   * Get credit flow
   */
  async getCreditFlow(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const transactions = await this.prisma.creditTransaction.findMany({
      where: {
        createdAt: { gte: startDate },
      },
      select: {
        type: true,
        amount: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const flowByType: Record<string, { count: number; total: number }> = {};
    const flowByDate = this.groupByDate(transactions, 'createdAt', (tx) => tx.amount);

    transactions.forEach(tx => {
      if (!flowByType[tx.type]) {
        flowByType[tx.type] = { count: 0, total: 0 };
      }
      flowByType[tx.type].count++;
      flowByType[tx.type].total += tx.amount;
    });

    return {
      period: `${days} days`,
      byType: Object.entries(flowByType).map(([type, data]) => ({
        type,
        count: data.count,
        total: data.total,
      })),
      byDate: flowByDate,
    };
  }

  /**
   * Get real-time metrics
   */
  async getRealTimeMetrics() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      recentAgents,
      recentTasks,
      recentTransactions,
      activeWorkflows,
    ] = await Promise.all([
      this.prisma.agent.count({
        where: { lastSeen: { gte: oneHourAgo } },
      }),
      this.prisma.task.count({
        where: { createdAt: { gte: oneDayAgo } },
      }),
      this.prisma.creditTransaction.count({
        where: { createdAt: { gte: oneDayAgo } },
      }),
      this.prisma.workflowInstance.count({
        where: { status: 'running' },
      }),
    ]);

    return {
      activeAgentsLastHour: recentAgents,
      tasksCreatedLastDay: recentTasks,
      transactionsLastDay: recentTransactions,
      activeWorkflows,
      timestamp: now.toISOString(),
    };
  }

  /**
   * Helper: Group data by date
   */
  private groupByDate(
    data: any[],
    dateField: string,
    valueExtractor?: (item: any) => number
  ): Array<{ date: string; count: number; value?: number }> {
    const grouped: Record<string, { count: number; value: number }> = {};

    data.forEach(item => {
      const date = new Date(item[dateField]).toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = { count: 0, value: 0 };
      }
      grouped[date].count++;
      if (valueExtractor) {
        grouped[date].value += valueExtractor(item);
      }
    });

    return Object.entries(grouped)
      .map(([date, data]) => ({
        date,
        count: data.count,
        value: valueExtractor ? data.value : undefined,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}
