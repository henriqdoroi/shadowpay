/**
 * @SkipKyc() — marca rota como liberada pra sellers ainda não aprovados
 * no KYC. Aplique em endpoints de auth, KYC, profile, 2FA, etc.
 */
import { SetMetadata } from '@nestjs/common';

export const SKIP_KYC_KEY = 'shadowpay:skipKyc';
export const SkipKyc = () => SetMetadata(SKIP_KYC_KEY, true);
