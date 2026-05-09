/**
 * /api/sales — vendas pagas + endpoint público de venda.
 */
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../users/current-user.decorator';
import { TransactionsService } from '../transactions/transactions.service';
import { PrismaService } from '../prisma/prisma.service';
import { serializeTransaction } from '../transactions/transaction.serializer';

class SalesQuery {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(1000) pageSize?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(1000) limit?: number;
  @IsOptional() @IsString() status?: string;
}

function mapStatus(s?: string): string | undefined {
  if (!s) return undefined;
  const m: Record<string, string> = { APPROVED: 'PAID', approved: 'PAID', PAID: 'PAID', paid: 'PAID' };
  return m[s] ?? s.toUpperCase();
}

@Controller('sales')
export class SalesExtrasController {
  constructor(
    private readonly transactions: TransactionsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  list(@CurrentUser() user: { id: string }, @Query() q: SalesQuery) {
    return this.transactions.list(user.id, {
      page: q.page,
      pageSize: q.pageSize ?? q.limit,
      status: mapStatus(q.status) ?? 'PAID',
    });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    if (id === 'public') return { success: false, message: 'rota inválida' };
    return this.transactions.findOne(user.id, id);
  }

  @Get('public/:id')
  async findPublic(@Param('id') id: string) {
    const t = await this.prisma.transaction.findUnique({ where: { id } });
    if (!t) return { success: false, message: 'Não encontrada.' };
    const safe: any = serializeTransaction(t);
    if (safe) {
      delete safe.sellerId;
      delete safe.feeAmount;
      delete safe.netAmount;
    }
    return { success: true, data: safe };
  }
}
