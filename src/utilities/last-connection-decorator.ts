import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

// Decorator metadata key
export const TRACK_LAST_CONNECTION_KEY = 'tracklast_connection';

// Decorator
export const Tracklast_connection = () => SetMetadata(TRACK_LAST_CONNECTION_KEY, true);

// Interceptor
@Injectable()
export class last_connectionInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const shouldTrack = this.reflector.getAllAndOverride<boolean>(
      TRACK_LAST_CONNECTION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!shouldTrack) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user && user.id) {
      // Update asynchronously without blocking the response
      this.userRepository
        .update(user.id, { last_connection: new Date() })
        .catch((error) => {
          console.error('Error updating last connection:', error);
        });
    }

    return next.handle();
  }
}