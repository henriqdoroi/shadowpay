import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resumo agregado pra cards do dashboard.
   */
  async summary(sellerId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const [allPaid, monthPaid, prevMonthPaid, customers] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: { sellerId, status: 'PAID' },
        _sum: { grossAmount: true, netAmount: true, feeAmount: true },
        _count: true,
      }),
      this.prisma.transaction.aggregate({
        where: { sellerId, status: 'PAID', paidAt: { gte: startOfMonth } },
        _sum: { grossAmount: true, netAmount: true, feeAmount: true },
        _count: true,
      }),
      this.prisma.transaction.aggregate({
        where: {
          sellerId,
          status: 'PAID',
          paidAt: { gte: startOfPrevMonth, lte: endOfPrevMonth },
        },
        _sum: { grossAmount: true, netAmount: true },
        _count: true,
      }),
      this.prisma.transaction.groupBy({
        by: ['customerEmail'],
        where: { sellerId, status: 'PAID', customerEmail: { not: null } },
      }),
    ]);

    return {
      success: true,
      data: {
        totalSales: allPaid._count,
        grossRevenue: Number(allPaid._sum.grossAmount ?? 0),
        netRevenue: Number(allPaid._sum.netAmount ?? 0),
        totalFees: Number(allPaid._sum.feeAmount ?? 0),
        uniqueCustomers: customers.length,
        monthlySales: monthPaid._count,
        monthlyRevenue: Number(monthPaid._sum.netAmount ?? 0),
        previousMonthSales: prevMonthPaid._count,
        previousMonthRevenue: Number(prevMonthPaid._sum.netAmount ?? 0),
      },
    };
  }

  /**
   * Série temporal diária dos últimos N dias (default 30) — pra montar linha/área.
   */
  async timeseries(sellerId: string, days = 30) {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const rows = await this.prisma.transaction.findMany({
      where: { sellerId, status: 'PAID', paidAt: { gte: cutoff } },
      select: { paidAt: true, netAmount: true, grossAmount: true, method: true },
    });

    // agrupa por data ISO (YYYY-MM-DD)
    const byDay: Record<string, { count: number; net: number; gross: number; byMethod: Record<string, number> }> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      byDay[key] = { count: 0, net: 0, gross: 0, byMethod: {} };
    }
    for (const r of rows) {
      const key = r.paidAt!.toISOString().slice(0, 10);
      if (!byDay[key]) byDay[key] = { count: 0, net: 0, gross: 0, byMethod: {} };
      byDay[key].count++;
      byDay[key].net += Number(r.netAmount);
      byDay[key].gross += Number(r.grossAmount);
      byDay[key].byMethod[r.method] = (byDay[key].byMethod[r.method] ?? 0) + Number(r.netAmount);
    }

    const series = Object.entries(byDay)
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, v]) => ({ date, ...v }));

    return { success: true, data: series };
  }

  /**
   * Distribuição por método de pagamento (pra pizza/donut).
   */
  async byMethod(sellerId: string) {
    const rows = await this.prisma.transaction.groupBy({
      by: ['method'],
      where: { sellerId, status: 'PAID' },
      _sum: { netAmount: true },
      _count: true,
    });
    return {
      success: true,
      data: rows.map((r) => ({
        method: r.method,
        count: r._count,
        netAmount: Number(r._sum.netAmount ?? 0),
      })),
    };
  }
}
