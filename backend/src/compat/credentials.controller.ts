import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../users/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';

@Controller('credentials')
@UseGuards(JwtAuthGuard)
export class CredentialsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
  ) {}

  // GET /api/credentials — lista as credenciais ativas do seller
  @Get()
  async list(@CurrentUser() user: { id: string }) {
    const items = await this.prisma.credentials.findMany({
      where: { sellerId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    return {
      success: true,
      data: items.map((c) => ({
        id: c.id,
        publicKey: c.publicKey,
        privateKey: c.privateKey,
        createdAt: c.createdAt.toISOString(),
        lastUsedAt: c.lastUsedAt?.toISOString() ?? null,
        revokedAt: c.revokedAt?.toISOString() ?? null,
      })),
    };
  }

  // POST /api/credentials — gera um novo par e revoga o anterior
  @Post()
  rotate(@CurrentUser() user: { id: string }) {
    return this.users.rotateCredentials(user.id);
  }
}
