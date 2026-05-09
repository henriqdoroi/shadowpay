/**
 * @Public() — rota acessível sem JWT. Combinada com @SkipKyc implicitamente.
 */
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'shadowpay:public';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
