import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable()
export class UserGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    // Keycloak users can have either `preferred_username` or `email`
    const username = request?.user?.preferred_username || request?.user?.email;
    if (!username) {
      return false;
    }
    const user = await this.authService.findWithUsername(username);
    if (!user) {
      return false;
    }
    request.user = user;
    return true;
  }
}