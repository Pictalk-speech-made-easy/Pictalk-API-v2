import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/entities/user.entity";
import { CreateFeedbackDto } from "./dto/create.feedback.dto";
import { EditFeedbackDto } from "./dto/edit.feedback.dto";
import { SearchFeedbackDto } from "./dto/search.feedback.dto";
import { Feedback } from "./entities/feedback.entity";
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

    async getFeedback(searchFeedbackDto: SearchFeedbackDto): Promise<{feedbacks: Feedback[], total_count: number}>{
        return this.feedbackRepository.getFeedback(searchFeedbackDto);
    }
    async editFeedback(id:number, editFeedbackDto:EditFeedbackDto): Promise<Feedback>{
        return this.feedbackRepository.editFeedback(id, editFeedbackDto);
    }
}