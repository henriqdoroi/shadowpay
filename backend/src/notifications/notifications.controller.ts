import { Body, Controller, Post, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../users/current-user.decorator';
import { NotificationsService } from './notifications.service';

interface SubscribeBody {
  subscription?: {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  };
  userAgent?: string;
}

@Controller('webhooks/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  // POST /api/webhooks/notifications/subscribe
  // Frontend (AuthContext.tsx) chama isso após login pra registrar push.
  @Post('subscribe')
  @HttpCode(HttpStatus.OK)
  subscribe(
    @CurrentUser() user: { id: string },
    @Body() body: SubscribeBody,
  ) {
    return this.service.subscribe(user.id, body);
  }
}
