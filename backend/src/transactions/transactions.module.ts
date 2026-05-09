import { Module } from '@nestjs/common';
import {
  TransactionsController,
  TransactionsPublicController,
} from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { SalesController } from './sales.controller';
import { AuthModule } from '../auth/auth.module';
import { PspModule } from '../psp/psp.module';

@Module({
  imports: [AuthModule, PspModule],
  controllers: [
    TransactionsController,
    TransactionsPublicController,
    SalesController,
  ],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
