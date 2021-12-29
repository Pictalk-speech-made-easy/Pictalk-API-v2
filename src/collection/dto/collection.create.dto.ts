import { ApiProperty } from "@nestjs/swagger";
import { IsHexColor, IsNotEmpty, IsNumberString, IsOptional, Matches } from "class-validator";
import { MLtext } from "src/entities/MLtext.entity";

export class createCollectionDto {

    @ApiProperty()
    @IsNotEmpty()
    meaning: MLtext[];

    @ApiProperty()
    @IsNotEmpty()
    speech: MLtext[];

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