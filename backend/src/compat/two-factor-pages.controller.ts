import { Body, Controller, Post, UseGuards } from '@nestjs/common';
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
 * Alias /api/pages/2fa/* (formato que o frontend usa).
 * Mapeia pra TwoFactorService canônico em /api/2fa/*.
 */
@Controller('pages/2fa')
@UseGuards(JwtAuthGuard)
export class TwoFactorPagesController {
  constructor(private readonly service: TwoFactorService) {}

  @Post('setup')
  setup(@CurrentUser() user: { id: string }) {
    return this.service.setup(user.id);
  }

  // /verify no frontend = /enable no backend (confirma o código TOTP gerado)
  @Post('verify')
  verify(@CurrentUser() user: { id: string }, @Body() dto: CodeDto) {
    return this.service.enable(user.id, dto.code);
  }

  @Post('disable')
  disable(@CurrentUser() user: { id: string }, @Body() dto: CodeDto) {
    return this.service.disable(user.id, dto.code);
  }
}
