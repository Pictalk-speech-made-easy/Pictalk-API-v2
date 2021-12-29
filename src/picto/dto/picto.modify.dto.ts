import { ApiProperty } from '@nestjs/swagger';
import {IsBooleanString, IsHexColor, IsNumberString, IsOptional, IsString} from 'class-validator';

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
    @IsNumberString({each: true})
    collectionIds: number[];

    @ApiProperty()
    @IsOptional()
    @IsBooleanString()
    starred : boolean;
}