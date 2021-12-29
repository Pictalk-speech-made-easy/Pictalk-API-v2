import { ApiProperty } from "@nestjs/swagger";
import { IsBooleanString, IsHexColor, IsNumberString, IsOptional } from "class-validator";

export class modifyCollectionDto {
    @ApiProperty()
    @IsOptional()
    meaning: any;

    @ApiProperty()
    @IsOptional()
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
    @IsBooleanString()
    starred : boolean;

    @ApiProperty()
    @IsOptional()
    @IsHexColor()
    color: string;
}