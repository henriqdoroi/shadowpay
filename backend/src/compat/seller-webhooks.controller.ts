/**
 * /api/webhooks/* — webhooks de saida do seller.
 * Seller cadastra URLs pra receber eventos (transaction.paid, etc.)
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
import { IsArray, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../users/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

class CreateWebhookDto {
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  url!: string;

  @IsArray()
  @IsString({ each: true })
  events!: string[];

  @IsOptional()
  @IsString()
  @MaxLength(120)
  secret?: string;
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
  async create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateWebhookDto,
  ) {
    if (!dto.events?.length) {
      throw new BadRequestException('Pelo menos um evento e obrigatorio.');
    }
    const w = await this.prisma.sellerWebhook.create({
      data: {
        sellerId: user.id,
        url: dto.url,
        events: dto.events,
        secret: dto.secret ?? 'whsec_' + randomBytes(24).toString('hex'),
        active: true,
      },
    });
    return { success: true, data: serialize(w) };
  }

  @Delete(':id')
  async remove(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ) {
    const w = await this.prisma.sellerWebhook.findFirst({
      where: { id, sellerId: user.id },
    });
    if (!w) throw new NotFoundException('Webhook nao encontrado.');
    await this.prisma.sellerWebhook.delete({ where: { id } });
    return { success: true, message: 'Removido.' };
  }

  // Disparo manual de notificacao push (admin) — ainda stub
  @Post('notifications/send')
  sendNotification(
    @CurrentUser() _user: { id: string },
    @Body() _body: { sellerId?: string; title?: string; body?: string },
  ) {
    return {
      success: false,
      error: {
        code: 'WEB_PUSH_NOT_CONFIGURED',
        message:
          'Push manual ainda requer VAPID keys. Configure VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY nas env vars.',
      },
    };
  }
}
