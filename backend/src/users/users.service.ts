import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { serializeSeller } from './seller.serializer';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

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

    // Estatísticas básicas — só agregação simples por enquanto.
    // Quando os módulos de transações estiverem prontos, isso fica mais rico.
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
}
