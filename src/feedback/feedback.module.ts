import { Module } from "@nestjs/common/decorators/modules/module.decorator";
import { TypeOrmModule } from "@nestjs/typeorm/dist/typeorm.module";
import { AuthModule } from "src/auth/auth.module";
import { FeedbackController } from "./feedback.controller";
import { FeedbackRepository } from "./feedback.repository";
import { FeedbackService } from "./feedback.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([FeedbackRepository]),
    AuthModule,
  ],
  controllers: [FeedbackController],
  providers: [FeedbackService],
  exports: [FeedbackService]
})
export class FeedbackModule {}
