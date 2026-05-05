import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SimpayClient } from './simpay.client';
import {
  PspCreateChargeInput,
  PspCreateChargeResult,
  PspCreatePayoutInput,
  PspCreatePayoutResult,
  PspProvider,
  PspWebhookPayload,
} from './psp.interface';

/**
 * Roteador de PSPs. Por enquanto só Simpay; pra adicionar outros (Pagar.me,
 * Asaas, etc.) basta implementar PspProvider e registrar aqui.
 */
@Injectable()
export class PspService {
  private readonly logger = new Logger(PspService.name);
  private readonly providers: Map<string, PspProvider> = new Map();
  private readonly defaultProvider: string;

  constructor(private readonly config: ConfigService) {
    this.defaultProvider = (config.get<string>('DEFAULT_PSP') || 'simpay').toLowerCase();

    const simpay = new SimpayClient(
      config.get<string>('SIMPAY_API_URL') || 'https://api.simpay.com.br',
      config.get<string>('SIMPAY_API_KEY') || '',
      config.get<string>('SIMPAY_WEBHOOK_SECRET') || '',
    );
    this.providers.set('simpay', simpay);
  }

  isConfigured(provider?: string): boolean {
    const p = this.providers.get((provider || this.defaultProvider).toLowerCase());
    return Boolean(p?.isConfigured());
  }

  private getProviderOrFail(provider?: string): PspProvider {
    const name = (provider || this.defaultProvider).toLowerCase();
    const p = this.providers.get(name);
    if (!p) {
      throw new ServiceUnavailableException({
        success: false,
        code: 'PSP_NOT_FOUND',
        message: `PSP "${name}" não está cadastrado.`,
      });
    }
    if (!p.isConfigured()) {
      throw new ServiceUnavailableException({
        success: false,
        code: 'PSP_NOT_CONFIGURED',
        message: `PSP "${name}" precisa de credenciais (env vars).`,
      });
    }
    return p;
  }

  createCharge(input: PspCreateChargeInput, provider?: string): Promise<PspCreateChargeResult> {
    return this.getProviderOrFail(provider).createCharge(input);
  }

  createPayout(input: PspCreatePayoutInput, provider?: string): Promise<PspCreatePayoutResult> {
    return this.getProviderOrFail(provider).createPayout(input);
  }

  verifyAndParseWebhook(
    rawBody: string,
    headers: Record<string, string>,
    provider: string,
  ): PspWebhookPayload {
    return this.getProviderOrFail(provider).verifyAndParseWebhook(rawBody, headers);
  }
}
