/**
 * Interface comum pra qualquer PSP (Simpay, Pagar.me, Asaas, etc).
 * Quando você quiser plugar outro PSP, basta implementar essa interface
 * e registrar no PspService.
 */

export type PspMethod = 'PIX' | 'CARD' | 'BOLETO' | 'CRYPTO';
export type PspStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'PAID'
  | 'FAILED'
  | 'REFUNDED'
  | 'CHARGEBACK'
  | 'EXPIRED';

export interface PspCreateChargeInput {
  method: PspMethod;
  amount: number; // em reais
  customer?: {
    name?: string;
    email?: string;
    cpfCnpj?: string;
  };
  description?: string;
  externalReference?: string;
}

export interface PspCreateChargeResult {
  externalId: string;
  status: PspStatus;
  pixCopyPaste?: string;
  pixQrCodeUrl?: string;
  cardLastDigits?: string;
  boletoBarcode?: string;
  boletoUrl?: string;
  expiresAt?: Date;
}

export interface PspCreatePayoutInput {
  amount: number;
  pixKey: string;
  pixKeyType: string; // cpf | cnpj | email | phone | random
  description?: string;
  externalReference?: string;
}

export interface PspCreatePayoutResult {
  externalId: string;
  status: PspStatus;
  feeAmount?: number;
}

export interface PspWebhookPayload {
  type: string;
  externalId: string;
  status: PspStatus;
  paidAt?: Date;
  raw: any;
}

export interface PspProvider {
  name: string;
  isConfigured(): boolean;
  createCharge(input: PspCreateChargeInput): Promise<PspCreateChargeResult>;
  createPayout(input: PspCreatePayoutInput): Promise<PspCreatePayoutResult>;
  /**
   * Verifica assinatura do webhook + parseia payload.
   * Cada PSP usa um header e algoritmo diferente.
   */
  verifyAndParseWebhook(rawBody: string, headers: Record<string, string>): PspWebhookPayload;
}
