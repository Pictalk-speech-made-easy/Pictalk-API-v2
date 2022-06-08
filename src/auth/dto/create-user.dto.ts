import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsNotEmpty,
  IsOptional,
  IsNumberString,
} from 'class-validator';
import { usernameRegexp } from 'src/utilities/creation';
import { languagesRegex } from 'src/utilities/supported.languages';

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(254)
  @Matches(
    usernameRegexp,
    { message: 'Not a valid email address' },
  )
  username: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  @MaxLength(32)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'password too weak',
  })
  password: string;

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
  @IsString({each: true})
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
