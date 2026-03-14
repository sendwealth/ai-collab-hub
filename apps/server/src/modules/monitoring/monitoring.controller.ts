import { Controller, Get } from '@nestjs/common';
import { PerformanceInterceptor } from '../common/interceptors';
import { CacheService } from '../cache';

@Controller('api/v1/monitoring')
export class MonitoringController {
  constructor(
    private performanceInterceptor: PerformanceInterceptor,
    private cacheService: CacheService,
  ) {}

  /**
   * 获取性能指标
   */
  @Get('performance')
  getPerformanceMetrics() {
    return this.performanceInterceptor.getMetrics();
  }

  /**
   * 获取缓存统计
   */
  @Get('cache')
  getCacheStats() {
    return this.cacheService.getStats();
  }

  /**
   * 健康检查
   */
  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
