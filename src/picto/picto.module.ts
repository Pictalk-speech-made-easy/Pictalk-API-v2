import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { CollectionModule } from 'src/collection/collection.module';
import { NoDuplicatasService } from 'src/image/noDuplicatas.service';
import { PictoController } from './picto.controller';
import { PictoRepository } from './picto.repository';
import { PictoService } from './picto.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PictoRepository]),
    AuthModule,
    forwardRef(() => CollectionModule),
  ],
  controllers: [PictoController],
  providers: [PictoService, NoDuplicatasService],
  exports: [PictoService]
})
export class PictoModule {}
