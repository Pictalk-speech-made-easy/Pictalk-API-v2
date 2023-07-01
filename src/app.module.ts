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
import { SentryModule } from '@ntegral/nestjs-sentry';
@Module({
  imports: [
    SentryModule.forRoot({
      debug: false,
      logLevels: ['error', 'warn'],
      dsn:
      "https://2ba5fc9794cf4717a95bc680e6130f85@o1135783.ingest.sentry.io/4504633864290304",
      environment: 'production',
      tracesSampleRate: 1.0,
    }),
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
