/**
 * Módulo de compatibilidade. Aqui ficam todas as rotas que o frontend espera
 * em paths "antigos" que não batem com o nosso layout canônico.
 */
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { ManagerModule } from '../manager/manager.module';
import { ReportsModule } from '../reports/reports.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { WithdrawalsModule } from '../withdrawals/withdrawals.module';
import { KycModule } from '../kyc/kyc.module';
import { TwoFactorModule } from '../two-factor/two-factor.module';

import { AdminController } from './admin.controller';
import { UserExtrasController } from './user-extras.controller';
import { AuthExtrasController } from './auth-extras.controller';
import { CredentialsController } from './credentials.controller';
import { TwoFactorPagesController } from './two-factor-pages.controller';
import { PaymentsController } from './payments.controller';
import { SellerWebhooksController } from './seller-webhooks.controller';
import { ProductsController } from './products.controller';
import { SalesExtrasController } from './sales-extras.controller';
import { SellerAcquirersController } from './seller-acquirers.controller';

@Module({
  imports: [
    AuthModule, UsersModule, ManagerModule, ReportsModule,
    TransactionsModule, WithdrawalsModule, KycModule, TwoFactorModule,
  ],
  controllers: [
    AdminController, UserExtrasController, AuthExtrasController,
    CredentialsController, TwoFactorPagesController, PaymentsController,
    SellerWebhooksController, ProductsController, SalesExtrasController,
    SellerAcquirersController,
  ],
})
export class CompatModule {}
