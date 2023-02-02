import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsHexColor, IsNotEmpty, IsNumberString, IsOptional, IsString, Matches } from "class-validator";

export class createPictoDto {

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    meaning: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    speech: string;

    @ApiProperty()
    @IsOptional()
    @IsHexColor()
    color: string;

    @ApiProperty()
    @IsOptional()
    @IsArray()
    @IsNumberString({},{each: true})
    collectionIds: number[];

    @ApiProperty()
    @IsNotEmpty()
    @IsNumberString()
    fatherCollectionId: number; 

    @ApiProperty()
    @IsOptional()
    @IsNumberString()
    @Matches(/0|1/, { message: "Sharing should be either 1 or 0'"})
    share: number;

    @ApiProperty()
    @IsOptional()
    @IsNumberString()
    pictohubId: number;
}