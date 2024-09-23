import { forwardRef, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserRepository } from './user.repository';
import { JwtModule} from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { CollectionModule } from 'src/collection/collection.module';
import * as config from 'config';
import { TypeOrmExModule } from 'src/utilities/typeorm-ex.module';
import { PictoModule } from 'src/picto/picto.module';
import { HttpModule } from '@nestjs/axios';
const jwtConfig = config.get('jwt');
@Module({
  imports: [
    TypeOrmExModule.forCustomRepository([UserRepository]),
    PassportModule.register({ defaultStrategy: 'jwt'}),
    HttpModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || jwtConfig.secret,
      signOptions: {
        expiresIn: jwtConfig.expiresIn,
      },
    }),
    forwardRef(() => CollectionModule),
    forwardRef(() => PictoModule),
  ],
  
  controllers: [AuthController],
  
  providers: [
    AuthService,
    JwtStrategy,
  ],
  
  exports: [
    JwtStrategy,
    PassportModule,
    AuthService,
  ],
})
export class AuthModule {}