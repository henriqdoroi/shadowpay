import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as express from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    // Capturar rawBody é essencial pra verificar assinatura HMAC do webhook do PSP.
    rawBody: true,
  });

  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Segurança
  app.use(helmet());

  // Aumenta o limite do JSON body pra payloads de KYC com URLs longas
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  // CORS — origens permitidas vêm do .env
  const corsOrigins = (config.get<string>('CORS_ORIGINS') || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: corsOrigins.length ? corsOrigins : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // Validação automática de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Prefixo global - o frontend já chama /api/...
  app.setGlobalPrefix('api');

  const port = Number(config.get<string>('PORT')) || 3333;
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 ShadowPay backend rodando na porta ${port}`);
  logger.log(`📡 CORS liberado para: ${corsOrigins.join(', ') || '(qualquer origem)'}`);
}

bootstrap();
