import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsBooleanString, IsHexColor, IsNumberString, IsOptional, IsString } from "class-validator";

export class modifyCollectionDto {
    @ApiProperty()
    @IsOptional()
    @IsString()
    meaning: string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    speech: string;

    @ApiProperty()
    @IsOptional()
    @IsArray()
    @IsNumberString({},{each: true})
    pictoIds: number[];

    @ApiProperty()
    @IsOptional()
    @IsArray()
    @IsNumberString({},{each: true})
    collectionIds: number[];

    @ApiProperty()
    @IsOptional()
    @IsNumberString()
    priority : number;

    @ApiProperty()
    @IsOptional()
    @IsHexColor()
    color: string;

    @ApiProperty()
    @IsOptional()
    @IsNumberString()
    pictohubId: number;
}