import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { serializeSeller } from '../users/seller.serializer';
import { serializeTransaction } from '../transactions/transaction.serializer';
import { WalletService } from '../wallet/wallet.service';
import { EmailService } from '../email/email.service';

/**
 * Painel de admin do gateway. Tudo aqui passa pelo AdminGuard,
 * só seller.isAdministrator vê.
 */
@Injectable()
export class ManagerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wallet: WalletService,
    private readonly email: EmailService,
  ) {}

  // ----------------------------------------------------------------
  // Sellers / Users
  // ----------------------------------------------------------------
  async listSellers(page = 1, pageSize = 20, search?: string, kycStatus?: string) {
    const skip = (page - 1) * pageSize;
    const where: any = {};
    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { cpf_cnpj: { contains: search } },
      ];
    }
    if (kycStatus) {
      where.kyc = { status: kycStatus };
    }

    const [items, total] = await Promise.all([
      this.prisma.seller.findMany({
        where,
        include: { wallet: true, credentials: true, kyc: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.seller.count({ where }),
    ]);

    return {
      success: true,
      data: items.map(serializeSeller),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  }

  async getSeller(id: string) {
    const s = await this.prisma.seller.findUnique({
      where: { id },
      include: { wallet: true, credentials: true, kyc: true },
    });
    if (!s) throw new NotFoundException('Seller não encontrado.');
    return { success: true, data: serializeSeller(s) };
  }

  async updateSeller(
    id: string,
    body: {
      isAdministrator?: boolean;
      suspendedAt?: string | null;
      feePercentPix?: number;
      feeFixedPix?: number;
      feePercentCard?: number;
      feeFixedCard?: number;
      feePercentBoleto?: number;
      feeFixedBoleto?: number;
      feePercentCrypto?: number;
      feeFixedCrypto?: number;
      adquererId?: string | null;
    },
  ) {
    const s = await this.prisma.seller.update({
      where: { id },
      data: {
        ...(body.isAdministrator !== undefined && { isAdministrator: body.isAdministrator }),
        ...(body.suspendedAt !== undefined && {
          suspendedAt: body.suspendedAt ? new Date(body.suspendedAt) : null,
        }),
        ...(body.feePercentPix !== undefined && { feePercentPix: body.feePercentPix }),
        ...(body.feeFixedPix !== undefined && { feeFixedPix: body.feeFixedPix }),
        ...(body.feePercentCard !== undefined && { feePercentCard: body.feePercentCard }),
        ...(body.feeFixedCard !== undefined && { feeFixedCard: body.feeFixedCard }),
        ...(body.feePercentBoleto !== undefined && { feePercentBoleto: body.feePercentBoleto }),
        ...(body.feeFixedBoleto !== undefined && { feeFixedBoleto: body.feeFixedBoleto }),
        ...(body.feePercentCrypto !== undefined && { feePercentCrypto: body.feePercentCrypto }),
        ...(body.feeFixedCrypto !== undefined && { feeFixedCrypto: body.feeFixedCrypto }),
        ...(body.adquererId !== undefined && { adquererId: body.adquererId }),
      },
      include: { wallet: true, credentials: true, kyc: true },
    });
    return { success: true, data: serializeSeller(s) };
  }

  async approveKyc(sellerId: string, message?: string) {
    const k = await this.prisma.kyc.update({
      where: { sellerId },
      data: { status: 'APPROVED', message: message ?? 'Aprovado.', reviewedAt: new Date() },
    });
    const seller = await this.prisma.seller.findUnique({ where: { id: sellerId } });
    if (seller) {
      this.email.sendKycApproved(seller.email, seller.companyName).catch(() => {});
    }
    return { success: true, data: k };
  }

  async rejectKyc(sellerId: string, message: string) {
    if (!message?.trim()) {
      throw new BadRequestException('Motivo da rejeição é obrigatório.');
    }
    const k = await this.prisma.kyc.update({
      where: { sellerId },
      data: { status: 'BANNED', message, reviewedAt: new Date() },
    });
    const seller = await this.prisma.seller.findUnique({ where: { id: sellerId } });
    if (seller) {
      this.email.sendKycRejected(seller.email, seller.companyName, message).catch(() => {});
    }
    return { success: true, data: k };
  }

  /** Ajuste manual de saldo (positivo ou negativo). Usa lock atômico. */
  async walletAdjust(sellerId: string, amount: number, reason: string) {
    if (!Number.isFinite(amount) || amount === 0) {
      throw new BadRequestException('Valor inválido.');
    }
    if (!reason?.trim()) {
      throw new BadRequestException('Motivo obrigatório.');
    }
    await this.wallet.adminAdjust(sellerId, amount, `[admin] ${reason}`);
    const fresh = await this.prisma.wallet.findFirst({ where: { sellerId } });
    return { success: true, data: fresh };
  }

  // ----------------------------------------------------------------
  // Transactions (todas, de todos os sellers)
  // ----------------------------------------------------------------
  async listTransactions(page = 1, pageSize = 20, status?: string, sellerId?: string) {
    const skip = (page - 1) * pageSize;
    const where: any = {};
    if (status) where.status = status;
    if (sellerId) where.sellerId = sellerId;

    const [items, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: { seller: { select: { id: true, companyName: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      success: true,
      data: items.map((t) => ({
        ...serializeTransaction(t),
        seller: (t as any).seller,
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  }

  // ----------------------------------------------------------------
  // Withdrawals (admin pode aprovar/rejeitar manualmente)
  // ----------------------------------------------------------------
  async listWithdrawals(page = 1, pageSize = 20, status?: string) {
    const skip = (page - 1) * pageSize;
    const where: any = {};
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.withdrawal.findMany({
        where,
        include: { seller: { select: { id: true, companyName: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.withdrawal.count({ where }),
    ]);
    return {
      success: true,
      data: items,
      pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
    };
  }

  /**
   * Aprova/rejeita um saque manualmente. Mexe na wallet de forma atômica:
   * - PAID: consome o hold (blockedBalance -= amount).
   * - FAILED: libera o hold (blockedBalance -> balance).
   * - PROCESSING: só muda status.
   */
  async updateWithdrawalStatus(
    id: string,
    status: 'PAID' | 'FAILED' | 'PROCESSING',
  ) {
    const w = await this.prisma.withdrawal.findUnique({ where: { id } });
    if (!w) throw new NotFoundException('Saque não encontrado.');

    if (status === 'PAID') {
      if (w.status === 'PAID') return { success: true, data: w };
      await this.wallet.consumeHold(w.sellerId, Number(w.amount), w.id);
      const updated = await this.prisma.withdrawal.update({
        where: { id },
        data: { status: 'PAID', paidAt: new Date() },
      });
      const seller = await this.prisma.seller.findUnique({ where: { id: w.sellerId } });
      if (seller) {
        this.email
          .sendWithdrawalPaid(seller.email, Number(w.amount), seller.companyName)
          .catch(() => {});
      }
      return { success: true, data: updated };
    }

    if (status === 'FAILED') {
      if (w.status === 'FAILED') return { success: true, data: w };
      // Só libera se estava reservado (PENDING/PROCESSING)
      if (w.status === 'PENDING' || w.status === 'PROCESSING') {
        await this.wallet.releaseHold(w.sellerId, Number(w.amount), w.id);
      }
      const updated = await this.prisma.withdrawal.update({
        where: { id },
        data: { status: 'FAILED', paidAt: null },
      });
      return { success: true, data: updated };
    }

    // PROCESSING — só transição de status
    const updated = await this.prisma.withdrawal.update({
      where: { id },
      data: { status: 'PROCESSING' },
    });
    return { success: true, data: updated };
  }

  // ----------------------------------------------------------------
  // Acquirers (PSPs cadastrados)
  // ----------------------------------------------------------------
  async listAcquirers() {
    const items = await this.prisma.acquirer.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: items };
  }

  async upsertAcquirer(body: { name: string; enabled?: boolean; config: any }) {
    const a = await this.prisma.acquirer.upsert({
      where: { name: body.name.toLowerCase() },
      create: {
        name: body.name.toLowerCase(),
        enabled: body.enabled ?? true,
        config: body.config ?? {},
      },
      update: {
        enabled: body.enabled,
        config: body.config,
      },
    });
    return { success: true, data: a };
  }

  // ----------------------------------------------------------------
  // Audit log
  // ----------------------------------------------------------------
  async listAudit(page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.auditLog.count(),
    ]);
    return {
      success: true,
      data: items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  }

  // ----------------------------------------------------------------
  // Métricas globais
  // ----------------------------------------------------------------
  async overview() {
    const [sellersCount, paidAgg, pendingAgg, withdrawalAgg] = await Promise.all([
      this.prisma.seller.count({ where: { deletedAt: null } }),
      this.prisma.transaction.aggregate({
        where: { status: 'PAID' },
        _sum: { grossAmount: true, netAmount: true, feeAmount: true },
        _count: true,
      }),
      this.prisma.transaction.aggregate({
        where: { status: 'PENDING' },
        _count: true,
      }),
      this.prisma.withdrawal.aggregate({
        where: { status: 'PENDING' },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    return {
      success: true,
      data: {
        sellers: sellersCount,
        paidTransactions: paidAgg._count,
        platformGross: Number(paidAgg._sum.grossAmount ?? 0),
        platformNet: Number(paidAgg._sum.netAmount ?? 0),
        platformFees: Number(paidAgg._sum.feeAmount ?? 0),
        pendingTransactions: pendingAgg._count,
        pendingWithdrawals: withdrawalAgg._count,
        pendingWithdrawalsAmount: Number(withdrawalAgg._sum.amount ?? 0),
      },
    };
  }
}
