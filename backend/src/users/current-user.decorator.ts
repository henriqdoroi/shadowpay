import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Pega o seller autenticado direto do request (já populado pelo JwtStrategy).
 * Uso: @CurrentUser() user: { id: string; ... }
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    return req.user;
  },
);
