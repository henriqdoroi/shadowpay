/**
 * /api/sales (alias direto) e /api/sales/public/* — listagens de vendas.
 * Já temos /api/v1/products/sales que faz isso, mas o frontend também chama /api/sales.
 */
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../users/current-user.decorator';
import { TransactionsService } from '../transactions/transactions.service';
import { ListTransactionsDto } from '../transactions/dto/list-transactions.dto';
import { PrismaService } from '../prisma/prisma.service';
import { serializeTransaction } from '../transactions/transaction.serializer';

@Controller('sales')
export class SalesExtrasController {
  constructor(
    private readonly transactions: TransactionsService,
    private readonly prisma: PrismaService,
  ) {}

  // GET /api/sales — vendas pagas do seller logado
  @Get()
  @UseGuards(JwtAuthGuard)
  list(@CurrentUser() user: { id: string }, @Query() query: ListTransactionsDto) {
    return this.transactions.list(user.id, { ...query, status: query.status ?? 'PAID' });
  }

  // GET /api/sales/:id — detalhe de uma venda
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.transactions.findOne(user.id, id);
  }

  // GET /api/sales/public/:id — endpoint público pra confirmação após pagamento
  @Get('public/:id')
  async findPublic(@Param('id') id: string) {
    const t = await this.prisma.transaction.findUnique({ where: { id } });
    if (!t) return { success: false, message: 'Não encontrada.' };
    const safe = serializeTransaction(t);
    if (safe) {
      delete (safe as any).sellerId;
      delete (safe as any).feeAmount;
      delete (safe as any).netAmount;
    }
    return { success: true, data: safe };
  }
}
