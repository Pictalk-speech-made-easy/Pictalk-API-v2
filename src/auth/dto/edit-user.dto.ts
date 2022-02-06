import { ApiProperty } from '@nestjs/swagger';
import { languagesRegex } from 'src/utilities/supported.languages';
import {
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
} from 'class-validator';
import { usernameRegexp } from 'src/utilities/creation';


export class EditUserDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(254)
  @Matches(
    usernameRegexp,
    { message: 'Not a valid email address' },
  )
  username: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  language: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  @Matches(languagesRegex, {
    message: 'language is not supported',
  })
  display: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  languages: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(32)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'password too weak',
  })
  password: string;

  @ApiProperty()
  @IsOptional()
  @IsString({each: true})
  directSharers: string[];

  @ApiProperty()
  @IsOptional()
  @IsString()
  @MaxLength(16384)
  settings: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  @MaxLength(16384)
  mailingList: string;
}
