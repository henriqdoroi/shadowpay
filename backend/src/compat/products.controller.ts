/**
 * /api/products — info-products do seller (gera checkout).
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
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../users/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

class ListQuery {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(1000) pageSize?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(1000) limit?: number;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsEnum(['ACTIVE', 'DRAFT', 'ARCHIVED']) status?: 'ACTIVE'|'DRAFT'|'ARCHIVED';
}

class CreateProductDto {
  @IsString() @MaxLength(180) name!: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @Type(() => Number) @IsInt() @Min(0) priceCents!: number;
  @IsOptional() @IsEnum(['ACTIVE', 'DRAFT', 'ARCHIVED']) status?: 'ACTIVE'|'DRAFT'|'ARCHIVED';
  @IsOptional() @IsUrl() imageUrl?: string;
}

class UpdateProductDto {
  @IsOptional() @IsString() @MaxLength(180) name?: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) priceCents?: number;
  @IsOptional() @IsEnum(['ACTIVE', 'DRAFT', 'ARCHIVED']) status?: 'ACTIVE'|'DRAFT'|'ARCHIVED';
  @IsOptional() @IsUrl() imageUrl?: string;
}

function checkoutUrl(productId: string): string {
  const base = process.env.CHECKOUT_BASE_URL || 'https://shadowpay-delta.vercel.app';
  return `${base}/checkout/${productId}`;
}

function serialize(p: any) {
  if (!p) return null;
  return {
    id: p.id,
    sellerId: p.sellerId,
    name: p.name,
    description: p.description ?? null,
    priceCents: p.priceCents,
    price: (p.priceCents / 100).toFixed(2),
    status: p.status,
    imageUrl: p.imageUrl ?? null,
    salesCount: p.salesCount,
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
  async list(@CurrentUser() user: { id: string }, @Query() q: ListQuery) {
    const page = q.page || 1;
    const pageSize = q.pageSize || q.limit || 20;
    const skip = (page - 1) * pageSize;
    const where: any = { sellerId: user.id };
    if (q.status) where.status = q.status;
    if (q.search) where.name = { contains: q.search, mode: 'insensitive' };

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where, orderBy: { createdAt: 'desc' }, skip, take: pageSize,
      }),
      this.prisma.product.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const data = items.map(serialize);
    return {
      success: true,
      data,
      products: data,
      pagination: { page, pageSize, total, totalPages, pages: totalPages },
    };
  }

  @Get(':id')
  async findOne(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    const p = await this.prisma.product.findFirst({ where: { id, sellerId: user.id } });
    if (!p) throw new NotFoundException('Produto nao encontrado.');
    return { success: true, data: serialize(p) };
  }

  @Post()
  async create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateProductDto,
  ) {
    if (!dto.name?.trim()) throw new BadRequestException('Nome obrigatorio.');
    const p = await this.prisma.product.create({
      data: {
        sellerId: user.id,
        name: dto.name.trim(),
        description: dto.description ?? null,
        priceCents: dto.priceCents,
        status: dto.status ?? 'ACTIVE',
        imageUrl: dto.imageUrl ?? null,
      },
    });
    return { success: true, data: serialize(p), product: serialize(p) };
  }

  @Put(':id')
  async update(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    const existing = await this.prisma.product.findFirst({ where: { id, sellerId: user.id } });
    if (!existing) throw new NotFoundException('Produto nao encontrado.');
    const p = await this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.priceCents !== undefined && { priceCents: dto.priceCents }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
      },
    });
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
