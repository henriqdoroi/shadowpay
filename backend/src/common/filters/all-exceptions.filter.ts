/**
 * Filtro global de excecoes.
 * Normaliza resposta de erro pro shape:
 *   { success: false, error: { code, message, details?, ...extras, requestId? } }
 *
 * Quando o controller lanca `throw new BadRequestException({ code, message, receivedKeys, accept })`,
 * passamos todas as keys extras pra dentro do `error`. Util pra debugar shapes do frontend.
 */
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request & { id?: string }>();

    const { status, code, message, details, extras } = this.normalize(exception);

    const requestId = (req as any).id || (req.headers['x-request-id'] as string);

    if (status >= 500) {
      this.logger.error(
        `${req.method} ${req.url} -> ${status} ${code}: ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else if (status >= 400) {
      this.logger.warn(`${req.method} ${req.url} -> ${status} ${code}: ${message}`);
    }

    res.status(status).json({
      success: false,
      error: {
        code,
        message,
        ...(details !== undefined ? { details } : {}),
        ...(extras || {}),
        ...(requestId ? { requestId } : {}),
      },
    });
  }

  private normalize(exception: unknown): {
    status: number;
    code: string;
    message: string;
    details?: unknown;
    extras?: Record<string, unknown>;
  } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const resp = exception.getResponse();
      let code = httpCodeName(status);
      let message = exception.message;
      let details: unknown;
      let extras: Record<string, unknown> | undefined;

      if (typeof resp === 'object' && resp !== null) {
        const r = resp as any;
        if (Array.isArray(r.message)) {
          code = 'VALIDATION_ERROR';
          message = 'Falha de validacao.';
          details = r.message;
        } else if (typeof r.message === 'string') {
          message = r.message;
        }
        if (r.code) code = r.code;
        if (r.details !== undefined) details = r.details;
        // Captura TODAS as outras keys extras (receivedKeys, accept, etc.)
        const reserved = new Set(['statusCode', 'error', 'code', 'message', 'details']);
        const e: Record<string, unknown> = {};
        for (const k of Object.keys(r)) {
          if (!reserved.has(k)) e[k] = r[k];
        }
        if (Object.keys(e).length) extras = e;
      }

      return { status, code, message, details, extras };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002':
          return {
            status: HttpStatus.CONFLICT,
            code: 'CONFLICT_UNIQUE',
            message: 'Registro duplicado.',
            details: exception.meta?.target,
          };
        case 'P2025':
          return { status: HttpStatus.NOT_FOUND, code: 'NOT_FOUND', message: 'Registro nao encontrado.' };
        case 'P2003':
          return { status: HttpStatus.BAD_REQUEST, code: 'FK_CONSTRAINT', message: 'Referencia invalida.' };
      }
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_ERROR',
      message: 'Erro interno. Tente novamente.',
    };
  }
}

function httpCodeName(status: number): string {
  const map: Record<number, string> = {
    400: 'BAD_REQUEST', 401: 'UNAUTHORIZED', 402: 'PAYMENT_REQUIRED', 403: 'FORBIDDEN',
    404: 'NOT_FOUND', 405: 'METHOD_NOT_ALLOWED', 409: 'CONFLICT', 410: 'GONE',
    412: 'PRECONDITION_FAILED', 422: 'UNPROCESSABLE', 423: 'LOCKED', 429: 'TOO_MANY_REQUESTS',
    500: 'INTERNAL_ERROR', 502: 'BAD_GATEWAY', 503: 'SERVICE_UNAVAILABLE', 504: 'GATEWAY_TIMEOUT',
  };
  return map[status] || `HTTP_${status}`;
}
