import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { SentryService } from '@ntegral/nestjs-sentry';
import { existsSync, mkdir} from 'fs';
import { AppModule } from './app.module';

async function bootstrap() {
  if(!existsSync('files')){
    mkdir("files", () => {});
  }
  if(!existsSync('tmp')){
    mkdir("tmp", () => {});
  }
  
  const app = await NestFactory.create(AppModule, { cors: true, logger: false });
  app.useLogger(SentryService.SentryServiceInstance());
  const config = new DocumentBuilder()
    .setTitle('Pictalk')
    .setDescription('Pictalk API description')
    .setVersion('2.0')
    .addTag('Pictalk API')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  app.enableCors();
  await app.listen(3001);
}
bootstrap();
