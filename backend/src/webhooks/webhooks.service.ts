import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PspService } from '../psp/psp.service';
import { PspWebhookPayload } from '../psp/psp.interface';
import { WalletService } from '../wallet/wallet.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly psp: PspService,
    private readonly wallet: WalletService,
    private readonly email: EmailService,
  ) {}

  /**
   * Recebe webhook de qualquer PSP.
   * 1. Verifica assinatura via PspService
   * 2. Persiste o evento bruto pra auditoria
   * 3. Dedup por (provider, externalId, eventType) — não processa o mesmo 2x
   * 4. Atualiza Transaction
   * 5. Toca a wallet via WalletService (com lock)
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

    // Persiste evento (auditoria sempre, mesmo se falhar processamento)
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
          `Webhook ${provider} pra externalId ${payload.externalId} sem transação local — ignorando.`,
        );
        await this.prisma.webhookEvent.update({
          where: { id: event.id },
          data: { processed: true, processedAt: new Date() },
        });
        return { ok: true };
      }

      // Dedup: já processamos esse evento exato antes?
      const dup = await this.prisma.webhookEvent.findFirst({
        where: {
          pspName: provider,
          eventType: payload.type,
          transactionId: tx.id,
          processed: true,
          NOT: { id: event.id },
        },
      });
      if (dup && payload.type === 'paid') {
        this.logger.log(`Webhook ${provider} duplicado pra ${tx.id}, ignorando.`);
        await this.prisma.webhookEvent.update({
          where: { id: event.id },
          data: { processed: true, processedAt: new Date(), transactionId: tx.id },
        });
        return { ok: true };
      }

      // Atualiza status (idempotente — não regride)
      const wasPaid = tx.status === 'PAID';
      const updated = await this.prisma.transaction.update({
        where: { id: tx.id },
        data: {
          status: payload.status,
          paidAt:
            payload.status === 'PAID' ? payload.paidAt ?? new Date() : tx.paidAt,
        },
      });

      // PAID -> credita líquido
      if (payload.status === 'PAID' && !wasPaid) {
        await this.wallet.creditPaid(updated.id);
      }

      // REFUND/CHARGEBACK em transação que estava PAID -> debita
      if (
        (payload.status === 'REFUNDED' || payload.status === 'CHARGEBACK') &&
        wasPaid
      ) {
        await this.wallet.adminAdjust(
          updated.sellerId,
          -Number(updated.netAmount),
          `${payload.status} transação ${updated.id}`,
        );
      }

      await this.prisma.webhookEvent.update({
        where: { id: event.id },
        data: { processed: true, processedAt: new Date(), transactionId: tx.id },
      });
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
