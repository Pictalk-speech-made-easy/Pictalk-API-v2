import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { existsSync, mkdir} from 'fs';
import { AppModule } from './app.module';

async function bootstrap() {
  if(!existsSync('files')){
    mkdir("files", null);
  }
  const app = await NestFactory.create(AppModule, { cors: true });
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
