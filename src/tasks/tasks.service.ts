import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SearchService } from 'src/search/search.service';

@Injectable()
export class TasksService {
  constructor(private searchService: SearchService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  handleCron() {
    console.log('Cron job triggered')
    this.searchService.reindexAllCollections();
    this.searchService.reindexAllPictos();
    console.log('Cron job finished')
  }
}
