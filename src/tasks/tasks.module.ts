import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { SearchModule } from 'src/search/search.module';

@Module({
  imports: [SearchModule],
  providers: [TasksService],
})
export class TasksModule {}
