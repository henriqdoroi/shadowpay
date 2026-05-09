import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from './common/decorators/public.decorator';
import { SkipKyc } from './common/decorators/skip-kyc.decorator';
import { PrismaService } from './prisma/prisma.service';

@Controller()
@Public()
@SkipKyc()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @SkipThrottle()
  @Get('health')
  health() {
    return {
      status: 'ok',
      service: 'shadowpay-backend',
      timestamp: new Date().toISOString(),
    };
  }

  /** Readiness — bate no banco também. */
  @SkipThrottle()
  @Get('ready')
  async ready() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ready', db: 'up', timestamp: new Date().toISOString() };
    } catch (e) {
      return { status: 'not_ready', db: 'down', error: (e as Error).message };
    }
  }
}
