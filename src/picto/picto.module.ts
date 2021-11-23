import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { CollectionRepository } from 'src/collection/collection.repository';
import { PictoController } from './picto.controller';
import { PictoRepository } from './picto.repository';
import { PictoService } from './picto.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PictoRepository]),
    AuthModule
  ],
  controllers: [PictoController],
  providers: [PictoService]
})
export class PictoModule {}
