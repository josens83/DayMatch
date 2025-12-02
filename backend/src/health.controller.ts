import { Controller, Get, Injectable } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Public } from './auth/decorators/public.decorator';
import { RedisService } from './config/redis.config';
import { ConfigService } from '@nestjs/config';

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: ServiceStatus;
    redis: ServiceStatus;
    memory: MemoryStatus;
  };
}

interface ServiceStatus {
  status: 'up' | 'down';
  responseTime?: number;
  error?: string;
}

interface MemoryStatus {
  status: 'ok' | 'warning' | 'critical';
  heapUsed: string;
  heapTotal: string;
  external: string;
  rss: string;
}

@ApiTags('Health')
@Controller('health')
export class HealthController {
  private startTime: Date;

  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
    private redisService: RedisService,
    private configService: ConfigService,
  ) {
    this.startTime = new Date();
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Basic health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('live')
  @Public()
  @ApiOperation({ summary: 'Kubernetes liveness probe' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  liveness() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  @Public()
  @ApiOperation({ summary: 'Kubernetes readiness probe' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  async readiness(): Promise<{ status: string; checks: Record<string, string> }> {
    const checks: Record<string, string> = {};

    // Check database
    try {
      await this.dataSource.query('SELECT 1');
      checks.database = 'ok';
    } catch (error) {
      checks.database = 'failed';
    }

    // Check Redis
    try {
      await this.redisService.set('health:check', 'ok', 10);
      checks.redis = 'ok';
    } catch (error) {
      checks.redis = 'failed';
    }

    const allOk = Object.values(checks).every((v) => v === 'ok');

    return {
      status: allOk ? 'ready' : 'not_ready',
      checks,
    };
  }

  @Get('detailed')
  @Public()
  @ApiOperation({ summary: 'Detailed health check with all services' })
  @ApiResponse({ status: 200, description: 'Detailed health information' })
  async detailedHealth(): Promise<HealthCheckResult> {
    const [dbStatus, redisStatus] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    const memoryStatus = this.checkMemory();

    const allUp = dbStatus.status === 'up' && redisStatus.status === 'up';
    const anyDown = dbStatus.status === 'down' || redisStatus.status === 'down';

    let overallStatus: 'healthy' | 'unhealthy' | 'degraded';
    if (allUp) {
      overallStatus = 'healthy';
    } else if (anyDown) {
      overallStatus = 'unhealthy';
    } else {
      overallStatus = 'degraded';
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: this.configService.get('npm_package_version', '1.0.0'),
      uptime: Math.floor((Date.now() - this.startTime.getTime()) / 1000),
      checks: {
        database: dbStatus,
        redis: redisStatus,
        memory: memoryStatus,
      },
    };
  }

  @Get('metrics')
  @Public()
  @ApiOperation({ summary: 'Prometheus-compatible metrics' })
  async metrics(): Promise<string> {
    const [dbStatus, redisStatus] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    const memoryUsage = process.memoryUsage();
    const uptime = Math.floor((Date.now() - this.startTime.getTime()) / 1000);

    const lines = [
      '# HELP daymatch_up Service up status',
      '# TYPE daymatch_up gauge',
      `daymatch_up 1`,
      '',
      '# HELP daymatch_uptime_seconds Service uptime in seconds',
      '# TYPE daymatch_uptime_seconds counter',
      `daymatch_uptime_seconds ${uptime}`,
      '',
      '# HELP daymatch_database_up Database connection status',
      '# TYPE daymatch_database_up gauge',
      `daymatch_database_up ${dbStatus.status === 'up' ? 1 : 0}`,
      '',
      '# HELP daymatch_database_response_time_ms Database response time',
      '# TYPE daymatch_database_response_time_ms gauge',
      `daymatch_database_response_time_ms ${dbStatus.responseTime || 0}`,
      '',
      '# HELP daymatch_redis_up Redis connection status',
      '# TYPE daymatch_redis_up gauge',
      `daymatch_redis_up ${redisStatus.status === 'up' ? 1 : 0}`,
      '',
      '# HELP daymatch_redis_response_time_ms Redis response time',
      '# TYPE daymatch_redis_response_time_ms gauge',
      `daymatch_redis_response_time_ms ${redisStatus.responseTime || 0}`,
      '',
      '# HELP daymatch_memory_heap_used_bytes Memory heap used',
      '# TYPE daymatch_memory_heap_used_bytes gauge',
      `daymatch_memory_heap_used_bytes ${memoryUsage.heapUsed}`,
      '',
      '# HELP daymatch_memory_heap_total_bytes Memory heap total',
      '# TYPE daymatch_memory_heap_total_bytes gauge',
      `daymatch_memory_heap_total_bytes ${memoryUsage.heapTotal}`,
      '',
      '# HELP daymatch_memory_rss_bytes Memory RSS',
      '# TYPE daymatch_memory_rss_bytes gauge',
      `daymatch_memory_rss_bytes ${memoryUsage.rss}`,
    ];

    return lines.join('\n');
  }

  private async checkDatabase(): Promise<ServiceStatus> {
    const startTime = Date.now();
    try {
      await this.dataSource.query('SELECT 1');
      return {
        status: 'up',
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  private async checkRedis(): Promise<ServiceStatus> {
    const startTime = Date.now();
    try {
      const testKey = `health:${Date.now()}`;
      await this.redisService.set(testKey, 'ok', 5);
      const value = await this.redisService.get(testKey);
      if (value !== 'ok') {
        throw new Error('Redis read/write mismatch');
      }
      return {
        status: 'up',
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  private checkMemory(): MemoryStatus {
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
    const heapTotalMB = memoryUsage.heapTotal / 1024 / 1024;
    const heapUsedPercent = (heapUsedMB / heapTotalMB) * 100;

    let status: 'ok' | 'warning' | 'critical';
    if (heapUsedPercent < 70) {
      status = 'ok';
    } else if (heapUsedPercent < 90) {
      status = 'warning';
    } else {
      status = 'critical';
    }

    return {
      status,
      heapUsed: `${heapUsedMB.toFixed(2)} MB`,
      heapTotal: `${heapTotalMB.toFixed(2)} MB`,
      external: `${(memoryUsage.external / 1024 / 1024).toFixed(2)} MB`,
      rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
    };
  }
}
