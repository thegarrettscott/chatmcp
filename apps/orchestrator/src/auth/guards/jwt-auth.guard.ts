import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // For now, allow all requests
    // TODO: Implement proper JWT validation with Auth0
    return true;
  }
} 