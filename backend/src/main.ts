import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger as PinoLogger } from 'nestjs-pino';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as express from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    // Capturar rawBody é essencial pra verificar assinatura HMAC do webhook do PSP.
    rawBody: true,
  });

  // Substitui o logger nativo pelo Pino
  app.useLogger(app.get(PinoLogger));

  const config = app.get(ConfigService);

  // Segurança
  app.use(helmet());

  // Body parsers — limites generosos pra payloads de KYC
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

  // OpenAPI/Swagger em /api/docs
  if (config.get<string>('NODE_ENV') !== 'production' || config.get<string>('SWAGGER_ENABLED') === '1') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('ShadowPay API')
      .setDescription('Backend de gateway de pagamento PIX. Auth: Bearer JWT.')
      .setVersion('1.0')
      .addBearerAuth()
      .addServer('https://shadowpay-production-2ca8.up.railway.app', 'Produção')
      .addServer('http://localhost:3333', 'Local')
      .build();
    const doc = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, doc, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  const port = Number(config.get<string>('PORT')) || 3333;
  await app.listen(port, '0.0.0.0');

  const logger = app.get(PinoLogger);
  logger.log(
    `🚀 ShadowPay backend rodando na porta ${port} | CORS: ${
      corsOrigins.join(', ') || '(*)'
    }`,
  );
}

bootstrap();
