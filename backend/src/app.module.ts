import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PspModule } from './psp/psp.module';
import { NotificationsModule } from './notifications/notifications.module';
import { TransactionsModule } from './transactions/transactions.module';
import { WithdrawalsModule } from './withdrawals/withdrawals.module';
import { ReportsModule } from './reports/reports.module';
import { KycModule } from './kyc/kyc.module';
import { TwoFactorModule } from './two-factor/two-factor.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { ManagerModule } from './manager/manager.module';

import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    // Rate limit global - protege contra brute force em login
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 5 },
      { name: 'medium', ttl: 10_000, limit: 30 },
      { name: 'long', ttl: 60_000, limit: 200 },
    ]),

    PrismaModule,
    AuthModule,
    PspModule,

    UsersModule,
    NotificationsModule,
    TransactionsModule,
    WithdrawalsModule,
    ReportsModule,
    KycModule,
    TwoFactorModule,
    WebhooksModule,
    ManagerModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
