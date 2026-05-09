/**
 * /api/webhooks/* — webhooks de saida do seller.
 */
import { randomBytes } from 'crypto';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../users/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

function normalizeEvents(input: any): string[] {
  if (Array.isArray(input)) return input.map((e) => String(e)).filter(Boolean);
  if (typeof input === 'string') {
    return input.split(/[,;\s]+/).map((e) => e.trim()).filter(Boolean);
  }
  return [];
}

function serialize(w: any) {
  if (!w) return null;
  return {
    id: w.id,
    url: w.url,
    events: w.events ?? [],
    secret: w.secret ?? null,
    active: w.active,
    lastSentAt: w.lastSentAt?.toISOString?.() ?? null,
    createdAt: w.createdAt?.toISOString?.() ?? null,
    updatedAt: w.updatedAt?.toISOString?.() ?? null,
  };
}

@Controller('webhooks')
@UseGuards(JwtAuthGuard)
export class SellerWebhooksController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@CurrentUser() user: { id: string }) {
    const items = await this.prisma.sellerWebhook.findMany({
      where: { sellerId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: items.map(serialize) };
  }

  @Post()
  async create(@CurrentUser() user: { id: string }, @Body() body: any) {
    const url = String(body?.url ?? body?.endpoint ?? '').trim();
    if (!url || !/^https?:\/\//i.test(url)) {
      throw new BadRequestException('URL invalida (precisa comecar com http:// ou https://).');
    }
    const events = normalizeEvents(body?.events ?? body?.eventos ?? []);
    if (!events.length) {
      // Se nao mandou nada, registra todos os eventos comuns
      events.push('transaction.paid', 'transaction.refunded', 'withdrawal.paid', 'withdrawal.failed');
    }
    const secret = String(body?.secret ?? '').trim() || ('whsec_' + randomBytes(24).toString('hex'));

    const w = await this.prisma.sellerWebhook.create({
      data: {
        sellerId: user.id,
        url,
        events,
        secret,
        active: body?.active === false ? false : true,
      },
    });
    return { success: true, data: serialize(w) };
  }

  @Delete(':id')
  async remove(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    const w = await this.prisma.sellerWebhook.findFirst({
      where: { id, sellerId: user.id },
    });
    if (!w) throw new NotFoundException('Webhook nao encontrado.');
    await this.prisma.sellerWebhook.delete({ where: { id } });
    return { success: true, message: 'Removido.' };
  }

  @Post('notifications/send')
  sendNotification(
    @CurrentUser() _user: { id: string },
    @Body() _body: any,
  ) {
    return {
      success: false,
      error: {
        code: 'WEB_PUSH_NOT_CONFIGURED',
        message: 'Push manual requer VAPID keys (VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY).',
      },
    };
  }
}
