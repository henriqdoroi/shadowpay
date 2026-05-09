/**
 * @Idempotent()
 *
 * Marca rota POST como idempotente. Cliente envia header `Idempotency-Key`
 * (qualquer string única, ex: UUID gerado no client). Se reenviar a mesma
 * key com o mesmo body, recebe a resposta cacheada (status code igual).
 * Se a key bater mas o body diferir, retorna 409 IDEMPOTENCY_KEY_REUSE.
 */
import { SetMetadata } from '@nestjs/common';

export const IDEMPOTENT_KEY = 'shadowpay:idempotent';
export const Idempotent = () => SetMetadata(IDEMPOTENT_KEY, true);
