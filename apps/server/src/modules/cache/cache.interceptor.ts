import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
  Optional,
} from '@nestjs/common';
import { Observable, of, from } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { CacheService } from './cache.service';
import { Reflector } from '@nestjs/core';

export interface CacheConfig {
  key: string;
  ttl?: number;
  skipCache?: boolean;
}

export const CACHE_KEY = 'cache_key';
export const CACHE_TTL = 'cache_ttl';

/**
 * 缓存拦截器 - 自动缓存API响应
 */
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    private readonly cacheService: CacheService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    // 只缓存GET请求
    if (method !== 'GET') {
      return next.handle();
    }

    // 检查是否跳过缓存
    const skipCache = this.reflector.get<boolean>(
      CACHE_KEY + '_skip',
      context.getHandler(),
    );
    if (skipCache) {
      return next.handle();
    }

    // 生成缓存键
    const cacheKey = this.generateCacheKey(context);
    const ttl = this.reflector.get<number>(CACHE_TTL, context.getHandler()) || 300;

    // 尝试从缓存获取
    const cached = await this.cacheService.get(cacheKey);
    if (cached !== null) {
      return of(cached);
    }

    // 执行处理器并缓存结果
    return next.handle().pipe(
      switchMap(async (data) => {
        await this.cacheService.set(cacheKey, data, ttl);
        return data;
      }),
    );
  }

  private generateCacheKey(context: ExecutionContext): string {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();
    const className = context.getClass().name;
    const handlerName = handler.name;

    // 从装饰器获取基础key
    const baseKey = this.reflector.get<string>(CACHE_KEY, handler) || `${className}:${handlerName}`;

    // 添加查询参数到key
    const query = JSON.stringify(request.query || {});
    const params = JSON.stringify(request.params || {});

    return `${baseKey}:${Buffer.from(query + params).toString('base64')}`;
  }
}
