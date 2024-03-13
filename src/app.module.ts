import { Module } from '@nestjs/common';
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
import {
  AuthGuard,
  KeycloakConnectModule,
  ResourceGuard,
  RoleGuard,
} from 'nest-keycloak-connect';
import { APP_GUARD } from '@nestjs/core';
@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot(typeOrmConfig),
    KeycloakConnectModule.register({
      authServerUrl: 'https://auth.picmind.org',
      realm: 'master',
      clientId: 'pictalk-api',
      secret: 'CWLSdXiTtaRfaVmg1DIDHAfqK67E3HGd',
      // Secret key of the client taken from keycloak server
    }),
    PictoModule,
    CollectionModule,
    AuthModule,
    HttpModule,
    CacheModule.register({ ttl: 2592000000 }), // 1 month
    FeedbackModule,
  ],
  controllers: [
    AppController,
    ImageController,
    TranslationController,
    ExtrasController,
  ],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    // This adds a global level resource guard, which is permissive.
    // Only controllers annotated with (http://twitter.com/Resource) and
    // methods with @Scopes
    // are handled by this guard.
    {
      provide: APP_GUARD,
      useClass: ResourceGuard,
    },
    // New in 1.1.0
    // This adds a global level role guard, which is permissive.
    // Used by @Roles decorator with the
    // optional @AllowAnyRole decorator for allowing any
    // specified role passed.
    {
      provide: APP_GUARD,
      useClass: RoleGuard,
    },
  ],
})
export class AppModule {}
