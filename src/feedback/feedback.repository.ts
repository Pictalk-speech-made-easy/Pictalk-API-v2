import { InternalServerErrorException } from "@nestjs/common";
import { User } from "src/entities/user.entity";
import { EntityRepository, Repository } from "typeorm";
import { CreateFeedbackDto } from "./dto/create.feedback.dto";
import { Feedback } from "./entities/feedback.entity";

@EntityRepository(Feedback)
export class FeedbackRepository extends Repository<Feedback>{
    async createFeedback(createFeedbackDto: CreateFeedbackDto) {
        let { title, description, contact, deviceInfos, voices, vuex, action, blocking, evolution } = createFeedbackDto;
        const feedback = new Feedback();
        feedback.action = action;
        feedback.evolution = evolution;
        feedback.date = new Date();
        feedback.blocking = blocking;
        feedback.title = title;
        feedback.description = description;
        feedback.contact = contact;
        feedback.deviceInfos = deviceInfos;
        feedback.voices = voices;
        feedback.vuex = vuex;

        try {
            await feedback.save();
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }
}