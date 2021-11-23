import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserRepository } from './user.repository';
import { JwtModule} from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt'}),
    JwtModule.register({
      secret: 'WayTooMuchSunScreen',
      signOptions: {
        expiresIn: 86400,
      },
    }), 

    TypeOrmModule.forFeature([UserRepository])
  ],
  
  controllers: [AuthController],
  
  providers: [
    AuthService,
    JwtStrategy,

  ],
  
  exports: [
    JwtStrategy,
    PassportModule,
  ],
})
export class AuthModule {}