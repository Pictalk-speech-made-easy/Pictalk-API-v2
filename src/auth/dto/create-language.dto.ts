import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumberString,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';


export class CreateLanguageDto {
  @ApiProperty()
  @IsString()
  device: string;

  @ApiProperty()
  @IsString()
  locale: string;

  @ApiProperty()
  @IsString()
  voiceuri: string;

  @ApiProperty()
  @IsOptional()
  @IsNumberString()
  @Type(() => Number)
  picth: number;

  @ApiProperty()
  @IsOptional()
  @IsNumberString()
  @Type(() => Number)
  rate: number;

}
