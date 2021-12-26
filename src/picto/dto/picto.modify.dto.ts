import { ApiProperty } from '@nestjs/swagger';
import {IsBooleanString, IsHexColor, IsNumberString, IsOptional, IsString} from 'class-validator';

export class modifyPictoDto {
    @ApiProperty()
    @IsOptional()
    @IsString({each: true})
    meaning: string[];

    @ApiProperty()
    @IsOptional()
    @IsString({each: true})
    language: string[];

    @ApiProperty()
    @IsOptional()
    @IsString({each: true})
    speech: string[];

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