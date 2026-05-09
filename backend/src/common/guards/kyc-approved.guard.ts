/**
 * KycApprovedGuard
 *
 * Bloqueia QUALQUER endpoint sensível pra sellers que não têm KYC=APPROVED.
 * Aplicado globalmente via APP_GUARD. Pra liberar uma rota, use @SkipKyc()
 * ou @Public().
 *
 * Política: KYC obrigatório pra TUDO (escolha do produto). Endpoints de
 * onboarding (auth, kyc/*, perfil, 2fa) usam @SkipKyc().
 */
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { SKIP_KYC_KEY } from '../decorators/skip-kyc.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class KycApprovedGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_KYC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (skip) return true;

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest();
    const user = req.user as { id?: string; isAdministrator?: boolean } | undefined;

    // Sem JWT, JwtAuthGuard já barrou. Defesa em profundidade:
    if (!user?.id) return true;

    // Admin sempre passa.
    if (user.isAdministrator) return true;

    const kyc = await this.prisma.kyc.findUnique({
      where: { sellerId: user.id },
      select: { status: true },
    });

    if (kyc?.status === 'APPROVED') return true;

    throw new ForbiddenException({
      code: 'KYC_REQUIRED',
      message:
        kyc?.status === 'BANNED'
          ? 'Conta banida. Contate o suporte.'
          : 'Você precisa concluir o KYC pra usar essa funcionalidade.',
    });
  }
}
