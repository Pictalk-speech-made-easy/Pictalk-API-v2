import {  Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
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
import { SentryModule } from '@ntegral/nestjs-sentry';
import * as Sentry from '@sentry/node';
import { Integration } from '@sentry/types';
@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot(typeOrmConfig),
    PictoModule,
    CollectionModule,
    AuthModule,
    HttpModule,
    CacheModule.register({ttl: 2592000000}), // 1 month
    FeedbackModule,
    SentryModule.forRoot({
      dsn: 'https://f58ce4edd3eb265c6f1d6cf1b870c93c@o1135783.ingest.us.sentry.io/4507656096710656',
      environment: process.env.NODE_ENV,
      logLevels: ['debug'],
      integrations: [
        new Sentry.Integrations.Http({ tracing: true })
      ] as unknown as Integration[],

    }),
  ],
  controllers: [AppController, ImageController, TranslationController, ExtrasController],
  providers: [AppService],
})
export class AppModule {}
