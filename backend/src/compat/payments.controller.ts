import { Controller, Get, Param, Post, Query, Body, UseGuards } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min, Max, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../users/current-user.decorator';
import { TransactionsService } from '../transactions/transactions.service';
import { WithdrawalsService } from '../withdrawals/withdrawals.service';
import { CreateTransactionDto } from '../transactions/dto/create-transaction.dto';
import { CreateWithdrawalDto } from '../withdrawals/dto/create-withdrawal.dto';
import { PrismaService } from '../prisma/prisma.service';
import { serializeTransaction } from '../transactions/transaction.serializer';

class PageQ {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize?: number = 20;
  @IsOptional() @IsString() status?: string;
}

/**
 * /api/payments/* — alias que o frontend usa pra criar/ler transações e saques.
 */
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly transactions: TransactionsService,
    private readonly withdrawals: WithdrawalsService,
    private readonly prisma: PrismaService,
  ) {}

  // POST /api/payments/internal/deposit — cria charge (Pix/cartão/boleto)
  @Post('internal/deposit')
  @UseGuards(JwtAuthGuard)
  createDeposit(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateTransactionDto,
  ) {
    return this.transactions.create(user.id, dto);
  }

  // POST /api/payments/internal/withdraw — cria saque
  @Post('internal/withdraw')
  @UseGuards(JwtAuthGuard)
  createWithdraw(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateWithdrawalDto,
  ) {
    return this.withdrawals.create(user.id, dto);
  }

  // GET /api/payments/transaction/:id — busca uma transação do seller logado
  @Get('transaction/:id')
  @UseGuards(JwtAuthGuard)
  getTransaction(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.transactions.findOne(user.id, id);
  }

  // GET /api/payments/public/transaction/:id — endpoint público (checkout)
  // Retorna só dados não-sensíveis pra renderizar a tela de pagamento.
  @Get('public/transaction/:id')
  async getPublicTransaction(@Param('id') id: string) {
    const t = await this.prisma.transaction.findUnique({ where: { id } });
    if (!t) return { success: false, message: 'Transação não encontrada.' };
    const safe = serializeTransaction(t);
    // remove dados que não devem aparecer pra cliente final
    if (safe) {
      delete (safe as any).sellerId;
      delete (safe as any).feeAmount;
      delete (safe as any).netAmount;
    }
    return { success: true, data: safe };
  }

  // GET /api/payments/infringements — disputas/chargebacks. Por enquanto vazio.
  @Get('infringements')
  @UseGuards(JwtAuthGuard)
  async infringements(
    @CurrentUser() user: { id: string },
    @Query() q: PageQ,
  ) {
    const page = q.page || 1;
    const pageSize = q.pageSize || 20;
    const skip = (page - 1) * pageSize;
    const where: any = { sellerId: user.id, status: { in: ['CHARGEBACK', 'REFUNDED'] } };
    const [items, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.transaction.count({ where }),
    ]);
    return {
      success: true,
      data: items.map(serializeTransaction),
      pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
    };
  }
}
