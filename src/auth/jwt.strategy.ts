import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') || 'change-me',
    });
  }

  /**
   * Roda a cada request autenticada. Valida que o seller ainda existe
   * e não foi suspenso/deletado entre a emissão do token e agora.
   */
  async validate(payload: JwtPayload) {
    const seller = await this.prisma.seller.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        suspendedAt: true,
        deletedAt: true,
        isAdministrator: true,
      },
    });

    if (!seller || seller.deletedAt || seller.suspendedAt) {
      throw new UnauthorizedException('Token inválido ou conta indisponível.');
    }

    return seller; // vira req.user
  }
}
