import { ApiProperty } from "@nestjs/swagger";
import { IsHexColor, IsNotEmpty, IsNumberString, IsOptional, IsString, Matches } from "class-validator";
import { MLtext } from "src/entities/MLtext.entity";

export class createPictoDto {

    @ApiProperty()
    @IsNotEmpty()
    meaning: MLtext[];

    @ApiProperty()
    @IsNotEmpty()
    speech: MLtext[];

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