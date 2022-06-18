import { Body, Logger, Post, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { Controller } from "@nestjs/common/decorators/core/controller.decorator";
import { AuthGuard } from "@nestjs/passport";
import { CreateFeedbackDto } from "./dto/create.feedback.dto";
import { FeedbackService } from "./feedback.service";

@Controller('feedback')
export class FeedbackController {
  private logger = new Logger('CollectionController');
  constructor(private feedbackService: FeedbackService){}

  @UseGuards(AuthGuard())
  @Post()
  @UsePipes(ValidationPipe)
  async createFeedback(@Body() createFeedbackDto: CreateFeedbackDto): Promise<void>{
    this.logger.verbose(`Ccreating a feedback with title: ${createFeedbackDto.title}`);
    return this.feedbackService.createFeedback(createFeedbackDto);
  }

}