import { SetMetadata } from '@nestjs/common';

/**
 * Cache key metadata
 */
export const CACHE_KEY_METADATA = 'cache:key';
export const CACHE_TTL_METADATA = 'cache:ttl';

/**
 * Cache configuration options
 */
export interface CacheOptions {
  /** Cache key pattern (supports placeholders like :id) */
  key: string;
  /** Time to live in seconds */
  ttl: number;
}

/**
 * Decorator to cache method results
 *
 * @example
 * ```typescript
 * @Cacheable({ key: 'job:${id}', ttl: 300 })
 * async findById(id: string) { ... }
 * ```
 */
export const Cacheable = (options: CacheOptions) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    SetMetadata(CACHE_KEY_METADATA, options.key)(target, propertyKey, descriptor);
    SetMetadata(CACHE_TTL_METADATA, options.ttl)(target, propertyKey, descriptor);
    return descriptor;
  };
};

/**
 * Decorator to invalidate cache on method execution
 *
 * @example
 * ```typescript
 * @CacheEvict('job:${id}')
 * async update(id: string, dto: UpdateDto) { ... }
 * ```
 */
export const CacheEvict = (keyPattern: string) => {
  return SetMetadata('cache:evict', keyPattern);
};

/**
 * Common cache keys
 */
export const CacheKeys = {
  // Job related
  JOB_DETAIL: (id: string) => `job:${id}`,
  JOB_LIST: (query: string) => `jobs:list:${query}`,
  JOB_BY_CATEGORY: (categoryId: string) => `jobs:category:${categoryId}`,
  JOB_NEARBY: (lat: number, lng: number, radius: number) =>
    `jobs:nearby:${lat}:${lng}:${radius}`,

  // User related
  USER_PROFILE: (id: string) => `user:${id}`,
  USER_PUBLIC_PROFILE: (id: string) => `user:public:${id}`,
  USER_STATS: (id: string) => `user:stats:${id}`,

  // Category related
  CATEGORIES: 'categories:all',
  CATEGORY: (id: string) => `category:${id}`,

  // Match related
  USER_MATCHES: (userId: string) => `matches:user:${userId}`,

  // Chat related
  CHAT_ROOMS: (userId: string) => `chat:rooms:${userId}`,
  CHAT_ROOM: (roomId: string) => `chat:room:${roomId}`,

  // Notifications
  UNREAD_COUNT: (userId: string) => `notifications:unread:${userId}`,
};

/**
 * Cache TTL values in seconds
 */
export const CacheTTL = {
  /** 30 seconds - for frequently changing data */
  VERY_SHORT: 30,
  /** 1 minute */
  SHORT: 60,
  /** 5 minutes */
  MEDIUM: 300,
  /** 30 minutes */
  LONG: 1800,
  /** 1 hour */
  VERY_LONG: 3600,
  /** 1 day */
  DAY: 86400,
};
