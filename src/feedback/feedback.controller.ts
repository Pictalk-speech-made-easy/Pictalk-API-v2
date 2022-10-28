import { Body, Get, Logger, Param, ParseIntPipe, Post, Put, UnauthorizedException, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { Controller } from "@nestjs/common/decorators/core/controller.decorator";
import { AuthGuard } from "@nestjs/passport";
import { GetUser } from "src/auth/get-user.decorator";
import { User } from "src/entities/user.entity";
import { CreateFeedbackDto } from "./dto/create.feedback.dto";
import { EditFeedbackDto } from "./dto/edit.feedback.dto";
import { SearchFeedbackDto } from "./dto/search.feedback.dto";
import { Feedback } from "./entities/feedback.entity";
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
  @UseGuards(AuthGuard())
  @Get()
  @UsePipes(ValidationPipe)
  async getFeedback(@GetUser() user: User, @Body() searchFeedbackDto: SearchFeedbackDto): Promise<Feedback[]>{
    if (!user.admin) {
      throw new UnauthorizedException(`User ${user.username} is not admin, only admins can get feedbacks`);
    }
    this.logger.verbose(`Searching for feedbacks: ${searchFeedbackDto}`);
    return this.feedbackService.getFeedback(searchFeedbackDto);
  }

  @UseGuards(AuthGuard())
  @Put('/:id')
  @UsePipes(ValidationPipe)
  async editFeedback(@GetUser() user: User, @Param('id', ParseIntPipe) id: number, @Body() editFeedbackDto: EditFeedbackDto): Promise<Feedback>{
    if (!user.admin) {
      throw new UnauthorizedException(`User ${user.username} is not admin, only admins can edit feedbacks`);
    }
    this.logger.verbose(`Ccreating a feedback with title: ${editFeedbackDto.title}`);
    return this.feedbackService.editFeedback(id, editFeedbackDto);
  }
}