import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    // For now, return a mock user
    // TODO: Extract user from JWT token
    return {
      sub: 'mock-user-id',
      email: 'user@example.com',
      name: 'Mock User',
    };
  },
); 