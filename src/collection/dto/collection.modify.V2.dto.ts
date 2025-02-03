import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsBooleanString, IsHexColor, IsNumberString, IsOptional, IsString } from "class-validator";

export class modifyCollectionV2Dto {
    @ApiProperty()
    @IsOptional()
    @IsString()
    meaning: string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    speech: string;

    @IsArray()
    @IsOptional()
    collectionsAdded?: number[];
  
    @IsArray()
    @IsOptional()
    collectionsRemoved?: number[];
  
    @IsArray()
    @IsOptional()
    pictosAdded?: number[];
  
    @IsArray()
    @IsOptional()
    pictosRemoved?: number[];
  

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