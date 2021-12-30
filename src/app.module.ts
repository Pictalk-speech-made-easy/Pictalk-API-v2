import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PictoModule } from './picto/picto.module';
import { CollectionModule } from './collection/collection.module';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './config/typeorm.config';
import { ImageController } from './image/image.controller';
import { HttpModule } from '@nestjs/axios';
import { TranslationController } from './translation/translation.controller';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    PictoModule,
    CollectionModule, 
    AuthModule,
    HttpModule,
  ],
  controllers: [AppController, ImageController, TranslationController],
  providers: [AppService],
})
export class AppModule {}
