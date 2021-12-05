import { ApiProperty } from '@nestjs/swagger';
import {IsOptional} from 'class-validator';

export class modifyPictoDto {
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
    collectionIds: number[];

    @ApiProperty()
    @IsOptional()
    starred : boolean;
}