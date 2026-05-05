import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Salva (ou atualiza) a subscription web-push do seller.
   * O frontend chama isso após login. Se o navegador re-cadastra,
   * a gente faz upsert pelo endpoint (que é único).
   */
  async subscribe(
    sellerId: string,
    body: { subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } }; userAgent?: string },
  ) {
    const sub = body?.subscription;
    if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
      // Não falha violentamente — apenas avisa. Útil pra dev em http (push não funciona em http).
      this.logger.warn('subscribe chamado sem subscription válida; ignorando.');
      return { success: true, message: 'Subscription ignorada (incompleta).' };
    }

    await this.prisma.pushSubscription.upsert({
      where: { endpoint: sub.endpoint },
      create: {
        sellerId,
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        authKey: sub.keys.auth,
        userAgent: body.userAgent,
      },
      update: {
        sellerId,
        p256dh: sub.keys.p256dh,
        authKey: sub.keys.auth,
        lastUsedAt: new Date(),
      },
    });

    return { success: true, message: 'Push subscription registrada.' };
  }
}
