import { SetMetadata } from '@nestjs/common';
import { CACHE_KEY, CACHE_TTL } from '../cache.interceptor';

/**
 * 缓存装饰器 - 标记方法需要缓存
 * @param key 缓存键前缀
 * @param ttl 缓存时间（秒），默认300秒（5分钟）
 */
export const Cacheable = (key: string, ttl: number = 300) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    SetMetadata(CACHE_KEY, key)(target, propertyKey, descriptor);
    SetMetadata(CACHE_TTL, ttl)(target, propertyKey, descriptor);
  };
};

/**
 * 跳过缓存装饰器
 */
export const SkipCache = () => {
  return SetMetadata(CACHE_KEY + '_skip', true);
};
