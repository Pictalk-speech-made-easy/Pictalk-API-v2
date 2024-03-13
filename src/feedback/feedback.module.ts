import { Module } from '@nestjs/common/decorators/modules/module.decorator';
import { AuthModule } from 'src/auth/auth.module';
import { TypeOrmExModule } from 'src/utilities/typeorm-ex.module';
import { FeedbackController } from './feedback.controller';
import { FeedbackRepository } from './feedback.repository';
import { FeedbackService } from './feedback.service';

@Module({
  imports: [
    TypeOrmExModule.forCustomRepository([FeedbackRepository]),
    AuthModule,
  ],
  controllers: [FeedbackController],
  providers: [FeedbackService],
  exports: [FeedbackService],
})
export class FeedbackModule {}
