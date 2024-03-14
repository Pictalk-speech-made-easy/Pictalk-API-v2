import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsNotEmpty,
  IsOptional,
  IsNumberString,
  IsEmpty,
} from 'class-validator';
import { languagesRegex } from 'src/utilities/supported.languages';

export class CreateUserDto {
  @IsEmpty()
  username: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  language: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  languages: string;

  @ApiProperty()
  @IsOptional()
  @IsString({ each: true })
  directSharers: string[];

  @ApiProperty()
  @IsOptional()
  @IsString()
  @Matches(languagesRegex, {
    message: 'language is not supported',
  })
  displayLanguage: string;

  @ApiProperty()
  @IsOptional()
  @IsNumberString()
  publicBundleId: number;
}
