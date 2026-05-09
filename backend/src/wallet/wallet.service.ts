/**
 * WalletService — TODA operação de saldo passa por aqui.
 *
 * Garantias:
 * - Lock pessimista (SELECT ... FOR UPDATE) na linha da wallet, em uma
 *   transação Prisma "interactive". Sem race conditions em alto volume.
 * - Cada mudança de saldo gera UM WalletEntry (extrato/ledger).
 * - Operações são idempotentes onde possível (creditPaid valida que a
 *   transaction não foi processada antes).
 *
 * Importante: nunca chame `prisma.wallet.update(...)` direto em outros
 * lugares. Sempre passe por aqui.
 */
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WalletService {
  private readonly logger = new Logger('Wallet');

  constructor(private readonly prisma: PrismaService) {}

  // ------------------------------------------------------------------
  // Read helpers (sem lock)
  // ------------------------------------------------------------------

  async getOrCreateWallet(sellerId: string) {
    let w = await this.prisma.wallet.findFirst({ where: { sellerId } });
    if (!w) {
      w = await this.prisma.wallet.create({ data: { sellerId } });
    }
    return w;
  }

  // ------------------------------------------------------------------
  // Operações com lock
  // ------------------------------------------------------------------

  /**
   * Credita o netAmount de uma Transaction PAID. Idempotente:
   * se já existe WalletEntry tipo IN ligado a essa transactionId, não duplica.
   */
  async creditPaid(transactionId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const t = await tx.transaction.findUnique({ where: { id: transactionId } });
      if (!t) throw new NotFoundException('Transação não encontrada.');
      if (t.status !== 'PAID') {
        throw new BadRequestException('Transação não está PAID.');
      }

      // Idempotência: já creditamos antes?
      const existing = await tx.walletEntry.findFirst({
        where: { transactionId, type: TransactionType.IN },
      });
      if (existing) return;

      const wallet = await this.lockWallet(tx, t.sellerId);

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: t.netAmount } },
      });

      await tx.walletEntry.create({
        data: {
          sellerId: t.sellerId,
          transactionId: t.id,
          type: TransactionType.IN,
          amount: t.netAmount,
          description: `Crédito venda ${t.id}`,
        },
      });

      // Registra a fee como ledger separado (informativo)
      if (Number(t.feeAmount) > 0) {
        await tx.walletEntry.create({
          data: {
            sellerId: t.sellerId,
            transactionId: t.id,
            type: TransactionType.FEE,
            amount: t.feeAmount,
            description: `Taxa venda ${t.id}`,
          },
        });
      }
    });
  }

  /**
   * Move `amount` de balance pra blockedBalance. Usado quando seller
   * solicita saque: o dinheiro fica reservado até PSP confirmar payout.
   */
  async holdForWithdraw(sellerId: string, amount: number, withdrawalId: string): Promise<void> {
    if (amount <= 0) throw new BadRequestException('Valor inválido.');

    await this.prisma.$transaction(async (tx) => {
      const wallet = await this.lockWallet(tx, sellerId);
      const available = Number(wallet.balance);
      if (available < amount) {
        throw new BadRequestException(
          `Saldo insuficiente. Disponível: R$ ${available.toFixed(2)}`,
        );
      }
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { decrement: amount },
          blockedBalance: { increment: amount },
        },
      });
      await tx.walletEntry.create({
        data: {
          sellerId,
          type: TransactionType.OUT,
          amount,
          description: `Reserva saque ${withdrawalId}`,
        },
      });
    });
  }

  /**
   * Saque confirmado pago — remove definitivamente do blockedBalance.
   */
  async consumeHold(sellerId: string, amount: number, withdrawalId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const wallet = await this.lockWallet(tx, sellerId);
      const blocked = Number(wallet.blockedBalance);
      if (blocked < amount) {
        // Inconsistência — alguém reduziu blockedBalance fora daqui.
        // Loga e prossegue: não bloqueia o consume, apenas zera.
        this.logger.error(
          `Hold inconsistente seller=${sellerId} blocked=${blocked} amount=${amount}`,
        );
      }
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          blockedBalance: { decrement: Math.min(blocked, amount) },
        },
      });
      await tx.walletEntry.create({
        data: {
          sellerId,
          type: TransactionType.OUT,
          amount,
          description: `Saque pago ${withdrawalId}`,
        },
      });
    });
  }

  /**
   * Saque falhou/cancelado — devolve blockedBalance -> balance.
   */
  async releaseHold(sellerId: string, amount: number, withdrawalId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const wallet = await this.lockWallet(tx, sellerId);
      const blocked = Number(wallet.blockedBalance);
      const give = Math.min(blocked, amount);
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { increment: give },
          blockedBalance: { decrement: give },
        },
      });
      await tx.walletEntry.create({
        data: {
          sellerId,
          type: TransactionType.REFUND,
          amount: give,
          description: `Saque cancelado ${withdrawalId}`,
        },
      });
    });
  }

  /**
   * Ajuste manual feito por admin. amount pode ser negativo.
   */
  async adminAdjust(
    sellerId: string,
    amount: number,
    description: string,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const wallet = await this.lockWallet(tx, sellerId);
      if (amount < 0 && Number(wallet.balance) + amount < 0) {
        throw new BadRequestException('Ajuste deixaria saldo negativo.');
      }
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amount } },
      });
      await tx.walletEntry.create({
        data: {
          sellerId,
          type: TransactionType.ADJUSTMENT,
          amount,
          description,
        },
      });
    });
  }

  // ------------------------------------------------------------------
  // Lock primitivo
  // ------------------------------------------------------------------

  /**
   * SELECT ... FOR UPDATE na wallet do seller. Cria a wallet se não existe
   * (com lock pra evitar duas threads criarem duas wallets).
   */
  private async lockWallet(tx: Prisma.TransactionClient, sellerId: string) {
    const rows = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "Wallet" WHERE "sellerId" = ${sellerId} FOR UPDATE
    `;
    if (rows.length === 0) {
      const w = await tx.wallet.create({ data: { sellerId } });
      // Re-lock pra próxima leitura
      await tx.$queryRaw`SELECT id FROM "Wallet" WHERE id = ${w.id} FOR UPDATE`;
      return w;
    }
    const wallet = await tx.wallet.findUnique({ where: { id: rows[0].id } });
    if (!wallet) throw new NotFoundException('Wallet sumiu durante a transação.');
    return wallet;
  }
}
