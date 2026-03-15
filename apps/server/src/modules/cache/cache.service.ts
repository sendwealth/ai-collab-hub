import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * 缓存服务 - 支持Redis和内存缓存降级
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private redis: any = null;
  private memoryCache: Map<string, { value: any; expires: number }> = new Map();
  private useRedis = false;

  constructor(private configService: ConfigService) {
    this.initializeCache();
  }

  private async initializeCache() {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    
    if (redisUrl) {
      try {
        // 动态导入Redis (如果可用)
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { createClient } = require('redis');
        this.redis = createClient({ url: redisUrl });
        await this.redis.connect();
        this.useRedis = true;
        this.logger.log('✅ Redis cache connected');
      } catch (error) {
        this.logger.warn('Redis not available, using memory cache fallback');
        this.useRedis = false;
      }
    } else {
      this.logger.log('Using in-memory cache (Redis URL not configured)');
    }
  }

  /**
   * 获取缓存
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (this.useRedis && this.redis) {
        const cached = await this.redis.get(key);
        return cached ? JSON.parse(cached) : null;
      } else {
        // 内存缓存
        const item = this.memoryCache.get(key);
        if (item && item.expires > Date.now()) {
          return item.value as T;
        }
        if (item) {
          this.memoryCache.delete(key);
        }
        return null;
      }
    } catch (error) {
      this.logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * 设置缓存
   */
  async set(key: string, value: any, ttl: number = 300): Promise<void> {
    try {
      if (this.useRedis && this.redis) {
        await this.redis.setex(key, ttl, JSON.stringify(value));
      } else {
        // 内存缓存
        this.memoryCache.set(key, {
          value,
          expires: Date.now() + ttl * 1000,
        });
        
        // 清理过期缓存
        this.cleanupExpiredCache();
      }
    } catch (error) {
      this.logger.error(`Cache set error for key ${key}:`, error);
    }
  }

  /**
   * 删除缓存
   */
  async del(key: string): Promise<void> {
    try {
      if (this.useRedis && this.redis) {
        await this.redis.del(key);
      } else {
        this.memoryCache.delete(key);
      }
    } catch (error) {
      this.logger.error(`Cache del error for key ${key}:`, error);
    }
  }

  /**
   * 批量删除缓存（支持通配符）
   */
  async invalidate(pattern: string): Promise<void> {
    try {
      if (this.useRedis && this.redis) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } else {
        // 内存缓存 - 简单的前缀匹配
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        const keys = Array.from(this.memoryCache.keys());
        for (const key of keys) {
          if (regex.test(key)) {
            this.memoryCache.delete(key);
          }
        }
      }
    } catch (error) {
      this.logger.error(`Cache invalidate error for pattern ${pattern}:`, error);
    }
  }

  /**
   * 获取或设置缓存（常用模式）
   */
  async getOrSet<T>(key: string, factory: () => Promise<T>, ttl: number = 300): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, ttl);
    return value;
  }

  /**
   * 清理过期的内存缓存
   */
  private cleanupExpiredCache() {
    const now = Date.now();
    const entries = Array.from(this.memoryCache.entries());
    for (const [key, item] of entries) {
      if (item.expires <= now) {
        this.memoryCache.delete(key);
      }
    }
  }

  /**
   * 获取缓存统计信息
   */
  getStats() {
    return {
      type: this.useRedis ? 'redis' : 'memory',
      keys: this.useRedis ? 'N/A' : this.memoryCache.size,
    };
  }
}
