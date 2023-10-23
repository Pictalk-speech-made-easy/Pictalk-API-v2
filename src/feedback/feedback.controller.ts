import { Body, Get, Logger, Param, ParseIntPipe, Post, Put, Query, UnauthorizedException, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { Controller } from "@nestjs/common/decorators/core/controller.decorator";
import { User } from "src/entities/user.entity";
import { CreateFeedbackDto } from "./dto/create.feedback.dto";
import { EditFeedbackDto } from "./dto/edit.feedback.dto";
import { SearchFeedbackDto } from "./dto/search.feedback.dto";
import { Feedback } from "./entities/feedback.entity";
import { FeedbackService } from "./feedback.service";
import { AuthenticatedUser, AuthGuard } from 'nest-keycloak-connect';
@Controller('feedback')
export class FeedbackController {
  private logger = new Logger('CollectionController');
  constructor(private feedbackService: FeedbackService){}

  @UseGuards(AuthGuard)
  @Post()
  @UsePipes(ValidationPipe)
  async createFeedback(@Body() createFeedbackDto: CreateFeedbackDto): Promise<void>{
    this.logger.verbose(`Ccreating a feedback with title: ${createFeedbackDto.title}`);
    return this.feedbackService.createFeedback(createFeedbackDto);
  }
  @UseGuards(AuthGuard)
  @Get()
  @UsePipes(ValidationPipe)
  async getFeedback(@AuthenticatedUser() user: User, @Query() searchFeedbackDto: SearchFeedbackDto): Promise<{feedbacks: Feedback[], total_count: number}>{
    if (!user.admin) {
      throw new UnauthorizedException(`User ${user.username} is not admin, only admins can get feedbacks`);
    }
    this.logger.verbose(`Searching for feedbacks`);
    console.log()
    return this.feedbackService.getFeedback(searchFeedbackDto);
  }

  @UseGuards(AuthGuard)
  @Put('/:id')
  @UsePipes(ValidationPipe)
  async editFeedback(@AuthenticatedUser() user: User, @Param('id', ParseIntPipe) id: number, @Body() editFeedbackDto: EditFeedbackDto): Promise<Feedback>{
    if (!user.admin) {
      throw new UnauthorizedException(`User ${user.username} is not admin, only admins can edit feedbacks`);
    }
    this.logger.verbose(`Ccreating a feedback with title: ${editFeedbackDto.title}`);
    return this.feedbackService.editFeedback(id, editFeedbackDto);
  }
}