import { ApiProperty } from '@nestjs/swagger';
import {IsArray, IsBooleanString, IsHexColor, IsNumberString, IsOptional, IsString} from 'class-validator';

export class modifyPictoDto {
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
    @IsHexColor()
    color: string;

    @ApiProperty()
    @IsOptional()
    @IsArray()
    @IsNumberString({},{each: true})
    collectionIds: number[];

    @ApiProperty()
    @IsOptional()
    @IsBooleanString()
    starred : boolean;
}