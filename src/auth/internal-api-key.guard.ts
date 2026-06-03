import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class InternalApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const expectedApiKey = process.env.INTERNAL_API_KEY;
    const providedApiKey = request.headers['x-api-key'];

    if (!expectedApiKey || typeof providedApiKey !== 'string' || providedApiKey !== expectedApiKey) {
      throw new UnauthorizedException();
    }

    return true;
  }
}