import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumberString, IsOptional } from "class-validator";

export class createPictoDto {

    @ApiProperty()
    @IsNotEmpty()
    meaning: string[];

    @ApiProperty()
    @IsNotEmpty()
    language: string[];

    @ApiProperty()
    @IsNotEmpty()
    speech: string[];

    @ApiProperty()
    @IsOptional()
    collectionIds: number[];

    @ApiProperty()
    @IsNotEmpty()
    @IsNumberString()
    fatherCollectionId: number; 
}