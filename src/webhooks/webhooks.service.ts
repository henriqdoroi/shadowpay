import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PspService } from '../psp/psp.service';
import { PspWebhookPayload } from '../psp/psp.interface';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly psp: PspService,
  ) {}

  /**
   * Recebe webhook de qualquer PSP (atualmente só Simpay).
   * 1. Verifica assinatura via PspService (delega pro provider)
   * 2. Persiste o evento bruto pra auditoria
   * 3. Atualiza Transaction correspondente
   * 4. Move saldo na Wallet quando status == PAID
   */
  async handle(provider: string, rawBody: string, headers: Record<string, string>) {
    let payload: PspWebhookPayload;
    try {
      payload = this.psp.verifyAndParseWebhook(rawBody, headers, provider);
    } catch (err: any) {
      this.logger.warn(`Webhook ${provider} rejeitado: ${err.message}`);
      // Não vaza detalhes pro PSP
      return { ok: false };
    }

    const event = await this.prisma.webhookEvent.create({
      data: {
        pspName: provider,
        eventType: payload.type,
        payload: payload.raw,
        processed: false,
      },
    });

    try {
      const tx = await this.prisma.transaction.findFirst({
        where: { externalId: payload.externalId, pspName: provider },
      });

      if (!tx) {
        this.logger.warn(
          `Webhook ${provider} para externalId ${payload.externalId} sem transação local — ignorando.`,
        );
      } else {
        await this.prisma.$transaction(async (t) => {
          // Atualiza status
          const updated = await t.transaction.update({
            where: { id: tx.id },
            data: {
              status: payload.status,
              paidAt: payload.status === 'PAID' ? (payload.paidAt ?? new Date()) : tx.paidAt,
            },
          });

          // Quando vira PAID, credita líquido na wallet do seller
          if (payload.status === 'PAID' && tx.status !== 'PAID') {
            await t.wallet.updateMany({
              where: { sellerId: tx.sellerId },
              data: { balance: { increment: updated.netAmount } },
            });
            await t.walletEntry.create({
              data: {
                sellerId: tx.sellerId,
                transactionId: tx.id,
                type: 'IN',
                amount: updated.netAmount,
                description: `Pagamento ${tx.method} (${tx.id.slice(0, 8)})`,
              },
            });
          }

          // Reembolso/chargeback debita
          if (
            (payload.status === 'REFUNDED' || payload.status === 'CHARGEBACK') &&
            tx.status === 'PAID'
          ) {
            await t.wallet.updateMany({
              where: { sellerId: tx.sellerId },
              data: { balance: { decrement: updated.netAmount } },
            });
            await t.walletEntry.create({
              data: {
                sellerId: tx.sellerId,
                transactionId: tx.id,
                type: payload.status === 'REFUNDED' ? 'REFUND' : 'ADJUSTMENT',
                amount: updated.netAmount.neg(),
                description: `${payload.status} ${tx.method}`,
              },
            });
          }

          await t.webhookEvent.update({
            where: { id: event.id },
            data: { processed: true, processedAt: new Date(), transactionId: tx.id },
          });
        });
      }
    } catch (err: any) {
      this.logger.error(`Erro processando webhook ${event.id}: ${err.message}`);
      await this.prisma.webhookEvent.update({
        where: { id: event.id },
        data: { processingError: err.message },
      });
    }

    return { ok: true };
  }
}
