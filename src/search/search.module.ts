import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { CollectionModule } from 'src/collection/collection.module';
import { PictoModule } from 'src/picto/picto.module';
import { SearchService } from './search.service';

@Module({
  imports: [
    ConfigModule,
    forwardRef(() => CollectionModule),
        forwardRef(() => PictoModule),
    ElasticsearchModule.registerAsync({
      imports: [
        ConfigModule,
      ],
      useFactory: async (configService: ConfigService) => ({
        node: configService.get('ELASTICSEARCH_NODE'),
        auth: {
          username: configService.get('ELASTICSEARCH_USERNAME'),
          password: configService.get('ELASTICSEARCH_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [SearchService],
  exports: [ElasticsearchModule, SearchService],
})
export class SearchModule {}
