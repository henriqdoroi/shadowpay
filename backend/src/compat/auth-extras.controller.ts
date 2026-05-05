import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../users/current-user.decorator';
import { UsersService } from '../users/users.service';
import { ChangePasswordDto } from '../users/dto/update-profile.dto';

/**
 * Aliases que o frontend usa em /api/auth/*
 */
@Controller('auth')
@UseGuards(JwtAuthGuard)
export class AuthExtrasController {
  constructor(private readonly users: UsersService) {}

  // POST /api/auth/password — trocar senha do usuário logado
  @Post('password')
  changePassword(@CurrentUser() user: { id: string }, @Body() dto: ChangePasswordDto) {
    return this.users.changePassword(user.id, dto);
  }
}
