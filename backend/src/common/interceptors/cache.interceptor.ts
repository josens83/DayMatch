import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RedisService } from '../../config/redis.config';
import { CACHE_KEY_METADATA, CACHE_TTL_METADATA } from '../decorators/cache.decorator';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private redisService: RedisService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const cacheKey = this.reflector.get<string>(
      CACHE_KEY_METADATA,
      context.getHandler(),
    );

    if (!cacheKey) {
      return next.handle();
    }

    const ttl = this.reflector.get<number>(
      CACHE_TTL_METADATA,
      context.getHandler(),
    ) || 300; // Default 5 minutes

    // Build the actual cache key from the request params
    const request = context.switchToHttp().getRequest();
    const actualKey = this.buildCacheKey(cacheKey, request);

    // Try to get from cache
    const cachedValue = await this.redisService.get(actualKey);
    if (cachedValue !== null) {
      return of(cachedValue);
    }

    // Execute the handler and cache the result
    return next.handle().pipe(
      tap(async (data) => {
        if (data !== null && data !== undefined) {
          await this.redisService.set(actualKey, data, ttl);
        }
      }),
    );
  }

  private buildCacheKey(pattern: string, request: any): string {
    let key = pattern;

    // Replace :param placeholders with actual values from request.params
    if (request.params) {
      for (const [param, value] of Object.entries(request.params)) {
        key = key.replace(`:${param}`, String(value));
        key = key.replace(`\${${param}}`, String(value));
      }
    }

    // Replace query params
    if (request.query) {
      for (const [param, value] of Object.entries(request.query)) {
        key = key.replace(`:${param}`, String(value));
        key = key.replace(`\${${param}}`, String(value));
      }
    }

    // Replace user id if available
    if (request.user?.id) {
      key = key.replace(':userId', request.user.id);
      key = key.replace('${userId}', request.user.id);
    }

    return key;
  }
}
