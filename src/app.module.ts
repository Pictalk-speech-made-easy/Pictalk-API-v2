import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PictoModule } from './picto/picto.module';
import { CollectionModule } from './collection/collection.module';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './config/typeorm.config';
import { ImageController } from './image/image.controller';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    PictoModule,
    CollectionModule, 
    AuthModule
  ],
  controllers: [AppController, ImageController],
  providers: [AppService],
})
export class AppModule {}
