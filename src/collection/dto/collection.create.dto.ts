import { ApiProperty } from "@nestjs/swagger";
import { IsHexColor, IsNotEmpty, IsNumberString, IsOptional, Matches } from "class-validator";

export class createCollectionDto {

    @ApiProperty()
    @IsNotEmpty()
    meaning: any;

    @ApiProperty()
    @IsNotEmpty()
    speech: any;

    @ApiProperty()
    @IsOptional()
    @IsNumberString({each: true})
    pictoIds: number[];

    @ApiProperty()
    @IsOptional()
    @IsNumberString({each: true})
    collectionIds: number[];

    @ApiProperty()
    @IsOptional()
    @IsHexColor()
    color: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsNumberString()
    fatherCollectionId: number; 

    @ApiProperty()
    @IsOptional()
    @IsNumberString()
    @Matches(/0|1/, { message: "Role must be either 'viewer' or 'editor'"})
    share: number;
}