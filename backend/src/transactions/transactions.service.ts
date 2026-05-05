import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ListTransactionsDto } from './dto/list-transactions.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { serializeTransaction } from './transaction.serializer';
import { PspService } from '../psp/psp.service';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly psp: PspService,
  ) {}

  async list(sellerId: string, dto: ListTransactionsDto) {
    const page = dto.page || 1;
    const pageSize = dto.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const where: any = { sellerId };
    if (dto.status) where.status = dto.status;
    if (dto.method) where.method = dto.method;
    if (dto.search) {
      where.OR = [
        { customerName: { contains: dto.search, mode: 'insensitive' } },
        { customerEmail: { contains: dto.search, mode: 'insensitive' } },
        { customerCpfCnpj: { contains: dto.search } },
        { externalId: { contains: dto.search } },
      ];
    }
    if (dto.startDate || dto.endDate) {
      where.createdAt = {};
      if (dto.startDate) where.createdAt.gte = new Date(dto.startDate);
      if (dto.endDate) where.createdAt.lte = new Date(dto.endDate);
    }

    const [items, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      success: true,
      data: items.map(serializeTransaction),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  }

  async findOne(sellerId: string, id: string) {
    const t = await this.prisma.transaction.findFirst({
      where: { id, sellerId },
    });
    if (!t) throw new NotFoundException('Transação não encontrada.');
    return { success: true, data: serializeTransaction(t) };
  }

  /**
   * Criação de cobrança real exige PSP (Simpay) ativo. Como o usuário ainda
   * não passou as credenciais, retornamos 503 padronizado pra o frontend
   * tratar com mensagem amigável em vez de quebrar.
   */
  async create(sellerId: string, dto: CreateTransactionDto) {
    if (!this.psp.isConfigured()) {
      throw new ServiceUnavailableException({
        success: false,
        code: 'PSP_NOT_CONFIGURED',
        message:
          'Nenhum PSP ativo. Configure SIMPAY_API_KEY (ou outro adquirente) nas variáveis de ambiente.',
      });
    }

    // Quando PSP estiver configurado, esse fluxo será:
    //   1. calcula taxas com base no Seller.feePercent* / feeFixed*
    //   2. chama this.psp.createCharge(...)
    //   3. salva Transaction com pspName + externalId + status PENDING
    //   4. retorna serializeTransaction(t)
    // Por enquanto, sinaliza falta de config.
    throw new ServiceUnavailableException({
      success: false,
      code: 'PSP_NOT_CONFIGURED',
      message: 'Aguardando integração com PSP.',
    });
  }
}
