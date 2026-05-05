import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { serializeSeller } from '../users/seller.serializer';
import { serializeTransaction } from '../transactions/transaction.serializer';

/**
 * Painel de admin do gateway. Tudo aqui passa pelo AdminGuard,
 * só seller.isAdministrator vê.
 */
@Injectable()
export class ManagerService {
  constructor(private readonly prisma: PrismaService) {}

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
    return { success: true, data: k };
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

  async updateWithdrawalStatus(id: string, status: 'PAID' | 'FAILED' | 'PROCESSING') {
    const w = await this.prisma.withdrawal.update({
      where: { id },
      data: {
        status,
        paidAt: status === 'PAID' ? new Date() : null,
      },
    });
    return { success: true, data: w };
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
