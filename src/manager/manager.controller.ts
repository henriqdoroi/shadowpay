import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from './admin.guard';
import { ManagerService } from './manager.service';

class ListQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  kycStatus?: string;

  @IsOptional()
  @IsString()
  sellerId?: string;
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

class KycReviewDto {
  @IsOptional() @IsString() @MaxLength(500) message?: string;
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

/**
 * /api/manager/* — todas exigem JWT + isAdministrator.
 */
@Controller('manager')
@UseGuards(JwtAuthGuard, AdminGuard)
export class ManagerController {
  constructor(private readonly service: ManagerService) {}

  // Métricas globais (cards do dashboard admin)
  @Get('overview')
  overview() {
    return this.service.overview();
  }

  // ---- Sellers / Users
  @Get('users')
  listSellers(@Query() q: ListQuery) {
    return this.service.listSellers(q.page, q.pageSize, q.search, q.kycStatus);
  }

  @Get('users/:id')
  getSeller(@Param('id') id: string) {
    return this.service.getSeller(id);
  }

  @Patch('users/:id')
  updateSeller(@Param('id') id: string, @Body() body: UpdateSellerDto) {
    return this.service.updateSeller(id, body);
  }

  @Post('users/:id/kyc/approve')
  approveKyc(@Param('id') id: string, @Body() body: KycReviewDto) {
    return this.service.approveKyc(id, body.message);
  }

  @Post('users/:id/kyc/reject')
  rejectKyc(@Param('id') id: string, @Body() body: KycReviewDto) {
    return this.service.rejectKyc(id, body.message ?? '');
  }

  // ---- Transactions
  @Get('transactions')
  listTransactions(@Query() q: ListQuery) {
    return this.service.listTransactions(q.page, q.pageSize, q.status, q.sellerId);
  }

  // ---- Withdrawals
  @Get('withdraw')
  listWithdrawals(@Query() q: ListQuery) {
    return this.service.listWithdrawals(q.page, q.pageSize, q.status);
  }

  @Patch('withdraw/:id')
  updateWithdrawalStatus(@Param('id') id: string, @Body() body: WithdrawalStatusDto) {
    return this.service.updateWithdrawalStatus(id, body.status);
  }

  // ---- Acquirers (PSPs cadastrados)
  @Get('adquerers')
  listAcquirers() {
    return this.service.listAcquirers();
  }

  @Post('adquerers')
  upsertAcquirer(@Body() body: UpsertAcquirerDto) {
    return this.service.upsertAcquirer(body);
  }

  // alias antigo do frontend
  @Get('psp-key')
  pspKeys() {
    return this.service.listAcquirers();
  }
}
