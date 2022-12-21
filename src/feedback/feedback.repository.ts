import { InternalServerErrorException } from "@nestjs/common";
import { CustomRepository } from "src/utilities/typeorm-ex.decorator";
import { Repository } from "typeorm";
import { CreateFeedbackDto } from "./dto/create.feedback.dto";
import { EditFeedbackDto } from "./dto/edit.feedback.dto";
import { SearchFeedbackDto } from "./dto/search.feedback.dto";
import { Feedback } from "./entities/feedback.entity";
import { FeedbackState } from "./entities/feedbackstate.enum";

@CustomRepository(Feedback)
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
        feedback.state = FeedbackState.Opened;
        feedback.vuex = vuex;

        try {
            await feedback.save();
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    async getFeedback(searchFeedbackDto:SearchFeedbackDto):Promise<{feedbacks: Feedback[], total_count: number}>{
        let feedbacks: Feedback[];
        const page = searchFeedbackDto.page ? searchFeedbackDto.page-1 : 0;
        const per_page = searchFeedbackDto.per_page ? searchFeedbackDto.per_page: 20;
        const toSkip = page*per_page;
        const toTake = per_page;
        const query = this.createQueryBuilder('feedback');
        const total_count = await query.getCount();
        console.log(searchFeedbackDto);
        if (searchFeedbackDto.sortField && searchFeedbackDto.sortOrder) {
            query.orderBy(`feedback.${searchFeedbackDto.sortField}`, searchFeedbackDto.sortOrder)
        }
        try {
            if (searchFeedbackDto.page) {
                query.skip(toSkip).take(toTake);
                feedbacks = await query.getMany();
            } else {
                feedbacks = await query.getMany();
            }
            return {feedbacks, total_count};
        } catch(err){
            throw new InternalServerErrorException(`could not get feedbacks ${err}`);
        }
    }

    async editFeedback(id:number,editFeedbackDto: EditFeedbackDto):Promise<Feedback> {
        const feedback = await this.findOne({where : {id}});
        let { title, description, contact,  action, blocking, evolution, state } = editFeedbackDto;
        feedback.action = action;
        feedback.evolution = evolution;
        feedback.blocking = blocking;
        feedback.title = title;
        feedback.description = description;
        feedback.contact = contact;
        feedback.state = state;

        try {
            await feedback.save();
            return feedback;
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }
}