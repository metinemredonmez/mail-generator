import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'uzman-mail-panel-api',
      version: '1.0.0',
    };
  }

  async checkDetailed() {
    const checks = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'uzman-mail-panel-api',
      version: '1.0.0',
      checks: {
        database: { status: 'unknown' },
        memory: { status: 'ok', usage: {} },
        uptime: process.uptime(),
      },
    };

    // Database check
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.checks.database = { status: 'ok' };
    } catch (error) {
      checks.checks.database = { status: 'error' };
      console.error('DB Health Check Error:', error.message);
      checks.status = 'degraded';
    }

    // Memory check
    const memUsage = process.memoryUsage();
    checks.checks.memory = {
      status: 'ok',
      usage: {
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
        rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
      },
    };

    return checks;
  }
}
