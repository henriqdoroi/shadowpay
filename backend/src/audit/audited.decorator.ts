/**
 * @Audited('manager.user.block', { targetType: 'Seller' })
 *
 * Marca um endpoint pra que cada chamada bem-sucedida (status < 400) seja
 * registrada em AuditLog. Captura actor, ip, userAgent e requestId
 * automaticamente. before/after ficam por conta da implementação do controller
 * (usar AuditService.record() diretamente quando precisar).
 */
import { SetMetadata } from '@nestjs/common';

export interface AuditedOptions {
  targetType?: string;
  /** Caminho no body/params pra extrair targetId. Ex: 'params.id' */
  targetIdFrom?: string;
}

export const AUDITED_KEY = 'shadowpay:audited';

export interface AuditedMeta {
  action: string;
  options: AuditedOptions;
}

export const Audited = (action: string, options: AuditedOptions = {}) =>
  SetMetadata(AUDITED_KEY, { action, options } as AuditedMeta);
