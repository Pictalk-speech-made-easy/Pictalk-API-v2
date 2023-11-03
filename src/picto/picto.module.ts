import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { CollectionModule } from 'src/collection/collection.module';
import { TypeOrmExModule } from 'src/utilities/typeorm-ex.module';
import { PictoController } from './picto.controller';
import { PictoRepository } from './picto.repository';
import { PictoService } from './picto.service';
import { SearchModule } from 'src/search/search.module';

@Module({
  imports: [
    TypeOrmExModule.forCustomRepository([PictoRepository]),
    AuthModule,
    forwardRef(() => CollectionModule),
    forwardRef(() => SearchModule),
  ],
  controllers: [PictoController],
  providers: [PictoService],
  exports: [PictoService]
})
export class PictoModule {}
