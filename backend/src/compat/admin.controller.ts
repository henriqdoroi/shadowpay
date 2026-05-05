/**
 * Aliases /api/admin/* que o frontend usa, mapeando para o ManagerService.
 * Mantém /api/manager/* (canônico) funcionando em paralelo.
 */
import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsNumber, IsObject, IsOptional, IsString, Max, Min } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../manager/admin.guard';
import { ManagerService } from '../manager/manager.service';
import { PrismaService } from '../prisma/prisma.service';

class ListQuery {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize?: number = 20;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() kycStatus?: string;
  @IsOptional() @IsString() sellerId?: string;
}

class UpdateSellerDto {
  @IsOptional() @IsBoolean() isAdministrator?: boolean;
  @IsOptional() @IsString() suspendedAt?: string | null;
  @IsOptional() @IsNumber() feePercentPix?: number;
  @IsOptional() @IsNumber() feeFixedPix?: number;
  @IsOptional() @IsNumber() feePercentCard?: number;
  @IsOptional() @IsNumber() feeFixedCard?: number;
  @IsOptional() @IsNumber() feePercentBoleto?: number;
  @IsOptional() @IsNumber() feeFixedBoleto?: number;
  @IsOptional() @IsNumber() feePercentCrypto?: number;
  @IsOptional() @IsNumber() feeFixedCrypto?: number;
  @IsOptional() @IsString() adquererId?: string | null;
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

  // GET /api/admin/dashboard/stats — métricas globais
  @Get('dashboard/stats')
  dashboardStats() {
    return this.manager.overview();
  }

  // ---- Sellers
  @Get('sellers')
  listSellers(@Query() q: ListQuery) {
    return this.manager.listSellers(q.page, q.pageSize, q.search, q.kycStatus);
  }

  @Get('sellers/:id')
  getSeller(@Param('id') id: string) {
    return this.manager.getSeller(id);
  }

  @Patch('sellers/:id')
  updateSeller(@Param('id') id: string, @Body() body: UpdateSellerDto) {
    return this.manager.updateSeller(id, body);
  }

  // ---- Transactions
  @Get('transactions')
  listTransactions(@Query() q: ListQuery) {
    return this.manager.listTransactions(q.page, q.pageSize, q.status, q.sellerId);
  }

  // ---- Withdrawals
  @Get('withdraw')
  listWithdrawals(@Query() q: ListQuery) {
    return this.manager.listWithdrawals(q.page, q.pageSize, q.status);
  }

  @Patch('withdraw/:id')
  updateWithdrawalStatus(@Param('id') id: string, @Body() body: WithdrawalStatusDto) {
    return this.manager.updateWithdrawalStatus(id, body.status);
  }

  // ---- Acquirers (PSPs cadastrados)
  @Get('adquerers')
  listAcquirers() {
    return this.manager.listAcquirers();
  }

  @Post('adquerers')
  upsertAcquirer(@Body() body: UpsertAcquirerDto) {
    return this.manager.upsertAcquirer(body);
  }

  // ---- KYC
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

  // ---- Wallets (dado bruto da carteira de um seller)
  @Get('wallets/:sellerId')
  async getWallet(@Param('sellerId') sellerId: string) {
    const w = await this.prisma.wallet.findFirst({ where: { sellerId } });
    return { success: true, data: w };
  }
}
