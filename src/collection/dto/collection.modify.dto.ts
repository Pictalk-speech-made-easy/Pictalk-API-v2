import { ApiProperty } from "@nestjs/swagger";
import { IsBooleanString, IsHexColor, IsNumberString, IsOptional, IsString } from "class-validator";
import { MLtext } from "src/entities/MLtext.entity";

export class modifyCollectionDto {
    @ApiProperty()
    @IsOptional()
    meaning: MLtext[];

    @ApiProperty()
    @IsOptional()
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
    @IsBooleanString()
    starred : boolean;

    @ApiProperty()
    @IsOptional()
    @IsHexColor()
    color: string;
}