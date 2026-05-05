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
import { TransactionsService } from './transactions.service';
import { ListTransactionsDto } from './dto/list-transactions.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly service: TransactionsService) {}

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

  // POST /api/transactions  (criação de Pix/cartão/boleto via PSP)
  @Post()
  create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateTransactionDto,
  ) {
    return this.service.create(user.id, dto);
  }
}
