import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { serializeSeller } from './seller.serializer';
import { UpdateProfileDto, ChangePasswordDto } from './dto/update-profile.dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly email: EmailService,
  ) {}

  async getProfile(sellerId: string) {
    const seller = await this.prisma.seller.findUnique({
      where: { id: sellerId },
      include: {
        wallet: true,
        credentials: true,
        kyc: true,
      },
    });

    if (!seller) {
      throw new NotFoundException('Seller não encontrado.');
    }

    const [totalSales, paidAgg, currentMonthAgg] = await Promise.all([
      this.prisma.transaction.count({
        where: { sellerId, status: 'PAID' },
      }),
      this.prisma.transaction.aggregate({
        where: { sellerId, status: 'PAID' },
        _sum: { grossAmount: true, netAmount: true, feeAmount: true },
      }),
      this.prisma.transaction.aggregate({
        where: {
          sellerId,
          status: 'PAID',
          paidAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
        _sum: { grossAmount: true, netAmount: true },
        _count: true,
      }),
    ]);

    const uniqueCustomers = await this.prisma.transaction.groupBy({
      by: ['customerEmail'],
      where: { sellerId, status: 'PAID', customerEmail: { not: null } },
    });

    const serialized = serializeSeller(seller);

    return {
      success: true,
      data: {
        ...serialized,
        statistics: {
          totalSales,
          grossRevenue: Number(paidAgg._sum.grossAmount ?? 0),
          netRevenue: Number(paidAgg._sum.netAmount ?? 0),
          totalFees: Number(paidAgg._sum.feeAmount ?? 0),
          uniqueCustomers: uniqueCustomers.length,
          monthlySales: currentMonthAgg._count ?? 0,
          monthlyRevenue: Number(currentMonthAgg._sum.netAmount ?? 0),
        },
      },
    };
  }

  async updateProfile(sellerId: string, dto: UpdateProfileDto) {
    const seller = await this.prisma.seller.update({
      where: { id: sellerId },
      data: {
        ...(dto.companyName !== undefined && { companyName: dto.companyName.trim() }),
        ...(dto.number !== undefined && { number: dto.number }),
        ...(dto.zipCode !== undefined && { zipCode: dto.zipCode }),
        ...(dto.companyModality !== undefined && { companyModality: dto.companyModality }),
        ...(dto.companyActivity !== undefined && { companyActivity: dto.companyActivity }),
      },
      include: { wallet: true, credentials: true, kyc: true },
    });
    return { success: true, message: 'Perfil atualizado.', data: serializeSeller(seller) };
  }

  async changePassword(sellerId: string, dto: ChangePasswordDto, ip?: string | null) {
    const seller = await this.prisma.seller.findUnique({
      where: { id: sellerId },
      select: { passwordHash: true, email: true },
    });
    if (!seller) throw new NotFoundException();

    const ok = await bcrypt.compare(dto.currentPassword, seller.passwordHash);
    if (!ok) throw new UnauthorizedException('Senha atual incorreta.');

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('Nova senha precisa ser diferente da atual.');
    }

    const rounds = Number(this.config.get<string>('BCRYPT_SALT_ROUNDS')) || 12;
    const passwordHash = await bcrypt.hash(dto.newPassword, rounds);
    await this.prisma.seller.update({
      where: { id: sellerId },
      data: { passwordHash },
    });
    this.email.sendPasswordChanged(seller.email, ip ?? null).catch(() => {});
    return { success: true, message: 'Senha alterada com sucesso.' };
  }

  /**
   * Regenera (rotaciona) credenciais de API do seller.
   * As antigas ficam revogadas (revokedAt setado) e uma nova ativa é criada.
   */
  async rotateCredentials(sellerId: string) {
    const { randomBytes } = await import('crypto');
    const newPub = 'pk_live_' + randomBytes(24).toString('hex');
    const newPriv = 'sk_live_' + randomBytes(32).toString('hex');

    await this.prisma.credentials.updateMany({
      where: { sellerId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    const cred = await this.prisma.credentials.create({
      data: { sellerId, publicKey: newPub, privateKey: newPriv },
    });
    return {
      success: true,
      message: 'Credenciais regeneradas. Guarde a privateKey — ela não será exibida de novo.',
      data: {
        id: cred.id,
        publicKey: cred.publicKey,
        privateKey: cred.privateKey,
        createdAt: cred.createdAt.toISOString(),
      },
    };
  }
}
