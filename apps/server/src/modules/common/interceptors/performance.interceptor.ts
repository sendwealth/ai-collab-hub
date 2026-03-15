import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * 性能监控拦截器
 */
@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Performance');
  private readonly slowThreshold = 100; // 100ms
  private metrics = {
    totalRequests: 0,
    slowRequests: 0,
    averageResponseTime: 0,
    endpointStats: new Map<string, { count: number; totalTime: number; maxTime: number }>(),
  };

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const startTime = Date.now();
    const endpoint = `${request.method} ${request.route?.path || request.url}`;

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        this.recordMetrics(endpoint, duration);

        if (duration > this.slowThreshold) {
          this.logger.warn(`⚠️ Slow request: ${endpoint} took ${duration}ms`);
        } else {
          this.logger.debug(`✓ ${endpoint} - ${duration}ms`);
        }
      }),
    );
  }

  private recordMetrics(endpoint: string, duration: number) {
    this.metrics.totalRequests++;

    if (duration > this.slowThreshold) {
      this.metrics.slowRequests++;
    }

    // 更新平均响应时间
    const prevAvg = this.metrics.averageResponseTime;
    const prevCount = this.metrics.totalRequests - 1;
    this.metrics.averageResponseTime = (prevAvg * prevCount + duration) / this.metrics.totalRequests;

    // 更新端点统计
    const stats = this.metrics.endpointStats.get(endpoint) || {
      count: 0,
      totalTime: 0,
      maxTime: 0,
    };
    stats.count++;
    stats.totalTime += duration;
    stats.maxTime = Math.max(stats.maxTime, duration);
    this.metrics.endpointStats.set(endpoint, stats);
  }

  /**
   * 获取性能指标
   */
  getMetrics() {
    const endpoints = Array.from(this.metrics.endpointStats.entries()).map(
      ([endpoint, stats]) => ({
        endpoint,
        count: stats.count,
        avgTime: Math.round(stats.totalTime / stats.count),
        maxTime: stats.maxTime,
      }),
    );

    return {
      totalRequests: this.metrics.totalRequests,
      slowRequests: this.metrics.slowRequests,
      slowRequestRate: this.metrics.totalRequests > 0
        ? ((this.metrics.slowRequests / this.metrics.totalRequests) * 100).toFixed(2) + '%'
        : '0%',
      averageResponseTime: Math.round(this.metrics.averageResponseTime) + 'ms',
      endpoints: endpoints.sort((a, b) => b.avgTime - a.avgTime).slice(0, 10),
    };
  }

  /**
   * 重置指标
   */
  resetMetrics() {
    this.metrics = {
      totalRequests: 0,
      slowRequests: 0,
      averageResponseTime: 0,
      endpointStats: new Map(),
    };
  }
}
