import { Controller, Headers, HttpCode, HttpStatus, Param, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../common/decorators/public.decorator';
import { SkipKyc } from '../common/decorators/skip-kyc.decorator';
import { WebhooksService } from './webhooks.service';

/**
 * Endpoint público (sem JWT) que recebe callbacks do PSP.
 * O segredo de assinatura está em SIMPAY_WEBHOOK_SECRET.
 */
@Controller('webhooks/psp')
@Public()
@SkipKyc()
export class WebhooksController {
  constructor(private readonly service: WebhooksService) {}

  // POST /api/webhooks/psp/simpay
  @Post(':provider')
  @SkipThrottle()
  @HttpCode(HttpStatus.OK)
  handle(
    @Param('provider') provider: string,
    @Headers() headers: Record<string, string>,
    @Req() req: Request,
  ) {
    // rawBody é capturado pelo middleware em main.ts
    const raw =
      (req as any).rawBody?.toString('utf8') ?? JSON.stringify((req as any).body ?? {});
    return this.service.handle(provider.toLowerCase(), raw, headers);
  }
}
