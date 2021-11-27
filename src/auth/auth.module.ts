import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserRepository } from './user.repository';
import { JwtModule} from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { CollectionModule } from 'src/collection/collection.module';
import { UtilitiesService } from 'src/utilities/create.root';

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
    UtilitiesService,

  ],
  
  exports: [
    JwtStrategy,
    PassportModule,
  ],
})
export class AuthModule {}