import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { NoDuplicatasService } from 'src/image/noDuplicatas.service';
import { PictoModule } from 'src/picto/picto.module';
import { CollectionController } from './collection.controller';
import { CollectionRepository } from './collection.repository';
import { CollectionService } from './collection.service';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    forwardRef(() => PictoModule),
    TypeOrmModule.forFeature([CollectionRepository]),
  ],
  controllers: [CollectionController],
  providers: [CollectionService, NoDuplicatasService],
  exports: [CollectionService]
})
export class CollectionModule {}
