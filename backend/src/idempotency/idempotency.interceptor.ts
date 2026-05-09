/**
 * IdempotencyInterceptor
 *
 * Em rotas marcadas com @Idempotent():
 * - lê header `Idempotency-Key`
 * - se ausente, deixa passar (idempotência opcional pelo cliente)
 * - se presente, faz lookup; se cache hit, retorna resposta cacheada
 *   (mesmo status code) sem tocar no controller
 * - se cache miss, deixa controller rodar e grava o resultado
 */
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of, tap } from 'rxjs';
import { IdempotencyService } from './idempotency.service';
import { IDEMPOTENT_KEY } from './idempotent.decorator';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly service: IdempotencyService,
  ) {}

  async intercept(ctx: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const enabled = this.reflector.getAllAndOverride<boolean>(IDEMPOTENT_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!enabled) return next.handle();

    const req = ctx.switchToHttp().getRequest();
    const res = ctx.switchToHttp().getResponse();

    const key = req.headers['idempotency-key'] as string | undefined;
    if (!key) return next.handle();

    const sellerId = req.user?.id as string | undefined;
    if (!sellerId) return next.handle(); // sem auth, sem cache

    const path = req.route?.path || req.url;
    const bodyHash = this.service.hashBody(req.body);

    const cached = await this.service.lookup({ sellerId, key, path, bodyHash });
    if (cached) {
      res.status(cached.statusCode);
      res.setHeader('idempotent-replay', 'true');
      return of(cached.body);
    }

    return next.handle().pipe(
      tap(async (responseBody) => {
        const statusCode = res.statusCode || 200;
        await this.service.save({
          sellerId,
          key,
          method: req.method,
          path,
          bodyHash,
          statusCode,
          responseBody,
        });
      }),
    );
  }
}
