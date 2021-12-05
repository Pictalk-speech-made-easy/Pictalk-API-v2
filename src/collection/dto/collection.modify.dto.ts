import { ApiProperty } from "@nestjs/swagger";
import { IsBooleanString, IsHexColor, IsOptional } from "class-validator";

export class modifyCollectionDto {
    @ApiProperty()
    @IsOptional()
    meaning: string[];
    
    @ApiProperty()
    @IsOptional()
    language: string[];

    @ApiProperty()
    @IsOptional()
    speech: string[];

    @ApiProperty()
    @IsOptional()
    pictoIds: number[];

    @ApiProperty()
    @IsOptional()
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