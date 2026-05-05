import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { PspService } from '../psp/psp.service';

function serialize(w: any) {
  if (!w) return null;
  return {
    id: w.id,
    sellerId: w.sellerId,
    amount: String(w.amount),
    feeAmount: String(w.feeAmount),
    pixKey: w.pixKey ?? null,
    pixKeyType: w.pixKeyType ?? null,
    bankAccount: w.bankAccount ?? null,
    status: w.status,
    externalId: w.externalId ?? null,
    paidAt: w.paidAt?.toISOString?.() ?? null,
    createdAt: w.createdAt?.toISOString?.() ?? null,
    updatedAt: w.updatedAt?.toISOString?.() ?? null,
  };
}

@Injectable()
export class WithdrawalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly psp: PspService,
  ) {}

  async list(sellerId: string, page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      this.prisma.withdrawal.findMany({
        where: { sellerId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.withdrawal.count({ where: { sellerId } }),
    ]);

    return {
      success: true,
      data: items.map(serialize),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  }

  async findOne(sellerId: string, id: string) {
    const w = await this.prisma.withdrawal.findFirst({
      where: { id, sellerId },
    });
    if (!w) throw new NotFoundException('Saque não encontrado.');
    return { success: true, data: serialize(w) };
  }

  async create(sellerId: string, dto: CreateWithdrawalDto) {
    // Verifica saldo disponível antes mesmo de tocar no PSP
    const wallet = await this.prisma.wallet.findFirst({
      where: { sellerId },
    });
    if (!wallet) {
      throw new BadRequestException('Carteira não encontrada para esse seller.');
    }
    const available = Number(wallet.balance);
    if (available < dto.amount) {
      throw new BadRequestException(
        `Saldo insuficiente. Disponível: R$ ${available.toFixed(2)}`,
      );
    }

    if (!this.psp.isConfigured()) {
      throw new ServiceUnavailableException({
        success: false,
        code: 'PSP_NOT_CONFIGURED',
        message:
          'Saques precisam de um PSP ativo. Configure SIMPAY_API_KEY nas variáveis de ambiente.',
      });
    }

    // Quando PSP estiver pronto:
    //   1. cria Withdrawal status PENDING
    //   2. bloqueia valor na wallet (move balance -> blockedBalance)
    //   3. dispara payout PIX no PSP
    //   4. atualiza withdrawal com externalId
    //   5. webhook do PSP confirma e libera/falha
    throw new ServiceUnavailableException({
      success: false,
      code: 'PSP_NOT_CONFIGURED',
      message: 'Aguardando integração com PSP.',
    });
  }
}
