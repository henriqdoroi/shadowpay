/**
 * /api/products — info-products do seller (gera checkout).
 * Aceita preco em varios formatos pra ser tolerante com o frontend Safira:
 *   - priceCents: 2156
 *   - price: "21.56" | "21,56" | "R$ 21,56"
 *   - priceReais / valor / preco: 21.56
 */
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Type } from 'class-transformer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../users/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

function parsePriceCents(body: any): number | null {
  // priceCents direto
  if (typeof body?.priceCents === 'number' && Number.isFinite(body.priceCents)) {
    return Math.round(body.priceCents);
  }
  if (typeof body?.priceCents === 'string') {
    const n = parseInt(body.priceCents, 10);
    if (Number.isFinite(n)) return n;
  }
  // price/preco/valor/priceReais
  for (const key of ['price', 'preco', 'valor', 'priceReais', 'amount']) {
    const v = body?.[key];
    if (v == null) continue;
    if (typeof v === 'number') return Math.round(v * 100);
    if (typeof v === 'string') {
      // "R$ 21,56" -> "21.56"
      const cleaned = v
        .replace(/[^\d,.\-]/g, '')
        .replace(/\.(?=\d{3}(\D|$))/g, '') // remove . como separador de milhar
        .replace(',', '.');
      const f = parseFloat(cleaned);
      if (Number.isFinite(f)) return Math.round(f * 100);
    }
  }
  return null;
}

function checkoutUrl(productId: string): string {
  const base = process.env.CHECKOUT_BASE_URL || 'https://shadowpay-delta.vercel.app';
  return `${base}/checkout/${productId}`;
}

function serialize(p: any) {
  if (!p) return null;
  const reais = (p.priceCents / 100);
  return {
    id: p.id,
    sellerId: p.sellerId,
    name: p.name,
    description: p.description ?? null,
    priceCents: p.priceCents,
    price: reais.toFixed(2),
    priceReais: reais,
    valor: reais.toFixed(2).replace('.', ','),
    status: p.status,
    imageUrl: p.imageUrl ?? null,
    salesCount: p.salesCount,
    sales: p.salesCount,
    checkoutUrl: checkoutUrl(p.id),
    createdAt: p.createdAt?.toISOString?.() ?? null,
    updatedAt: p.updatedAt?.toISOString?.() ?? null,
  };
}

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@CurrentUser() user: { id: string }, @Query() q: any) {
    const page = Math.max(1, parseInt(String(q.page || 1), 10) || 1);
    const pageSize = Math.min(1000, Math.max(1, parseInt(String(q.pageSize || q.limit || 20), 10) || 20));
    const skip = (page - 1) * pageSize;
    const where: any = { sellerId: user.id };
    if (q.status && ['ACTIVE','DRAFT','ARCHIVED'].includes(q.status)) where.status = q.status;
    if (q.search) where.name = { contains: q.search, mode: 'insensitive' };

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: pageSize }),
      this.prisma.product.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const data = items.map(serialize);
    return {
      success: true,
      data,
      products: data,
      pagination: { page, pageSize, total, totalPages, pages: totalPages, current: page },
    };
  }

  @Get(':id')
  async findOne(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    const p = await this.prisma.product.findFirst({ where: { id, sellerId: user.id } });
    if (!p) throw new NotFoundException('Produto nao encontrado.');
    return { success: true, data: serialize(p) };
  }

  @Post()
  async create(@CurrentUser() user: { id: string }, @Body() body: any) {
    const name = String(body?.name ?? body?.title ?? '').trim();
    if (!name) throw new BadRequestException('Nome obrigatorio.');

    const priceCents = parsePriceCents(body);
    if (priceCents == null || priceCents < 0) {
      throw new BadRequestException('Preco invalido. Use priceCents (inteiro) ou price ("21,56").');
    }

    const status = body?.status && ['ACTIVE','DRAFT','ARCHIVED'].includes(body.status)
      ? body.status : 'ACTIVE';

    const p = await this.prisma.product.create({
      data: {
        sellerId: user.id,
        name,
        description: body?.description ?? null,
        priceCents,
        status,
        imageUrl: body?.imageUrl ?? null,
      },
    });
    return { success: true, data: serialize(p), product: serialize(p) };
  }

  @Put(':id')
  async update(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const existing = await this.prisma.product.findFirst({ where: { id, sellerId: user.id } });
    if (!existing) throw new NotFoundException('Produto nao encontrado.');

    const data: any = {};
    if (body?.name !== undefined) data.name = String(body.name).trim();
    if (body?.description !== undefined) data.description = body.description ?? null;
    if (body?.imageUrl !== undefined) data.imageUrl = body.imageUrl ?? null;
    if (body?.status && ['ACTIVE','DRAFT','ARCHIVED'].includes(body.status)) data.status = body.status;

    const cents = parsePriceCents(body);
    if (cents !== null) data.priceCents = cents;

    const p = await this.prisma.product.update({ where: { id }, data });
    return { success: true, data: serialize(p) };
  }

  @Delete(':id')
  async remove(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    const p = await this.prisma.product.findFirst({ where: { id, sellerId: user.id } });
    if (!p) throw new NotFoundException('Produto nao encontrado.');
    await this.prisma.product.delete({ where: { id } });
    return { success: true, message: 'Removido.' };
  }
}
