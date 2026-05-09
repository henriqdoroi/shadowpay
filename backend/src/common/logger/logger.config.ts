/**
 * Configuração do Pino — JSON estruturado em prod, pretty em dev.
 *
 * Cada request gera um requestId que é propagado via header `x-request-id`
 * (gerado se ausente). O logger anexa esse id em todo log da request.
 */
import { Params } from 'nestjs-pino';
import { randomUUID } from 'crypto';
import type { IncomingMessage, ServerResponse } from 'http';

export function buildLoggerConfig(): Params {
  const isProd = process.env.NODE_ENV === 'production';

  return {
    pinoHttp: {
      level: process.env.LOG_LEVEL || (isProd ? 'info' : 'debug'),
      // Em prod, JSON puro pra ingestão de logs. Em dev, pretty.
      transport: isProd
        ? undefined
        : {
            target: 'pino-pretty',
            options: {
              singleLine: true,
              translateTime: 'SYS:HH:MM:ss.l',
              ignore: 'pid,hostname,req,res',
            },
          },
      genReqId: (req: IncomingMessage, res: ServerResponse) => {
        const existing =
          (req.headers['x-request-id'] as string | undefined) ||
          (req.headers['x-correlation-id'] as string | undefined);
        const id = existing || randomUUID();
        res.setHeader('x-request-id', id);
        return id;
      },
      // Não logar headers sensíveis nem o body completo
      serializers: {
        req: (req: any) => ({
          id: req.id,
          method: req.method,
          url: req.url,
          remoteAddress: req.remoteAddress,
        }),
        res: (res: any) => ({
          statusCode: res.statusCode,
        }),
      },
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'req.headers["x-api-key"]',
          'req.body.password',
          'req.body.passwordHash',
          'req.body.privateKey',
          'req.body.secret',
          'req.body.code',
        ],
        censor: '[REDACTED]',
      },
      customLogLevel: (req, res, err) => {
        if (err || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
      autoLogging: {
        ignore: (req) => req.url === '/api/health',
      },
    },
  };
}
