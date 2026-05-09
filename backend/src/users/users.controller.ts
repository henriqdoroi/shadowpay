import { Body, Controller, Get, Post, Put, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';
import { SkipKyc } from '../common/decorators/skip-kyc.decorator';
import { UsersService } from './users.service';
import { UpdateProfileDto, ChangePasswordDto } from './dto/update-profile.dto';

function clientIp(req: Request): string | null {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string') return xff.split(',')[0].trim();
  return req.ip ?? req.socket?.remoteAddress ?? null;
}

/**
 * Endpoints de perfil — liberados sem KYC pra que o seller consiga
 * carregar seu próprio cadastro mesmo durante onboarding.
 */
@Controller('user')
@UseGuards(JwtAuthGuard)
@SkipKyc()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // GET /api/user/profile — chamado pelo refreshUserData() do frontend
  @Get('profile')
  getProfile(@CurrentUser() user: { id: string }) {
    return this.usersService.getProfile(user.id);
  }

  // PUT /api/user/profile — atualiza dados do seller logado
  @Put('profile')
  updateProfile(
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.id, dto);
  }

  // POST /api/user/change-password
  @Post('change-password')
  changePassword(
    @CurrentUser() user: { id: string },
    @Body() dto: ChangePasswordDto,
    @Req() req: Request,
  ) {
    return this.usersService.changePassword(user.id, dto, clientIp(req));
  }

  // POST /api/user/credentials/rotate — regenera publicKey/privateKey
  @Post('credentials/rotate')
  rotateCredentials(@CurrentUser() user: { id: string }) {
    return this.usersService.rotateCredentials(user.id);
  }
}
