/**
 * IdempotencyService
 *
 * - lookup(): se já existe uma resposta cacheada pra (seller, key, path)
 *   E o body bate, retorna a resposta original.
 * - save(): grava response.
 * - sweep(): limpa keys expiradas.
 *
 * TTL default = 24h. Suficiente pra clientes mobile com retry.
 */
import { ConflictException, Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

export interface CachedResponse {
  statusCode: number;
  body: any;
}

@Injectable()
export class IdempotencyService {
  private readonly ttlMs = 24 * 60 * 60 * 1000;

  constructor(private readonly prisma: PrismaService) {}

  hashBody(body: unknown): string {
    return createHash('sha256').update(JSON.stringify(body ?? {})).digest('hex');
  }

  async lookup(params: {
    sellerId: string;
    key: string;
    path: string;
    bodyHash: string;
  }): Promise<CachedResponse | null> {
    const row = await this.prisma.idempotencyKey.findUnique({
      where: {
        sellerId_key_path: {
          sellerId: params.sellerId,
          key: params.key,
          path: params.path,
        },
      },
    });
    if (!row) return null;

    if (row.expiresAt < new Date()) {
      await this.prisma.idempotencyKey.delete({ where: { id: row.id } }).catch(() => {});
      return null;
    }

    if (row.bodyHash !== params.bodyHash) {
      // Reuso da MESMA key com body diferente: erro proposital pra evitar
      // confusão silenciosa.
      throw new ConflictException({
        code: 'IDEMPOTENCY_KEY_REUSE',
        message: 'Idempotency-Key reusada com body diferente.',
      });
    }

    return { statusCode: row.statusCode, body: row.responseBody };
  }

  async save(params: {
    sellerId: string;
    key: string;
    method: string;
    path: string;
    bodyHash: string;
    statusCode: number;
    responseBody: any;
  }): Promise<void> {
    const expiresAt = new Date(Date.now() + this.ttlMs);
    await this.prisma.idempotencyKey
      .upsert({
        where: {
          sellerId_key_path: {
            sellerId: params.sellerId,
            key: params.key,
            path: params.path,
          },
        },
        create: {
          sellerId: params.sellerId,
          key: params.key,
          method: params.method,
          path: params.path,
          bodyHash: params.bodyHash,
          statusCode: params.statusCode,
          responseBody: params.responseBody,
          expiresAt,
        },
        update: {}, // race-safe: se outra request criou no meio, não sobrescreve
      })
      .catch(() => {});
  }

  /**
   * Limpa keys expiradas. Chamado por job (cron) — por ora não tem cron,
   * fica como utilitário pro futuro.
   */
  async sweep(): Promise<number> {
    const r = await this.prisma.idempotencyKey.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return r.count;
  }
}
