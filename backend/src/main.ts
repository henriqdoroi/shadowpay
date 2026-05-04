import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Segurança
  app.use(helmet());

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
