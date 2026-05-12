/**
 * /api/products — info-products do seller (gera checkout).
 *
 * Aceita JSON e multipart/form-data (com upload de imagem opcional).
 *
 * Campos aceitos:
 *   nome:           name | nome | title | titulo | productName | nomeProduto | produto
 *   preco:          priceCents (int)  OR  price/preco/valor/priceReais/amount
 *   descricao:      description | descricao | desc
 *   imagem URL:     imageUrl | image | imagem | foto | thumbnail
 *   imagem file:    qualquer campo multipart com mime image/* -> data URL base64
 *   status:         status | situacao  (ACTIVE/DRAFT/ARCHIVED)
 *   backredirect:   backRedirectUrl | backRedirect | redirectUrl | postPurchaseUrl
 *   upsell:         upsellProductId | upsellId | upsell | upsellUrl
 *   garantia:       warrantyDays | garantia | garantiaDias | warranty
 *   email suporte:  supportEmail | suporteEmail | emailSuporte | email
 *   telefone:       supportPhone | suportePhone | telefoneSuporte | telefone | phone | whatsapp
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
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../users/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { SkipKyc } from '../common/decorators/skip-kyc.decorator';
import { PrismaService } from '../prisma/prisma.service';

const NAME_KEYS = ['name', 'nome', 'title', 'titulo', 'productName', 'nomeProduto', 'produto'];
const PRICE_KEYS = ['priceCents', 'price', 'preco', 'valor', 'priceReais', 'amount', 'value'];
const DESC_KEYS = ['description', 'descricao', 'desc'];
const IMAGE_KEYS = ['imageUrl', 'image', 'imagem', 'foto', 'thumbnail', 'thumb'];
const BACKREDIRECT_KEYS = ['backRedirectUrl', 'backRedirect', 'redirectUrl', 'postPurchaseUrl', 'urlRedirect', 'redirect'];
const UPSELL_PRODUCT_KEYS = ['upsellProductId', 'upsellId', 'upsell_product_id'];
const UPSELL_URL_KEYS = ['upsellUrl', 'upsell_url', 'upsell'];
const WARRANTY_KEYS = ['warrantyDays', 'garantia', 'garantiaDias', 'warranty', 'diasGarantia'];
const SUPPORT_EMAIL_KEYS = ['supportEmail', 'suporteEmail', 'emailSuporte', 'supportMail', 'email'];
const SUPPORT_PHONE_KEYS = ['supportPhone', 'suportePhone', 'telefoneSuporte', 'telefone', 'phone', 'whatsapp', 'celular'];

function pickStr(body: any, keys: string[]): string {
  for (const k of keys) {
    const v = body?.[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (typeof v === 'number') return String(v);
  }
  return '';
}

function pickInt(body: any, keys: string[]): number | null {
  for (const k of keys) {
    const v = body?.[k];
    if (v == null) continue;
    if (typeof v === 'number' && Number.isFinite(v)) return Math.round(v);
    if (typeof v === 'string') {
      const n = parseInt(v, 10);
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
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
      const cleaned = v.replace(/[^\d,.\-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
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

function fileToDataUrl(f: Express.Multer.File): string {
  const mime = f.mimetype || 'application/octet-stream';
  return `data:${mime};base64,${f.buffer.toString('base64')}`;
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
    backRedirectUrl: p.backRedirectUrl ?? null,
    backRedirect: p.backRedirectUrl ?? null,
    redirectUrl: p.backRedirectUrl ?? null,
    upsellProductId: p.upsellProductId ?? null,
    upsellUrl: p.upsellUrl ?? null,
    upsell: p.upsellProductId ?? p.upsellUrl ?? null,
    warrantyDays: p.warrantyDays ?? 7,
    garantia: p.warrantyDays ?? 7,
    garantiaDias: p.warrantyDays ?? 7,
    supportEmail: p.supportEmail ?? null,
    emailSuporte: p.supportEmail ?? null,
    supportPhone: p.supportPhone ?? null,
    telefoneSuporte: p.supportPhone ?? null,
    telefone: p.supportPhone ?? null,
    whatsapp: p.supportPhone ?? null,
    createdAt: p.createdAt?.toISOString?.() ?? null,
    updatedAt: p.updatedAt?.toISOString?.() ?? null,
  };
}

function readPayload(body: any) {
  return {
    name: pickStr(body, NAME_KEYS),
    priceCents: parsePriceCents(body),
    description: pickStr(body, DESC_KEYS),
    imageUrl: pickStr(body, IMAGE_KEYS),
    status: pickStatus(body),
    backRedirectUrl: pickStr(body, BACKREDIRECT_KEYS),
    upsellProductId: pickStr(body, UPSELL_PRODUCT_KEYS),
    upsellUrl: pickStr(body, UPSELL_URL_KEYS),
    warrantyDays: pickInt(body, WARRANTY_KEYS),
    supportEmail: pickStr(body, SUPPORT_EMAIL_KEYS),
    supportPhone: pickStr(body, SUPPORT_PHONE_KEYS),
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
    if (!id || id === 'undefined' || id === 'null') {
      throw new NotFoundException({ code: 'INVALID_ID', message: 'ID do produto invalido.' });
    }
    const p = await this.prisma.product.findFirst({ where: { id, sellerId: user.id } });
    if (!p) throw new NotFoundException({ code: 'NOT_FOUND', message: `Produto ${id} nao encontrado.` });
    return { success: true, data: serialize(p) };
  }

  @Post()
  @UseInterceptors(AnyFilesInterceptor())
  async create(
    @CurrentUser() user: { id: string },
    @Body() body: any,
    @UploadedFiles() files: Express.Multer.File[] = [],
  ) {
    const r = readPayload(body);
    let imageUrl = r.imageUrl;
    if (!imageUrl && files?.length) {
      const f = files.find((x) => /^image\//i.test(x.mimetype || '')) ?? files[0];
      if (f && f.size < 1.5 * 1024 * 1024) imageUrl = fileToDataUrl(f);
    }

    if (!r.name) {
      this.logger.warn(`POST /products: nome ausente. Keys=${Object.keys(body ?? {}).join(',')} files=${files?.length || 0}`);
      throw new BadRequestException({
        code: 'NAME_REQUIRED',
        message: 'Nome do produto e obrigatorio.',
        receivedKeys: Object.keys(body ?? {}),
        accept: NAME_KEYS,
      });
    }

    if (r.priceCents == null || r.priceCents < 0) {
      throw new BadRequestException({
        code: 'PRICE_REQUIRED',
        message: 'Preco do produto e obrigatorio.',
        receivedKeys: Object.keys(body ?? {}),
        accept: PRICE_KEYS,
      });
    }

    const p = await this.prisma.product.create({
      data: {
        sellerId: user.id,
        name: r.name,
        description: r.description || null,
        priceCents: r.priceCents,
        status: r.status,
        imageUrl: imageUrl || null,
        backRedirectUrl: r.backRedirectUrl || null,
        upsellProductId: r.upsellProductId || null,
        upsellUrl: r.upsellUrl || null,
        warrantyDays: r.warrantyDays ?? 7,
        supportEmail: r.supportEmail || null,
        supportPhone: r.supportPhone || null,
      },
    });
    return { success: true, data: serialize(p), product: serialize(p), message: 'Produto criado.' };
  }

  @Put(':id')
  @UseInterceptors(AnyFilesInterceptor())
  async update(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() body: any,
    @UploadedFiles() files: Express.Multer.File[] = [],
  ) {
    if (!id || id === 'undefined' || id === 'null') {
      throw new NotFoundException({ code: 'INVALID_ID', message: 'ID do produto invalido.' });
    }
    const existing = await this.prisma.product.findFirst({ where: { id, sellerId: user.id } });
    if (!existing) throw new NotFoundException({ code: 'NOT_FOUND', message: `Produto ${id} nao encontrado.` });

    const r = readPayload(body);
    let imageUrl = r.imageUrl;
    if (!imageUrl && files?.length) {
      const f = files.find((x) => /^image\//i.test(x.mimetype || '')) ?? files[0];
      if (f && f.size < 1.5 * 1024 * 1024) imageUrl = fileToDataUrl(f);
    }

    const data: any = {};
    if (r.name) data.name = r.name;
    if (body?.description !== undefined || body?.descricao !== undefined || body?.desc !== undefined) {
      data.description = r.description || null;
    }
    if (imageUrl !== '' && imageUrl != null) data.imageUrl = imageUrl;
    if (r.priceCents !== null) data.priceCents = Math.max(0, r.priceCents);
    if (body?.status || body?.situacao) data.status = r.status;

    // Campos novos — sobrescrevem se vieram (mesmo string vazia limpa)
    for (const k of BACKREDIRECT_KEYS) if (body?.[k] !== undefined) { data.backRedirectUrl = r.backRedirectUrl || null; break; }
    for (const k of UPSELL_PRODUCT_KEYS) if (body?.[k] !== undefined) { data.upsellProductId = r.upsellProductId || null; break; }
    for (const k of UPSELL_URL_KEYS) if (body?.[k] !== undefined) { data.upsellUrl = r.upsellUrl || null; break; }
    if (r.warrantyDays !== null) data.warrantyDays = r.warrantyDays;
    for (const k of SUPPORT_EMAIL_KEYS) if (body?.[k] !== undefined) { data.supportEmail = r.supportEmail || null; break; }
    for (const k of SUPPORT_PHONE_KEYS) if (body?.[k] !== undefined) { data.supportPhone = r.supportPhone || null; break; }

    const p = await this.prisma.product.update({ where: { id }, data });
    return { success: true, data: serialize(p), product: serialize(p), message: 'Produto atualizado.' };
  }

  @Delete(':id')
  async remove(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    if (!id || id === 'undefined' || id === 'null') {
      throw new NotFoundException({ code: 'INVALID_ID', message: 'ID do produto invalido.' });
    }
    const p = await this.prisma.product.findFirst({ where: { id, sellerId: user.id } });
    if (!p) throw new NotFoundException({ code: 'NOT_FOUND', message: `Produto ${id} nao encontrado.` });
    await this.prisma.product.delete({ where: { id } });
    return { success: true, message: 'Removido.' };
  }
}

/**
 * Endpoint PUBLICO pra checkout — cliente final (sem JWT) consulta produto
 * por ID. Sem filtro de sellerId (qualquer pessoa pode ver). Retorna dados
 * suficientes pra renderizar a tela de pagamento.
 */
@Controller('products/public')
@Public()
@SkipKyc()
export class ProductsPublicController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':id')
  async getPublic(@Param('id') id: string) {
    if (!id || id === 'undefined' || id === 'null') {
      throw new NotFoundException({ code: 'INVALID_ID', message: 'ID do produto invalido.' });
    }
    const p = await this.prisma.product.findUnique({ where: { id } });
    if (!p || p.status !== 'ACTIVE') {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Produto nao encontrado ou indisponivel.' });
    }
    return { success: true, data: serialize(p) };
  }
}
