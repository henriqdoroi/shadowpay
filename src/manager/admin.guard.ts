import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

/**
 * Bloqueia rotas /api/manager/* pra quem não é isAdministrator.
 * Use SEMPRE depois do JwtAuthGuard.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    if (!user?.isAdministrator) {
      throw new ForbiddenException('Acesso negado: somente administradores.');
    }
    return true;
  }
}
