import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { PspService } from '../psp/psp.service';
import { WalletService } from '../wallet/wallet.service';

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
    private readonly wallet: WalletService,
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
    if (!Number.isFinite(dto.amount) || dto.amount <= 0) {
      throw new BadRequestException('Valor inválido.');
    }

    // 1) Cria a Withdrawal em status PENDING
    const w = await this.prisma.withdrawal.create({
      data: {
        sellerId,
        amount: dto.amount,
        feeAmount: 0,
        pixKey: dto.pixKey ?? null,
        pixKeyType: dto.pixKeyType ?? null,
        bankAccount: dto.bankAccount ?? null,
        status: 'PENDING',
      },
    });

    // 2) Reserva o saldo (move balance -> blockedBalance) com lock atômico.
    //    Se saldo insuficiente, lança e marcamos a withdrawal como FAILED.
    try {
      await this.wallet.holdForWithdraw(sellerId, dto.amount, w.id);
    } catch (err) {
      await this.prisma.withdrawal.update({
        where: { id: w.id },
        data: { status: 'FAILED' },
      });
      throw err;
    }

    // 3) Dispara o payout no PSP. Sem PSP configurado, fica PENDING — admin
    //    pode aprovar/rejeitar manual no painel manager (que vai chamar
    //    consumeHold/releaseHold via WalletService).
    if (!this.psp.isConfigured()) {
      // O saldo já está reservado. Saque PENDING aguarda admin/PSP.
      const fresh = await this.prisma.withdrawal.findUnique({ where: { id: w.id } });
      return { success: true, data: serialize(fresh) };
    }

    // Quando PSP estiver pronto:
    //   - this.psp.createPayout({...})
    //   - atualiza withdrawal com externalId + status PROCESSING
    //   - webhook do PSP confirma e chama consumeHold/releaseHold
    throw new ServiceUnavailableException({
      code: 'PSP_NOT_CONFIGURED',
      message: 'Integração com PSP em provisionamento.',
    });
  }
}
