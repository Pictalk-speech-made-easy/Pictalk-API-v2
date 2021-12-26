import { ApiProperty } from "@nestjs/swagger";
import { IsHexColor, IsNotEmpty, IsNumberString, IsOptional, IsString, Matches } from "class-validator";

export class createPictoDto {

    @ApiProperty()
    @IsNotEmpty()
    @IsString({each: true})
    meaning: string[];

    @ApiProperty()
    @IsNotEmpty()
    @IsString({each: true})
    language: string[];

    @ApiProperty()
    @IsNotEmpty()
    @IsString({each: true})
    speech: string[];

    @ApiProperty()
    @IsOptional()
    @IsHexColor()
    color: string;

    @ApiProperty()
    @IsOptional()
    @IsNumberString({each: true})
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
}