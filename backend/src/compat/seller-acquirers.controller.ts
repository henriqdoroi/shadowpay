/**
 * /api/adquerers — read-only para seller logado (pra escolher PSP).
 * Diferente de /api/admin/adquerers que precisa admin pra criar/editar.
 */
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ManagerService } from '../manager/manager.service';

@Controller('adquerers')
@UseGuards(JwtAuthGuard)
export class SellerAcquirersController {
  constructor(private readonly manager: ManagerService) {}

  @Get()
  list() {
    return this.manager.listAcquirers();
  }
}
