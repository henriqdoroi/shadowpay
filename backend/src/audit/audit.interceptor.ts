/**
 * AuditInterceptor — registra log de ações marcadas com @Audited.
 */
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { AuditService } from './audit.service';
import { AUDITED_KEY, AuditedMeta } from './audited.decorator';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly audit: AuditService,
  ) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    const meta = this.reflector.getAllAndOverride<AuditedMeta>(AUDITED_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!meta) return next.handle();

    const req = ctx.switchToHttp().getRequest();
    const res = ctx.switchToHttp().getResponse();

    return next.handle().pipe(
      tap(() => {
        const status = res.statusCode || 200;
        if (status >= 400) return;

        const targetId = meta.options.targetIdFrom
          ? readPath(req, meta.options.targetIdFrom)
          : undefined;

        this.audit
          .record({
            actorId: req.user?.id ?? null,
            actorEmail: req.user?.email ?? null,
            action: meta.action,
            targetType: meta.options.targetType ?? null,
            targetId: targetId ?? null,
            ip: extractIp(req),
            userAgent: (req.headers['user-agent'] as string) ?? null,
            requestId: (req.id as string) ?? null,
          })
          .catch(() => {});
      }),
    );
  }
}

function readPath(obj: any, path: string): string | undefined {
  return path.split('.').reduce((acc, k) => (acc ? acc[k] : undefined), obj);
}

function extractIp(req: any): string | null {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string') return xff.split(',')[0].trim();
  return req.ip ?? req.socket?.remoteAddress ?? null;
}
