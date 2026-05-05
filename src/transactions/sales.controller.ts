import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../users/current-user.decorator';
import { TransactionsService } from './transactions.service';
import { ListTransactionsDto } from './dto/list-transactions.dto';

/**
 * Alias /api/v1/products/sales que o frontend usa pra listagem
 * de vendas (= transações com status PAID por padrão).
 */
@Controller('v1/products/sales')
@UseGuards(JwtAuthGuard)
export class SalesController {
  constructor(private readonly tx: TransactionsService) {}

  @Get()
  list(
    @CurrentUser() user: { id: string },
    @Query() query: ListTransactionsDto,
  ) {
    return this.tx.list(user.id, { ...query, status: query.status ?? 'PAID' });
  }
}
