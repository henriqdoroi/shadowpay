/**
 * /api/products — checkout products que o seller cadastra
 *
 * Como a tabela Product ainda não existe no schema.prisma, retornamos lista
 * vazia + mensagem clara. Pra ativar de verdade:
 *   1. Adicionar model Product { id, sellerId, name, priceCents, ... } no schema
 *   2. Rodar prisma db push
 *   3. Substituir os stubs aqui pelo código real (CRUD via PrismaService)
 */
import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../users/current-user.decorator';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  @Get()
  list(@CurrentUser() _user: { id: string }) {
    return { success: true, data: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 1 } };
  }

  @Get(':id')
  findOne(@CurrentUser() _user: { id: string }, @Param('id') _id: string) {
    return {
      success: false,
      code: 'PRODUCTS_NOT_ENABLED',
      message: 'Cadastro de produtos ainda não implementado no banco.',
    };
  }

  @Post()
  create(@CurrentUser() _user: { id: string }, @Body() _body: any) {
    return {
      success: false,
      code: 'PRODUCTS_NOT_ENABLED',
      message: 'Adicione o model Product no schema.prisma pra ativar.',
    };
  }

  @Put(':id')
  update(@CurrentUser() _user: { id: string }, @Param('id') _id: string, @Body() _body: any) {
    return { success: false, code: 'PRODUCTS_NOT_ENABLED', message: 'Não implementado.' };
  }

  @Delete(':id')
  remove(@CurrentUser() _user: { id: string }, @Param('id') _id: string) {
    return { success: false, code: 'PRODUCTS_NOT_ENABLED', message: 'Não implementado.' };
  }
}
