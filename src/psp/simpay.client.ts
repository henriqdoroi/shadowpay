import { Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import {
  PspCreateChargeInput,
  PspCreateChargeResult,
  PspCreatePayoutInput,
  PspCreatePayoutResult,
  PspProvider,
  PspWebhookPayload,
} from './psp.interface';

/**
 * Cliente Simpay — ESQUELETO.
 *
 * Todos os métodos lançam "PSP_NOT_CONFIGURED" até você me passar:
 *   - URL base da API
 *   - Forma do request (criar charge Pix, payout, etc.)
 *   - Forma do webhook (header de assinatura, algoritmo)
 *
 * Uma vez que tenhamos a doc, isso aqui vira código real em ~30min.
 */
export class SimpayClient implements PspProvider {
  readonly name = 'simpay';
  private readonly logger = new Logger(SimpayClient.name);
  private readonly http: AxiosInstance;
  private readonly apiKey: string;
  private readonly webhookSecret: string;

  constructor(apiUrl: string, apiKey: string, webhookSecret: string) {
    this.apiKey = apiKey;
    this.webhookSecret = webhookSecret;
    this.http = axios.create({
      baseURL: apiUrl,
      timeout: 15_000,
      headers: { Authorization: `Bearer ${apiKey}` },
    });
  }

  isConfigured() {
    return Boolean(this.apiKey);
  }

  async createCharge(_input: PspCreateChargeInput): Promise<PspCreateChargeResult> {
    // TODO: substituir pela chamada real ao endpoint da Simpay
    // Ex (placeholder, ajustar com a doc):
    //   const { data } = await this.http.post('/v1/charges', {
    //     method: input.method.toLowerCase(),
    //     amount_cents: Math.round(input.amount * 100),
    //     customer: input.customer,
    //     description: input.description,
    //     reference: input.externalReference,
    //   });
    //   return {
    //     externalId: data.id,
    //     status: mapStatus(data.status),
    //     pixCopyPaste: data.pix?.copy_paste,
    //     pixQrCodeUrl: data.pix?.qr_code_url,
    //     expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
    //   };
    throw new Error('SimpayClient.createCharge ainda não implementado — falta doc oficial.');
  }

  async createPayout(_input: PspCreatePayoutInput): Promise<PspCreatePayoutResult> {
    throw new Error('SimpayClient.createPayout ainda não implementado — falta doc oficial.');
  }

  verifyAndParseWebhook(_rawBody: string, _headers: Record<string, string>): PspWebhookPayload {
    // TODO: usar this.webhookSecret pra checar HMAC do header.
    // Ex (placeholder):
    //   const sig = headers['x-simpay-signature'];
    //   const expected = crypto.createHmac('sha256', this.webhookSecret).update(rawBody).digest('hex');
    //   if (!timingSafeEqual(sig, expected)) throw new UnauthorizedException();
    //   const payload = JSON.parse(rawBody);
    //   return { type: payload.event, externalId: payload.charge_id, status: mapStatus(payload.status), raw: payload };
    throw new Error('SimpayClient.verifyAndParseWebhook ainda não implementado.');
  }
}
