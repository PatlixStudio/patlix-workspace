import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthUser } from '@patlix/shared';
import type { RequestWithUser } from './jwt-auth.guard';

/**
 * Parameter decorator exposing the authenticated user attached by
 * {@link JwtAuthGuard}, e.g. `@CurrentUser() user: AuthUser`.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser => {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);
