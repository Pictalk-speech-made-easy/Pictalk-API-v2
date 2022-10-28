import { ApiProperty } from "@nestjs/swagger";
import { IsNumberString, IsOptional } from "class-validator";

export class SearchFeedbackDto{
    @ApiProperty()
    @IsOptional()
    @IsNumberString()
    page: number;

    @ApiProperty()
    @IsOptional()
    @IsNumberString()
    per_page: number;
}