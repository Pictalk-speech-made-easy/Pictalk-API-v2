import { forwardRef, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserRepository } from './user.repository';
import { CollectionModule } from 'src/collection/collection.module';
import * as config from 'config';
import { TypeOrmExModule } from 'src/utilities/typeorm-ex.module';
const jwtConfig = config.get('jwt');
@Module({
  imports: [
    TypeOrmExModule.forCustomRepository([UserRepository]),
    forwardRef(() => CollectionModule),
  ],

  controllers: [AuthController],

  providers: [AuthService],

  exports: [AuthService],
})
export class AuthModule {}
