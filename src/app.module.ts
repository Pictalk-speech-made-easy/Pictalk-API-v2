import { CacheModule, Module } from '@nestjs/common';
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
import { ConfigModule } from '@nestjs/config';
import { FeedbackModule } from './feedback/feedback.module';
import { ExtrasController } from './extras/extras.controller';
@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot(typeOrmConfig),
    PictoModule,
    CollectionModule,
    AuthModule,
    HttpModule,
    CacheModule.register({ttl: 2592000}), // 1 month
    FeedbackModule
  ],
  controllers: [AppController, ImageController, TranslationController, ExtrasController],
  providers: [AppService],
})
export class AppModule {}
