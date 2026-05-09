import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { IsString, Length } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../users/current-user.decorator';
import { SkipKyc } from '../common/decorators/skip-kyc.decorator';
import { TwoFactorService } from './two-factor.service';

class CodeDto {
  @IsString()
  @Length(6, 6)
  code!: string;
}

@Controller('2fa')
@UseGuards(JwtAuthGuard)
@SkipKyc()
export class TwoFactorController {
  constructor(private readonly service: TwoFactorService) {}

  @Post('setup')
  setup(@CurrentUser() user: { id: string }) {
    return this.service.setup(user.id);
  }

  @Post('enable')
  enable(@CurrentUser() user: { id: string }, @Body() dto: CodeDto) {
    return this.service.enable(user.id, dto.code);
  }

  @Post('disable')
  disable(@CurrentUser() user: { id: string }, @Body() dto: CodeDto) {
    return this.service.disable(user.id, dto.code);
  }
}
