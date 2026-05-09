import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../users/current-user.decorator';
import { Idempotent } from '../idempotency/idempotent.decorator';
import { Public } from '../common/decorators/public.decorator';
import { SkipKyc } from '../common/decorators/skip-kyc.decorator';
import { TransactionsService } from './transactions.service';
import { ListTransactionsDto } from './dto/list-transactions.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { serializeTransaction } from './transaction.serializer';
import { PrismaService } from '../prisma/prisma.service';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(
    private readonly service: TransactionsService,
    private readonly prisma: PrismaService,
  ) {}

  // GET /api/transactions?page=1&pageSize=20&status=PAID
  @Get()
  list(
    @CurrentUser() user: { id: string },
    @Query() query: ListTransactionsDto,
  ) {
    return this.service.list(user.id, query);
  }

  // GET /api/transactions/:id
  @Get(':id')
  findOne(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.service.findOne(user.id, id);
  }

  // POST /api/transactions  (criação de Pix via PSP)
  @Post()
  @Idempotent()
  create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateTransactionDto,
  ) {
    return this.service.create(user.id, dto);
  }
}

/**
 * Endpoint público pra checkout: o cliente final consulta o status da
 * transação por ID (sem JWT). Retorna dados *seguros* — sem sellerId,
 * sem fees, sem netAmount. Útil pra páginas de "Aguardando pagamento".
 */
@Controller('transactions/public')
@Public()
@SkipKyc()
export class TransactionsPublicController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':id')
  async getPublic(@Param('id') id: string) {
    const t = await this.prisma.transaction.findUnique({ where: { id } });
    if (!t) return { success: false, error: { code: 'NOT_FOUND', message: 'Transação não encontrada.' } };
    const safe: any = serializeTransaction(t);
    if (safe) {
      delete safe.sellerId;
      delete safe.feeAmount;
      delete safe.netAmount;
    }
    return { success: true, data: safe };
  }
}
