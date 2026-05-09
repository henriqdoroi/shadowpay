/**
 * Filtro global de exceções.
 *
 * Normaliza TODA resposta de erro pro shape:
 *   { success: false, error: { code, message, details? } }
 *
 * Nunca vaza stack trace pro cliente. Em log estruturado registra
 * stack + request id pra correlação posterior.
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

interface ErrorPayload {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId?: string;
  };
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request & { id?: string }>();

    const { status, code, message, details } = this.normalize(exception);

    const requestId = (req as any).id || (req.headers['x-request-id'] as string);

    if (status >= 500) {
      this.logger.error(
        `${req.method} ${req.url} -> ${status} ${code}: ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else if (status >= 400) {
      this.logger.warn(`${req.method} ${req.url} -> ${status} ${code}: ${message}`);
    }

    const payload: ErrorPayload = {
      success: false,
      error: { code, message, ...(details ? { details } : {}), ...(requestId ? { requestId } : {}) },
    };

    res.status(status).json(payload);
  }

  private normalize(exception: unknown): {
    status: number;
    code: string;
    message: string;
    details?: unknown;
  } {
    // 1) HttpException do Nest (com BadRequestException, UnauthorizedException, etc.)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const resp = exception.getResponse();
      let code = httpCodeName(status);
      let message = exception.message;
      let details: unknown;

      if (typeof resp === 'object' && resp !== null) {
        const r = resp as any;
        if (Array.isArray(r.message)) {
          // ValidationPipe retorna array de mensagens
          code = 'VALIDATION_ERROR';
          message = 'Falha de validação.';
          details = r.message;
        } else if (typeof r.message === 'string') {
          message = r.message;
        }
        if (r.code) code = r.code;
      }

      return { status, code, message, details };
    }

    // 2) Erros do Prisma — mapeamos os mais comuns
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
          return {
            status: HttpStatus.NOT_FOUND,
            code: 'NOT_FOUND',
            message: 'Registro não encontrado.',
          };
        case 'P2003':
          return {
            status: HttpStatus.BAD_REQUEST,
            code: 'FK_CONSTRAINT',
            message: 'Referência inválida.',
          };
      }
    }

    // 3) Fallback — erro desconhecido
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_ERROR',
      message: 'Erro interno. Tente novamente.',
    };
  }
}

function httpCodeName(status: number): string {
  const map: Record<number, string> = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    402: 'PAYMENT_REQUIRED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    405: 'METHOD_NOT_ALLOWED',
    409: 'CONFLICT',
    410: 'GONE',
    412: 'PRECONDITION_FAILED',
    422: 'UNPROCESSABLE',
    423: 'LOCKED',
    429: 'TOO_MANY_REQUESTS',
    500: 'INTERNAL_ERROR',
    502: 'BAD_GATEWAY',
    503: 'SERVICE_UNAVAILABLE',
    504: 'GATEWAY_TIMEOUT',
  };
  return map[status] || `HTTP_${status}`;
}
