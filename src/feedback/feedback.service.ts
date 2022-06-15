import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/entities/user.entity";
import { CreateFeedbackDto } from "./dto/create.feedback.dto";
import { FeedbackRepository } from "./feedback.repository";

@Injectable()
export class FeedbackService {
    constructor(
        @InjectRepository(FeedbackRepository)
        private feedbackRepository : FeedbackRepository,
    ) { }
    async createFeedback(createFeedbackDto: CreateFeedbackDto): Promise<void> {
        return this.feedbackRepository.createFeedback(createFeedbackDto);
    }
}