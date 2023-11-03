import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { CollectionService } from 'src/collection/collection.service';
import { PictoService } from 'src/picto/picto.service';
@Injectable()
export class SearchService {
  constructor(
    private readonly elasticsearchService: ElasticsearchService,
    @Inject(forwardRef(() => CollectionService))
    private collectionService: CollectionService,
    @Inject(forwardRef(() => PictoService))
    private pictoService: PictoService,
  ) {
    this.init();
  }
  async reindexAllCollections() {
    const pictos = await this.collectionService.getAllCollections();
    for (const picto of pictos) {
      this.indexPictogram(picto, true);
    }
  }

  async reindexAllPictos() {
    const pictos = await this.pictoService.getAllPictos();
    for (const picto of pictos) {
      this.indexPictogram(picto, false);
    }
  }

  async indexPictogram(pictogram, isCollection: boolean): Promise<any> {
    let meaning;
    let speech;
    try { 
      meaning = JSON.parse(pictogram.meaning); 
    } catch (e) {
    }
    try {
      speech = JSON.parse(pictogram.speech);
    } catch (e) {
    }
    if (!meaning && !speech) {
      return;
    }
    return this.elasticsearchService.index({
      index: 'pictograms',
      id: String(isCollection ? pictogram.id : pictogram.id << 1),
      document: {
        ...(meaning && {meaning: meaning}),
        ...(speech && {speech: speech}),
        userId: pictogram.userId,
        image: pictogram.image,
      },
    });
  }

  async removePictogram(pictogramId, isCollection: boolean): Promise<any> {
    return this.elasticsearchService.delete({
      index: 'pictograms',
      id: String(isCollection ? pictogramId : pictogramId << 1),
    });
  }

  async updatePictogram(pictogram, isCollection: boolean): Promise<any> {
    return this.elasticsearchService.update({
      index: 'pictograms',
      id: String(isCollection ? pictogram.id : pictogram.id << 1),
      body: {
        script: {
          source: 'ctx._source = params',
          params: {
            meaning: JSON.parse(pictogram.meaning),
            speech: JSON.parse(pictogram.speech),
            userId: pictogram.userId,
            image: pictogram.image,
          },
        },
      },
    });
  }

  async init() {
    const indexExists = await this.elasticsearchService.indices.exists({
      index: 'pictograms',
    });
    if (!indexExists) {
      await this.elasticsearchService.indices.create({
        index: 'pictograms',
        body: {
          mappings: {
            properties: {
              meaning: { type: 'flattened' },
              speech: { type: 'flattened' },
              userId: { type: 'long' },
              // other properties as needed
            },
          },
        },
      });
    }
  }

  // Other methods to handle indexing and searching...
}
