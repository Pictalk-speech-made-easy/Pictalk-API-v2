import { ApiProperty } from '@nestjs/swagger';
import {IsBooleanString, IsHexColor, IsNumberString, IsOptional} from 'class-validator';

export class modifyPictoDto {
    @ApiProperty()
    @IsOptional()
    meaning: any;

    @ApiProperty()
    @IsOptional()
    speech: any;

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