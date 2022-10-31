import { ApiProperty } from "@nestjs/swagger";
import { IsBooleanString, IsNotEmpty, IsString } from "class-validator";
import { FeedbackState } from "../entities/feedbackstate.enum";

export class EditFeedbackDto{
    @ApiProperty()
    @IsString()
    title : string;

    @ApiProperty()
    @IsString()
    action: string;

    @ApiProperty()
    @IsString()
    evolution: string;

    @ApiProperty()
    @IsBooleanString()
    blocking: boolean;

    @ApiProperty()
    @IsString()
    contact : string;

    @ApiProperty()
    @IsString()
    description : string;

    @ApiProperty()
    @IsString()
    state : FeedbackState;
}