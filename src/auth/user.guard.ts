import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable()
export class UserGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    console.log(request.user);
    // Keycloak users can have either `preferred_username` or `email`
    const username = request?.user?.preferred_username || request?.user?.email;
    if (!username) {
      return false;
    }
    const user = this.authService.findWithUsername(username);
    if (!user) {
      return false;
    }
    request.user = user;
    return true;
  }
}