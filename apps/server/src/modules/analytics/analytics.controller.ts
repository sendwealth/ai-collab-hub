import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard overview' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved' })
  async getDashboardOverview() {
    return this.service.getDashboardOverview();
  }

  @Get('tasks/trends')
  @ApiOperation({ summary: 'Get task trends' })
  @ApiQuery({ name: 'days', required: false, description: 'Number of days (default: 7)' })
  @ApiResponse({ status: 200, description: 'Task trends retrieved' })
  async getTaskTrends(@Query('days') days?: string) {
    return this.service.getTaskTrends(days ? parseInt(days) : 7);
  }

  @Get('agents/performance')
  @ApiOperation({ summary: 'Get agent performance' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of agents (default: 10)' })
  @ApiResponse({ status: 200, description: 'Agent performance retrieved' })
  async getAgentPerformance(@Query('limit') limit?: string) {
    return this.service.getAgentPerformance(limit ? parseInt(limit) : 10);
  }

  @Get('tasks/categories')
  @ApiOperation({ summary: 'Get category distribution' })
  @ApiResponse({ status: 200, description: 'Category distribution retrieved' })
  async getCategoryDistribution() {
    return this.service.getCategoryDistribution();
  }

  @Get('workflows/statistics')
  @ApiOperation({ summary: 'Get workflow statistics' })
  @ApiResponse({ status: 200, description: 'Workflow statistics retrieved' })
  async getWorkflowStatistics() {
    return this.service.getWorkflowStatistics();
  }

  @Get('credits/flow')
  @ApiOperation({ summary: 'Get credit flow' })
  @ApiQuery({ name: 'days', required: false, description: 'Number of days (default: 30)' })
  @ApiResponse({ status: 200, description: 'Credit flow retrieved' })
  async getCreditFlow(@Query('days') days?: string) {
    return this.service.getCreditFlow(days ? parseInt(days) : 30);
  }

  @Get('realtime')
  @ApiOperation({ summary: 'Get real-time metrics' })
  @ApiResponse({ status: 200, description: 'Real-time metrics retrieved' })
  async getRealTimeMetrics() {
    return this.service.getRealTimeMetrics();
  }

  @Get('dashboard/charts')
  @ApiOperation({ summary: 'Get all chart data for dashboard' })
  @ApiQuery({ name: 'days', required: false, description: 'Number of days for revenue trend (default: 30)' })
  @ApiResponse({ status: 200, description: 'Chart data for dashboard' })
  async getDashboardCharts(@Query('days') days?: string) {
    return this.service.getDashboardCharts(days ? parseInt(days) : 30);
  }
}
