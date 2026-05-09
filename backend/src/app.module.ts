import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';

import { buildLoggerConfig } from './common/logger/logger.config';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { KycApprovedGuard } from './common/guards/kyc-approved.guard';

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

// Cross-cutting (Global modules)
import { WalletModule } from './wallet/wallet.module';
import { EmailModule } from './email/email.module';
import { AuditModule } from './audit/audit.module';
import { IdempotencyModule } from './idempotency/idempotency.module';
import { AuditInterceptor } from './audit/audit.interceptor';
import { IdempotencyInterceptor } from './idempotency/idempotency.interceptor';

import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    // Logger Pino — substitui o logger nativo do Nest globalmente
    LoggerModule.forRoot(buildLoggerConfig()),
    // Rate limit global - protege contra brute force em login
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 5 },
      { name: 'medium', ttl: 10_000, limit: 30 },
      { name: 'long', ttl: 60_000, limit: 200 },
    ]),

    PrismaModule,

    // Cross-cutting providers (@Global)
    WalletModule,
    EmailModule,
    AuditModule,
    IdempotencyModule,

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
    // Filtro global de exceções (shape uniforme + log estruturado)
    { provide: APP_FILTER, useClass: AllExceptionsFilter },

    // Throttler em primeiro
    { provide: APP_GUARD, useClass: ThrottlerGuard },

    // KYC obrigatório pra TUDO. Endpoints de onboarding usam @SkipKyc().
    { provide: APP_GUARD, useClass: KycApprovedGuard },

    // Interceptors globais
    { provide: APP_INTERCEPTOR, useClass: IdempotencyInterceptor },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
