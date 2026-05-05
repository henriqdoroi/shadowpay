/**
 * Módulo de compatibilidade. Aqui ficam todas as rotas que o frontend espera
 * em paths "antigos" que não batem com o nosso layout canônico.
 *
 *   /api/admin/*               -> ManagerService
 *   /api/user/fees,*-report,kyc/* -> Reports + Transactions + Withdrawals + Kyc
 *   /api/auth/password         -> UsersService.changePassword
 *   /api/credentials           -> UsersService + Prisma
 *   /api/pages/2fa/*           -> TwoFactorService
 *   /api/payments/*            -> Transactions + Withdrawals
 *   /api/sales (extras)        -> Transactions
 *   /api/products (stub)       -> não implementado
 *   /api/webhooks (seller)     -> não implementado
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

@Module({
  imports: [
    AuthModule,
    UsersModule,
    ManagerModule,
    ReportsModule,
    TransactionsModule,
    WithdrawalsModule,
    KycModule,
    TwoFactorModule,
  ],
  controllers: [
    AdminController,
    UserExtrasController,
    AuthExtrasController,
    CredentialsController,
    TwoFactorPagesController,
    PaymentsController,
    SellerWebhooksController,
    ProductsController,
    SalesExtrasController,
  ],
})
export class CompatModule {}
