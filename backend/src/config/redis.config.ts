import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private readonly client: Redis;

  constructor(private configService: ConfigService) {
    this.client = new Redis({
      host: this.configService.get('redis.host'),
      port: this.configService.get('redis.port'),
      password: this.configService.get('redis.password') || undefined,
      retryStrategy: (times) => {
        if (times > 3) {
          return null;
        }
        return Math.min(times * 200, 1000);
      },
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    this.client.on('connect', () => {
      console.log('Redis Client Connected');
    });
  }

  getClient(): Redis {
    return this.client;
  }

  // Cache operations
  async get<T>(key: string): Promise<T | null> {
    const data = await this.client.get(key);
    if (!data) return null;
    try {
      return JSON.parse(data) as T;
    } catch {
      return data as unknown as T;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    if (ttlSeconds) {
      await this.client.setex(key, ttlSeconds, serialized);
    } else {
      await this.client.set(key, serialized);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async delPattern(pattern: string): Promise<void> {
    const keys = await this.client.keys(pattern);
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }

  // Phone verification code
  async setVerificationCode(phone: string, code: string): Promise<void> {
    await this.set(`verify:${phone}`, code, 180); // 3 minutes
  }

  async getVerificationCode(phone: string): Promise<string | null> {
    return this.get<string>(`verify:${phone}`);
  }

  async deleteVerificationCode(phone: string): Promise<void> {
    await this.del(`verify:${phone}`);
  }

  // Session management
  async setUserSession(userId: string, sessionData: any, ttlSeconds = 86400): Promise<void> {
    await this.set(`session:${userId}`, sessionData, ttlSeconds);
  }

  async getUserSession(userId: string): Promise<any> {
    return this.get(`session:${userId}`);
  }

  async deleteUserSession(userId: string): Promise<void> {
    await this.del(`session:${userId}`);
  }

  // Rate limiting support
  async incrementRateLimit(key: string, windowSeconds: number): Promise<number> {
    const multi = this.client.multi();
    multi.incr(key);
    multi.expire(key, windowSeconds);
    const results = await multi.exec();
    return results?.[0]?.[1] as number || 0;
  }

  // Online users tracking
  async setUserOnline(userId: string, online: boolean = true): Promise<void> {
    if (online) {
      await this.client.sadd('online_users', userId);
    } else {
      await this.client.srem('online_users', userId);
    }
  }

  async setUserOffline(userId: string): Promise<void> {
    await this.client.srem('online_users', userId);
  }

  async isUserOnline(userId: string): Promise<boolean> {
    return (await this.client.sismember('online_users', userId)) === 1;
  }

  async getOnlineUsers(): Promise<string[]> {
    return this.client.smembers('online_users');
  }

  // Pub/Sub for real-time events
  async publish(channel: string, message: any): Promise<void> {
    const serialized = typeof message === 'string' ? message : JSON.stringify(message);
    await this.client.publish(channel, serialized);
  }

  subscribe(channel: string, callback: (message: string) => void): void {
    const subscriber = this.client.duplicate();
    subscriber.subscribe(channel);
    subscriber.on('message', (ch, message) => {
      if (ch === channel) {
        callback(message);
      }
    });
  }
}
