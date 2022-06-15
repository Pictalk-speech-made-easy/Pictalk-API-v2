import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateFeedbackDto{
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    title : string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    contact : string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    description : string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    vuex : string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    voices : string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    deviceInfos : string;
}