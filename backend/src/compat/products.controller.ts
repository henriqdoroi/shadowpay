/**
 * /api/products — info-products do seller (gera checkout).
 *
 * Tolerante a varias convencoes do frontend:
 *   nome:        name | nome | title | titulo | productName | nomeProduto | produto
 *   preco:       priceCents (int)  OR  price/preco/valor/priceReais/amount
 *                (string "R$ 21,56" / "21,56" / "21.56" / number)
 *   descricao:   description | descricao | desc
 *   imagem:      imageUrl | image | imagem | foto | thumbnail
 *   status:      status | situacao  (ACTIVE/DRAFT/ARCHIVED)
 */
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../users/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

const NAME_KEYS = ['name', 'nome', 'title', 'titulo', 'productName', 'nomeProduto', 'produto'];
const PRICE_KEYS = ['priceCents', 'price', 'preco', 'valor', 'priceReais', 'amount', 'value'];
const DESC_KEYS = ['description', 'descricao', 'desc'];
const IMAGE_KEYS = ['imageUrl', 'image', 'imagem', 'foto', 'thumbnail', 'thumb'];

function pickStr(body: any, keys: string[]): string {
  for (const k of keys) {
    const v = body?.[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (typeof v === 'number') return String(v);
  }
  return '';
}

function parsePriceCents(body: any): number | null {
  if (typeof body?.priceCents === 'number' && Number.isFinite(body.priceCents)) {
    return Math.round(body.priceCents);
  }
  if (typeof body?.priceCents === 'string') {
    const n = parseInt(body.priceCents, 10);
    if (Number.isFinite(n)) return n;
  }
  for (const key of ['price', 'preco', 'valor', 'priceReais', 'amount', 'value']) {
    const v = body?.[key];
    if (v == null) continue;
    if (typeof v === 'number' && Number.isFinite(v)) return Math.round(v * 100);
    if (typeof v === 'string') {
      const cleaned = v
        .replace(/[^\d,.\-]/g, '')
        .replace(/\.(?=\d{3}(\D|$))/g, '')
        .replace(',', '.');
      const f = parseFloat(cleaned);
      if (Number.isFinite(f)) return Math.round(f * 100);
    }
  }
  return null;
}

function pickStatus(body: any): 'ACTIVE' | 'DRAFT' | 'ARCHIVED' {
  const raw = String(body?.status ?? body?.situacao ?? '').toUpperCase();
  if (raw === 'DRAFT' || raw === 'RASCUNHO') return 'DRAFT';
  if (raw === 'ARCHIVED' || raw === 'ARQUIVADO' || raw === 'INACTIVE' || raw === 'INATIVO') return 'ARCHIVED';
  return 'ACTIVE';
}

function checkoutUrl(productId: string): string {
  const base = process.env.CHECKOUT_BASE_URL || 'https://shadowpay-delta.vercel.app';
  return `${base}/checkout/${productId}`;
}

function serialize(p: any) {
  if (!p) return null;
  const reais = p.priceCents / 100;
  return {
    id: p.id,
    sellerId: p.sellerId,
    name: p.name,
    nome: p.name,
    description: p.description ?? null,
    descricao: p.description ?? null,
    priceCents: p.priceCents,
    price: reais.toFixed(2),
    priceReais: reais,
    valor: reais.toFixed(2).replace('.', ','),
    status: p.status,
    imageUrl: p.imageUrl ?? null,
    imagem: p.imageUrl ?? null,
    salesCount: p.salesCount,
    sales: p.salesCount,
    vendas: p.salesCount,
    checkoutUrl: checkoutUrl(p.id),
    link: checkoutUrl(p.id),
    createdAt: p.createdAt?.toISOString?.() ?? null,
    updatedAt: p.updatedAt?.toISOString?.() ?? null,
  };
}

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  private readonly logger = new Logger('Products');

  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@CurrentUser() user: { id: string }, @Query() q: any) {
    const page = Math.max(1, parseInt(String(q.page || 1), 10) || 1);
    const pageSize = Math.min(1000, Math.max(1, parseInt(String(q.pageSize || q.limit || 20), 10) || 20));
    const skip = (page - 1) * pageSize;
    const where: any = { sellerId: user.id };
    if (q.status && ['ACTIVE', 'DRAFT', 'ARCHIVED'].includes(q.status)) where.status = q.status;
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
    if (!p) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: `Produto ${id} nao encontrado pra esse seller.`,
      });
    }
    return { success: true, data: serialize(p) };
  }

  @Post()
  async create(@CurrentUser() user: { id: string }, @Body() body: any) {
    const name = pickStr(body, NAME_KEYS);
    const priceCents = parsePriceCents(body);
    const description = pickStr(body, DESC_KEYS);
    const imageUrl = pickStr(body, IMAGE_KEYS);
    const status = pickStatus(body);

    if (!name) {
      this.logger.warn(`POST /products: nome ausente. Body keys: ${Object.keys(body ?? {}).join(', ')}`);
      throw new BadRequestException({
        code: 'NAME_REQUIRED',
        message: 'Nome do produto e obrigatorio.',
        receivedKeys: Object.keys(body ?? {}),
        accept: NAME_KEYS,
      });
    }

    if (priceCents == null || priceCents < 0) {
      this.logger.warn(`POST /products: preco invalido. Body: ${JSON.stringify(body)}`);
      throw new BadRequestException({
        code: 'PRICE_REQUIRED',
        message: 'Preco do produto e obrigatorio (ex: 21.56 ou "R$ 21,56").',
        receivedKeys: Object.keys(body ?? {}),
        accept: PRICE_KEYS,
      });
    }

    const p = await this.prisma.product.create({
      data: {
        sellerId: user.id,
        name,
        description: description || null,
        priceCents,
        status,
        imageUrl: imageUrl || null,
      },
    });
    return {
      success: true,
      data: serialize(p),
      product: serialize(p),
      message: 'Produto criado.',
    };
  }

  @Put(':id')
  async update(@CurrentUser() user: { id: string }, @Param('id') id: string, @Body() body: any) {
    const existing = await this.prisma.product.findFirst({ where: { id, sellerId: user.id } });
    if (!existing) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: `Produto ${id} nao encontrado pra esse seller.`,
      });
    }

    const data: any = {};
    const name = pickStr(body, NAME_KEYS);
    if (name) data.name = name;
    const description = body?.description ?? body?.descricao ?? body?.desc;
    if (description !== undefined) data.description = description || null;
    const imageUrl = body?.imageUrl ?? body?.image ?? body?.imagem ?? body?.foto;
    if (imageUrl !== undefined) data.imageUrl = imageUrl || null;
    const cents = parsePriceCents(body);
    if (cents !== null) data.priceCents = Math.max(0, cents);
    if (body?.status || body?.situacao) data.status = pickStatus(body);

    const p = await this.prisma.product.update({ where: { id }, data });
    return { success: true, data: serialize(p), product: serialize(p), message: 'Produto atualizado.' };
  }

  @Delete(':id')
  async remove(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    const p = await this.prisma.product.findFirst({ where: { id, sellerId: user.id } });
    if (!p) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: `Produto ${id} nao encontrado pra esse seller.`,
      });
    }
    await this.prisma.product.delete({ where: { id } });
    return { success: true, message: 'Removido.' };
  }
}
