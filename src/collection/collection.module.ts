import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { PictoModule } from 'src/picto/picto.module';
import { TypeOrmExModule } from 'src/utilities/typeorm-ex.module';
import { CollectionController } from './collection.controller';
import { CollectionRepository } from './collection.repository';
import { CollectionService } from './collection.service';
import { SearchModule } from 'src/search/search.module';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    forwardRef(() => PictoModule),
    forwardRef(() => SearchModule),
    TypeOrmExModule.forCustomRepository([CollectionRepository]),
  ],
  controllers: [CollectionController],
  providers: [CollectionService],
  exports: [CollectionService]
})
export class CollectionModule {}
