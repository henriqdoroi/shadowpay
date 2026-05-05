/**
 * Endpoints extras em /api/user/* que o frontend espera mas não existiam:
 *   - GET /api/user/fees
 *   - GET /api/user/dashboard-stats
 *   - GET /api/user/transactions-report
 *   - GET /api/user/withdraws-report
 *   - GET /api/user/deposits-report
 *   - POST /api/user/kyc/start
 *   - POST /api/user/kyc/documents
 */
import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min, IsString, IsEnum } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../users/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { ReportsService } from '../reports/reports.service';
import { TransactionsService } from '../transactions/transactions.service';
import { WithdrawalsService } from '../withdrawals/withdrawals.service';
import { KycService } from '../kyc/kyc.service';
import { SubmitKycDto } from '../kyc/dto/submit-kyc.dto';

class PageDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize?: number = 20;
  @IsOptional() @IsString() startDate?: string;
  @IsOptional() @IsString() endDate?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional()
  @IsEnum(['PIX', 'CARD', 'BOLETO', 'CRYPTO'])
  method?: string;
  @IsOptional() @IsString() search?: string;
}

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserExtrasController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reports: ReportsService,
    private readonly transactions: TransactionsService,
    private readonly withdrawals: WithdrawalsService,
    private readonly kyc: KycService,
  ) {}

  // GET /api/user/fees — taxas que o seller paga
  @Get('fees')
  async fees(@CurrentUser() user: { id: string }) {
    const s = await this.prisma.seller.findUnique({
      where: { id: user.id },
      select: {
        feePercentPix: true,
        feeFixedPix: true,
        feePercentCard: true,
        feeFixedCard: true,
        feePercentBoleto: true,
        feeFixedBoleto: true,
        feePercentCrypto: true,
        feeFixedCrypto: true,
      },
    });
    return {
      success: true,
      data: {
        pix: { percent: Number(s?.feePercentPix ?? 0), fixed: String(s?.feeFixedPix ?? '0') },
        card: { percent: Number(s?.feePercentCard ?? 0), fixed: String(s?.feeFixedCard ?? '0') },
        boleto: { percent: Number(s?.feePercentBoleto ?? 0), fixed: String(s?.feeFixedBoleto ?? '0') },
        crypto: { percent: Number(s?.feePercentCrypto ?? 0), fixed: String(s?.feeFixedCrypto ?? '0') },
      },
    };
  }

  // GET /api/user/dashboard-stats — cards do dashboard
  @Get('dashboard-stats')
  dashboardStats(@CurrentUser() user: { id: string }) {
    return this.reports.summary(user.id);
  }

  // GET /api/user/transactions-report — todas transações (PIX/CARD/BOLETO/CRYPTO) com filtros
  @Get('transactions-report')
  transactionsReport(@CurrentUser() user: { id: string }, @Query() q: PageDto) {
    return this.transactions.list(user.id, {
      page: q.page,
      pageSize: q.pageSize,
      status: q.status,
      method: q.method,
      search: q.search,
      startDate: q.startDate,
      endDate: q.endDate,
    });
  }

  // GET /api/user/withdraws-report
  @Get('withdraws-report')
  withdrawsReport(@CurrentUser() user: { id: string }, @Query() q: PageDto) {
    return this.withdrawals.list(user.id, q.page, q.pageSize);
  }

  // GET /api/user/deposits-report — só transações PAID
  @Get('deposits-report')
  depositsReport(@CurrentUser() user: { id: string }, @Query() q: PageDto) {
    return this.transactions.list(user.id, {
      page: q.page,
      pageSize: q.pageSize,
      status: 'PAID',
      method: q.method,
      search: q.search,
      startDate: q.startDate,
      endDate: q.endDate,
    });
  }

  // POST /api/user/kyc/start — frontend dispara isso ao começar o fluxo
  @Post('kyc/start')
  async kycStart(@CurrentUser() user: { id: string }) {
    await this.prisma.kyc.update({
      where: { sellerId: user.id },
      data: { status: 'PENDING', message: 'Iniciado pelo seller.' },
    });
    return { success: true, message: 'Fluxo de KYC iniciado.' };
  }

  // POST /api/user/kyc/documents — frontend manda URLs dos uploads aqui
  @Post('kyc/documents')
  kycDocuments(@CurrentUser() user: { id: string }, @Body() dto: SubmitKycDto) {
    return this.kyc.submit(user.id, dto);
  }
}
