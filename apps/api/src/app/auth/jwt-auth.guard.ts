import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { AuthUser } from '@patlix/shared';

export interface RequestWithUser {
  user: AuthUser;
  headers: Record<string, string | string[] | undefined>;
}

/**
 * Guard that validates the `Authorization: Bearer <token>` header.
 * On success it attaches the authenticated user to the request.
 */
@Injectable()
export class JwtAuthGuard {
  constructor(private readonly jwtService: JwtService) {}

  /**
   * Verifies the JWT and attaches the user payload to the request.
   */
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const raw = request.headers['authorization'];
    const authHeader = typeof raw === 'string' ? raw : '';

    if (!authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or malformed authorization header');
    }

    const token = authHeader.slice('Bearer '.length);
    try {
      request.user = this.jwtService.verify<AuthUser>(token);
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }
}
