import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { authenticator } from 'otplib';
import { toDataURL } from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';

/**
 * 2FA via TOTP (Google Authenticator, Authy, etc.)
 *
 * Fluxo:
 *   1. POST /api/2fa/setup → gera secret + QR code, salva em twofaSecret (NÃO ativa ainda)
 *   2. POST /api/2fa/enable { code } → confirma o secret e seta twofaEnabled=true
 *   3. POST /api/2fa/disable { code } → exige código válido pra desligar
 */
@Injectable()
export class TwoFactorService {
  constructor(private readonly prisma: PrismaService) {}

  async setup(sellerId: string) {
    const seller = await this.prisma.seller.findUnique({
      where: { id: sellerId },
      select: { email: true, companyName: true, twofaEnabled: true },
    });
    if (!seller) throw new UnauthorizedException();
    if (seller.twofaEnabled) {
      throw new BadRequestException('2FA já está ativo. Desative primeiro pra reconfigurar.');
    }

    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(
      seller.email,
      `ShadowPay (${seller.companyName})`,
      secret,
    );
    const qrDataUrl = await toDataURL(otpauthUrl);

    // Guarda secret pendente (sem ativar)
    await this.prisma.seller.update({
      where: { id: sellerId },
      data: { twofaSecret: secret },
    });

    return {
      success: true,
      data: { secret, otpauthUrl, qrDataUrl },
    };
  }

  async enable(sellerId: string, code: string) {
    const seller = await this.prisma.seller.findUnique({
      where: { id: sellerId },
      select: { twofaSecret: true, twofaEnabled: true },
    });
    if (!seller?.twofaSecret) {
      throw new BadRequestException('Você precisa rodar /setup antes.');
    }
    if (seller.twofaEnabled) {
      return { success: true, message: '2FA já estava ativo.' };
    }
    const ok = authenticator.verify({ token: code, secret: seller.twofaSecret });
    if (!ok) throw new UnauthorizedException('Código inválido.');

    await this.prisma.seller.update({
      where: { id: sellerId },
      data: { twofaEnabled: true },
    });
    return { success: true, message: '2FA ativado com sucesso.' };
  }

  async disable(sellerId: string, code: string) {
    const seller = await this.prisma.seller.findUnique({
      where: { id: sellerId },
      select: { twofaSecret: true, twofaEnabled: true },
    });
    if (!seller?.twofaEnabled || !seller.twofaSecret) {
      return { success: true, message: '2FA já está desativado.' };
    }
    const ok = authenticator.verify({ token: code, secret: seller.twofaSecret });
    if (!ok) throw new UnauthorizedException('Código inválido.');

    await this.prisma.seller.update({
      where: { id: sellerId },
      data: { twofaEnabled: false, twofaSecret: null },
    });
    return { success: true, message: '2FA desativado.' };
  }
}
