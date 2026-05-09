import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../users/current-user.decorator';
import { SkipKyc } from '../common/decorators/skip-kyc.decorator';
import { KycService } from './kyc.service';
import { SubmitKycDto } from './dto/submit-kyc.dto';

@Controller('kyc')
@UseGuards(JwtAuthGuard)
@SkipKyc()
export class KycController {
  constructor(private readonly service: KycService) {}

  @Get()
  get(@CurrentUser() user: { id: string }) {
    return this.service.get(user.id);
  }

  @Post()
  submit(@CurrentUser() user: { id: string }, @Body() dto: SubmitKycDto) {
    return this.service.submit(user.id, dto);
  }
}
