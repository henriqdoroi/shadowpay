/**
 * Endpoints extras /api/user/* casando com shape esperado pelo frontend.
 */
import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min, IsString, IsEnum } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../users/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { KycService } from '../kyc/kyc.service';
import { SubmitKycDto } from '../kyc/dto/submit-kyc.dto';
import { serializeTransaction } from '../transactions/transaction.serializer';

class PageDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number = 20;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize?: number;
  @IsOptional() @IsString() startDate?: string;
  @IsOptional() @IsString() endDate?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsEnum(['PIX', 'CARD', 'BOLETO', 'CRYPTO']) method?: string;
  @IsOptional() @IsString() search?: string;
}

function buildWhere(sellerId: string, q: PageDto): any {
  const where: any = { sellerId };
  if (q.status) where.status = q.status;
  if (q.method) where.method = q.method;
  if (q.search) {
    where.OR = [
      { customerName: { contains: q.search, mode: 'insensitive' } },
      { customerEmail: { contains: q.search, mode: 'insensitive' } },
      { customerCpfCnpj: { contains: q.search } },
      { externalId: { contains: q.search } },
    ];
  }
  if (q.startDate || q.endDate) {
    where.createdAt = {};
    if (q.startDate) where.createdAt.gte = new Date(q.startDate);
    if (q.endDate) where.createdAt.lte = new Date(q.endDate);
  }
  return where;
}

function pagination(page: number, limit: number, total: number) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    currentPage: page,
    limit,
    pageSize: limit,
    totalPages,
    totalCount: total,
    total,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserExtrasController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly kyc: KycService,
  ) {}

  @Get('fees')
  async fees(@CurrentUser() user: { id: string }) {
    const s = await this.prisma.seller.findUnique({
      where: { id: user.id },
      select: {
        companyName: true,
        adquererId: true,
        feePercentPix: true, feeFixedPix: true,
        feePercentCard: true, feeFixedCard: true,
        feePercentBoleto: true, feeFixedBoleto: true,
        feePercentCrypto: true, feeFixedCrypto: true,
      },
    });
    const mk = (p: any, f: any) => ({
      percentual: Number(p ?? 0),
      fixo: Number(f ?? 0),
      percentualin: Number(p ?? 0),
      fixoin: Number(f ?? 0),
    });
    return {
      success: true,
      data: {
        sellerId: user.id,
        companyName: s?.companyName ?? '',
        fees: {
          pix: mk(s?.feePercentPix, s?.feeFixedPix),
          card: mk(s?.feePercentCard, s?.feeFixedCard),
          boleto: mk(s?.feePercentBoleto, s?.feeFixedBoleto),
          crypto: mk(s?.feePercentCrypto, s?.feeFixedCrypto),
        },
        adquerer: s?.adquererId ? { txCashOut: 0, txPercentCashOut: 0 } : undefined,
      },
    };
  }

  @Get('dashboard-stats')
  async dashboardStats(@CurrentUser() user: { id: string }) {
    const wallet = await this.prisma.wallet.findFirst({ where: { sellerId: user.id } });
    return {
      success: true,
      data: {
        currentBalance: Number(wallet?.balance ?? 0),
        blockedBalance: Number(wallet?.blockedBalance ?? 0),
        reservedBalance: Number(wallet?.reservedBalance ?? 0),
      },
    };
  }

  @Get('transactions-report')
  async transactionsReport(@CurrentUser() user: { id: string }, @Query() q: PageDto) {
    const page = q.page || 1;
    const limit = q.limit || q.pageSize || 20;
    const skip = (page - 1) * limit;
    const where = buildWhere(user.id, q);
    const [items, total, paidIn, paidOutAgg] = await Promise.all([
      this.prisma.transaction.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      this.prisma.transaction.count({ where }),
      this.prisma.transaction.aggregate({
        where: { sellerId: user.id, status: 'PAID' },
        _sum: { netAmount: true },
      }),
      this.prisma.withdrawal.aggregate({
        where: { sellerId: user.id, status: 'PAID' },
        _sum: { amount: true },
      }),
    ]);
    const totalEntradas = Number(paidIn._sum.netAmount ?? 0);
    const totalSaidas = Number(paidOutAgg._sum.amount ?? 0);
    return {
      success: true,
      data: {
        summary: {
          totalTransactionado: totalEntradas + totalSaidas,
          totalEntradas,
          totalSaidas,
        },
        transactions: items.map(serializeTransaction),
        pagination: pagination(page, limit, total),
      },
    };
  }

  @Get('withdraws-report')
  async withdrawsReport(@CurrentUser() user: { id: string }, @Query() q: PageDto) {
    const page = q.page || 1;
    const limit = q.limit || q.pageSize || 20;
    const skip = (page - 1) * limit;
    const where: any = { sellerId: user.id };
    if (q.status) where.status = q.status;
    if (q.startDate || q.endDate) {
      where.createdAt = {};
      if (q.startDate) where.createdAt.gte = new Date(q.startDate);
      if (q.endDate) where.createdAt.lte = new Date(q.endDate);
    }
    const [items, total, agg, wallet] = await Promise.all([
      this.prisma.withdrawal.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      this.prisma.withdrawal.count({ where }),
      this.prisma.withdrawal.aggregate({
        where: { sellerId: user.id, status: 'PAID' },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.wallet.findFirst({ where: { sellerId: user.id } }),
    ]);
    return {
      success: true,
      data: {
        wallet: {
          currentBalance: Number(wallet?.balance ?? 0),
          blockedBalance: Number(wallet?.blockedBalance ?? 0),
        },
        summary: {
          totalSaques: Number(agg._sum.amount ?? 0),
          quantidadeSaques: agg._count ?? 0,
        },
        withdraws: items.map((w) => ({
          id: w.id,
          amount: Number(w.amount),
          feeAmount: Number(w.feeAmount),
          pixKey: w.pixKey,
          pixKeyType: w.pixKeyType,
          status: w.status,
          paidAt: w.paidAt?.toISOString() ?? null,
          createdAt: w.createdAt.toISOString(),
        })),
        pagination: pagination(page, limit, total),
      },
    };
  }

  @Get('deposits-report')
  async depositsReport(@CurrentUser() user: { id: string }, @Query() q: PageDto) {
    const page = q.page || 1;
    const limit = q.limit || q.pageSize || 20;
    const skip = (page - 1) * limit;
    const where = buildWhere(user.id, q);
    where.status = 'PAID';
    const [items, total] = await Promise.all([
      this.prisma.transaction.findMany({ where, orderBy: { paidAt: 'desc' }, skip, take: limit }),
      this.prisma.transaction.count({ where }),
    ]);
    return {
      success: true,
      data: {
        deposits: items.map((t) => ({
          id: t.id,
          method: t.method,
          status: 'approved',
          grossAmount: Number(t.grossAmount),
          netAmount: Number(t.netAmount),
          feeAmount: Number(t.feeAmount),
          customerName: t.customerName,
          customerEmail: t.customerEmail,
          paidAt: t.paidAt?.toISOString() ?? null,
          createdAt: t.createdAt.toISOString(),
        })),
        pagination: pagination(page, limit, total),
      },
    };
  }

  @Post('kyc/start')
  async kycStart(@CurrentUser() user: { id: string }) {
    await this.prisma.kyc.update({
      where: { sellerId: user.id },
      data: { status: 'PENDING', message: 'Iniciado pelo seller.' },
    });
    const k = await this.prisma.kyc.findUnique({ where: { sellerId: user.id } }); return { success: true, message: 'Fluxo de KYC iniciado.', data: { kycId: k?.id } };
  }

  @Post('kyc/documents')
  kycDocuments(@CurrentUser() user: { id: string }, @Body() dto: SubmitKycDto) {
    return this.kyc.submit(user.id, dto);
  }
}
