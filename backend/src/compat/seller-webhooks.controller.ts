/**
 * Endpoint /api/webhooks/* (do ponto de vista do SELLER, não do PSP).
 * Aqui o lojista cadastra URLs pra onde a gente vai mandar eventos
 * (vendas pagas, chargebacks, etc.).
 *
 * Como ainda não temos tabela `SellerWebhook` no schema, retornamos lista
 * vazia + mensagem informativa. Quando você quiser ativar, é só adicionar
 * o model no schema.prisma e implementar o CRUD aqui.
 */
import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../users/current-user.decorator';

@Controller('webhooks')
@UseGuards(JwtAuthGuard)
export class SellerWebhooksController {
  // GET /api/webhooks — lista webhooks cadastrados pelo seller
  @Get()
  list(@CurrentUser() _user: { id: string }) {
    return { success: true, data: [] };
  }

  // POST /api/webhooks — cadastra um novo webhook
  @Post()
  create(
    @CurrentUser() _user: { id: string },
    @Body() _body: { url?: string; events?: string[] },
  ) {
    return {
      success: false,
      code: 'WEBHOOKS_NOT_ENABLED',
      message:
        'Cadastro de webhooks de saída ainda não implementado. Adicione a tabela SellerWebhook no schema.prisma e me avise.',
    };
  }

  @Delete(':id')
  remove(@CurrentUser() _user: { id: string }, @Param('id') _id: string) {
    return { success: true, message: 'Removido.' };
  }

  // POST /api/webhooks/notifications/send — disparo manual (admin)
  @Post('notifications/send')
  sendNotification(
    @CurrentUser() _user: { id: string },
    @Body() _body: { sellerId?: string; title?: string; body?: string },
  ) {
    return {
      success: false,
      code: 'WEB_PUSH_NOT_CONFIGURED',
      message:
        'Push manual ainda requer VAPID keys. Configure VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY nas env vars do Railway.',
    };
  }
}
