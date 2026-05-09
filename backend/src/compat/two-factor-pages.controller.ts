import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { IsString, Length } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../users/current-user.decorator';
import { TwoFactorService } from '../two-factor/two-factor.service';

class CodeDto {
  @IsString()
  @Length(6, 6)
  code!: string;
}

/**
 * /api/pages/2fa/* — formato exato que o frontend usa.
 * Retorna { qrCodeUrl, secret } no top level (sem wrapper {success,data}).
 */
@Controller('pages/2fa')
@UseGuards(JwtAuthGuard)
export class TwoFactorPagesController {
  constructor(private readonly service: TwoFactorService) {}

  // Frontend chama com GET, esperando { qrCodeUrl, secret }
  @Get('setup')
  async setupGet(@CurrentUser() user: { id: string }) {
    const r = await this.service.setup(user.id);
    return { qrCodeUrl: r.data.qrDataUrl, secret: r.data.secret };
  }

  @Post('setup')
  async setupPost(@CurrentUser() user: { id: string }) {
    const r = await this.service.setup(user.id);
    return { qrCodeUrl: r.data.qrDataUrl, secret: r.data.secret };
  }

  @Post('verify')
  verify(@CurrentUser() user: { id: string }, @Body() dto: CodeDto) {
    return this.service.enable(user.id, dto.code);
  }

  @Post('disable')
  disable(@CurrentUser() user: { id: string }, @Body() dto: CodeDto) {
    return this.service.disable(user.id, dto.code);
  }
}
