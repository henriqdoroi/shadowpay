import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitKycDto } from './dto/submit-kyc.dto';

function serialize(k: any) {
  if (!k) return null;
  return {
    id: k.id,
    status: k.status,
    message: k.message ?? '',
    documentFrontUrl: k.documentFrontUrl ?? null,
    documentBackUrl: k.documentBackUrl ?? null,
    selfieUrl: k.selfieUrl ?? null,
    proofOfAddressUrl: k.proofOfAddressUrl ?? null,
    reviewedAt: k.reviewedAt?.toISOString?.() ?? null,
    createdAt: k.createdAt?.toISOString?.() ?? null,
    updatedAt: k.updatedAt?.toISOString?.() ?? null,
  };
}

@Injectable()
export class KycService {
  constructor(private readonly prisma: PrismaService) {}

  async get(sellerId: string) {
    const k = await this.prisma.kyc.findUnique({ where: { sellerId } });
    if (!k) throw new NotFoundException('Registro KYC não encontrado.');
    return { success: true, data: serialize(k) };
  }

  async submit(sellerId: string, dto: SubmitKycDto) {
    const k = await this.prisma.kyc.update({
      where: { sellerId },
      data: {
        status: 'PENDING',
        message: 'Aguardando análise.',
        documentFrontUrl: dto.documentFrontUrl ?? undefined,
        documentBackUrl: dto.documentBackUrl ?? undefined,
        selfieUrl: dto.selfieUrl ?? undefined,
        proofOfAddressUrl: dto.proofOfAddressUrl ?? undefined,
      },
    });
    return { success: true, message: 'Documentação enviada. Aguarde análise.', data: serialize(k) };
  }
}
