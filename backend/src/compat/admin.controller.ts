/**
 * /api/admin/* — endpoints administrativos com shapes EXATOS que o frontend espera.
 */
import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsNumber, IsObject, IsOptional, IsString, Max, Min } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../manager/admin.guard';
import { ManagerService } from '../manager/manager.service';
import { PrismaService } from '../prisma/prisma.service';
import { serializeSeller } from '../users/seller.serializer';
import { serializeTransaction } from '../transactions/transaction.serializer';

class ListQuery {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() kycStatus?: string;
  @IsOptional() @IsString() sellerId?: string;
  @IsOptional() @IsString() startDate?: string;
  @IsOptional() @IsString() endDate?: string;
  @IsOptional() @IsString() adquirente?: string;
}

class WithdrawalStatusDto {
  @IsEnum(['PAID', 'FAILED', 'PROCESSING'])
  status!: 'PAID' | 'FAILED' | 'PROCESSING';
}

class UpsertAcquirerDto {
  @IsString() name!: string;
  @IsOptional() @IsBoolean() enabled?: boolean;
  @IsObject() config!: any;
}

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(
    private readonly manager: ManagerService,
    private readonly prisma: PrismaService,
  ) {}

  // GET /api/admin/dashboard/stats — frontend espera shape MUITO específico
  @Get('dashboard/stats')
  async dashboardStats(@Query() q: ListQuery) {
    const where: any = {};
    if (q.startDate || q.endDate) {
      where.createdAt = {};
      if (q.startDate) where.createdAt.gte = new Date(q.startDate);
      if (q.endDate) where.createdAt.lte = new Date(q.endDate);
    }

    const [
      walletAgg,
      paidAgg,
      pendingAgg,
      analysisAgg,
      paidWithdraws,
      pendingWithdraws,
      sellersTotal,
      sellersBlocked,
      kycPending,
      kycTotal,
      kycApproved,
      paidWithFilter,
      transacoesDetalhadas,
    ] = await Promise.all([
      this.prisma.wallet.aggregate({ _sum: { balance: true, blockedBalance: true } }),
      this.prisma.transaction.aggregate({
        where: { ...where, status: 'PAID' },
        _sum: { grossAmount: true, netAmount: true, feeAmount: true },
        _count: true,
      }),
      this.prisma.transaction.count({ where: { ...where, status: 'PENDING' } }),
      this.prisma.transaction.count({ where: { ...where, status: 'PROCESSING' } }),
      this.prisma.withdrawal.aggregate({
        where: { ...where, status: 'PAID' },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.withdrawal.aggregate({
        where: { ...where, status: 'PENDING' },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.seller.count({ where: { deletedAt: null } }),
      this.prisma.seller.count({ where: { suspendedAt: { not: null } } }),
      this.prisma.kyc.count({ where: { status: 'PENDING' } }),
      this.prisma.kyc.count({}),
      this.prisma.kyc.count({ where: { status: 'APPROVED' } }),
      this.prisma.transaction.findMany({
        where: { ...where, status: 'PAID' },
        take: 200,
        orderBy: { paidAt: 'desc' },
      }),
      this.prisma.transaction.findMany({
        where: { ...where, status: 'PAID' },
        take: 50,
        orderBy: { paidAt: 'desc' },
      }),
    ]);

    const totalEmCarteiras = Number(walletAgg._sum.balance ?? 0);
    const lucroLiquido = Number(paidAgg._sum.feeAmount ?? 0); // taxa que ficou na plataforma
    const transacoesAprovadasTotal = paidAgg._count;
    const transacoesAprovadasValor = Number(paidAgg._sum.grossAmount ?? 0);
    const totalRetiradasValor = Number(paidWithdraws._sum.amount ?? 0);
    const retiradasPendentesValor = Number(pendingWithdraws._sum.amount ?? 0);
    const taxaAprovacao = kycTotal === 0 ? 0 : (kycApproved / kycTotal) * 100;

    return {
      success: true,
      data: {
        transacoesDetalhadas: transacoesDetalhadas.map((t) => ({
          id: t.id,
          gatewayId: t.pspName ?? '',
          valor: Number(t.grossAmount),
          amountNet: Number(t.netAmount),
          taxa: Number(t.feeAmount),
          status: t.status,
        })),
        totalEmCarteiras: { valor: totalEmCarteiras.toFixed(2), crescimento: 0 },
        lucroLiquido: { valor: lucroLiquido.toFixed(2), crescimento: 0 },
        transacoesAprovadas: { valor: transacoesAprovadasValor, crescimento: 0 },
        transacoesPendentes: { valor: pendingAgg },
        usuariosCadastrados: { valor: sellersTotal, crescimento: 0 },
        kycPendentes: { valor: kycPending },
        totalEmRetiradas: { valor: totalRetiradasValor, crescimento: 0 },
        retiradasPendentes: { valor: retiradasPendentesValor.toFixed(2) },
        resumoFinanceiro: {
          totalEmCarteiras: totalEmCarteiras.toFixed(2),
          lucroLiquido: lucroLiquido.toFixed(2),
          totalRetiradas: totalRetiradasValor,
          pendentes: retiradasPendentesValor.toFixed(2),
        },
        transacoes: {
          aprovadas: transacoesAprovadasTotal,
          pendentes: pendingAgg,
          emAnalise: analysisAgg,
          totalProcessadas: transacoesAprovadasTotal + pendingAgg + analysisAgg,
        },
        usuarios: {
          cadastrados: sellersTotal,
          bloqueados: sellersBlocked,
          kycPendentes: kycPending,
          taxaAprovacao,
        },
        saldoGateways: {
          saldoGateways: totalEmCarteiras,
          positivos: [],
          negativos: [],
          detalhado: [],
        },
        negativeAccounts: [],
      },
    };
  }

  // GET /api/admin/sellers?page=N — frontend espera { sellers, pagination: { pages } }
  @Get('sellers')
  async listSellers(@Query() q: ListQuery) {
    const page = q.page || 1;
    const pageSize = q.pageSize || q.limit || 20;
    const skip = (page - 1) * pageSize;
    const where: any = {};
    if (q.search) {
      where.OR = [
        { companyName: { contains: q.search, mode: 'insensitive' } },
        { email: { contains: q.search, mode: 'insensitive' } },
        { cpf_cnpj: { contains: q.search } },
      ];
    }
    if (q.kycStatus) where.kyc = { status: q.kycStatus };

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
    const pages = Math.max(1, Math.ceil(total / pageSize));
    return {
      success: true,
      data: {
        sellers: items.map((s) => ({
          ...serializeSeller(s),
          companyName: s.companyName,
        })),
        pagination: { pages, page, total, pageSize },
      },
    };
  }

  @Get('sellers/:id')
  getSeller(@Param('id') id: string) {
    return this.manager.getSeller(id);
  }

  @Patch('sellers/:id')
  updateSeller(@Param('id') id: string, @Body() body: any) {
    return this.manager.updateSeller(id, body);
  }

  // GET /api/admin/transactions — frontend espera { transactions: [{ valor, taxa, ... }] }
  @Get('transactions')
  async listTransactions(@Query() q: ListQuery) {
    const page = q.page || 1;
    const pageSize = q.pageSize || q.limit || 100;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    // Frontend pode mandar status="APPROVED" mas no banco é "PAID"
    if (q.status) {
      const map: Record<string, string> = { APPROVED: 'PAID', approved: 'PAID' };
      where.status = map[q.status] ?? q.status;
    }
    if (q.sellerId) where.sellerId = q.sellerId;
    if (q.startDate || q.endDate) {
      where.createdAt = {};
      if (q.startDate) where.createdAt.gte = new Date(q.startDate);
      if (q.endDate) where.createdAt.lte = new Date(q.endDate);
    }

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

    const pages = Math.max(1, Math.ceil(total / pageSize));

    return {
      success: true,
      data: {
        transactions: items.map((t: any) => ({
          ...serializeTransaction(t),
          // Aliases que o frontend usa
          transactionId: t.id,
          amount: Number(t.grossAmount),
          amountFee: Number(t.feeAmount),
          amountNet: Number(t.netAmount),
          valor: Number(t.grossAmount),
          taxa: Number(t.feeAmount),
          paymentMethod: t.method,
          paymentData: { name: t.customerName ?? '' },
          transactionType: 'deposit',
          gatewayId: t.pspName ?? '',
          seller: t.seller,
        })),
        pagination: { pages, page, total, pageSize },
      },
    };
  }

  @Get('withdraw')
  listWithdrawals(@Query() q: ListQuery) {
    return this.manager.listWithdrawals(q.page, q.pageSize, q.status);
  }

  @Patch('withdraw/:id')
  updateWithdrawalStatus(@Param('id') id: string, @Body() body: WithdrawalStatusDto) {
    return this.manager.updateWithdrawalStatus(id, body.status);
  }

  @Get('adquerers')
  listAcquirers() {
    return this.manager.listAcquirers();
  }

  @Post('adquerers')
  upsertAcquirer(@Body() body: UpsertAcquirerDto) {
    return this.manager.upsertAcquirer(body);
  }

  @Get('kyc/:sellerId')
  async getSellerKyc(@Param('sellerId') sellerId: string) {
    const k = await this.prisma.kyc.findUnique({ where: { sellerId } });
    return { success: true, data: k };
  }

  @Post('kyc/:sellerId/approve')
  approveKyc(@Param('sellerId') sellerId: string, @Body() body: { message?: string }) {
    return this.manager.approveKyc(sellerId, body?.message);
  }

  @Post('kyc/:sellerId/reject')
  rejectKyc(@Param('sellerId') sellerId: string, @Body() body: { message?: string }) {
    return this.manager.rejectKyc(sellerId, body?.message ?? '');
  }

  @Get('wallets/:sellerId')
  async getWallet(@Param('sellerId') sellerId: string) {
    const w = await this.prisma.wallet.findFirst({ where: { sellerId } });
    return { success: true, data: w };
  }
}
