import { ApiProperty } from '@nestjs/swagger';
import { languagesRegex } from 'src/utilities/supported.languages';
import {
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
} from 'class-validator';
import { APIsRegex } from 'src/utilities/supported.APIs';


export class EditUserDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(254)
  @Matches(
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
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
  @IsString({each: true})
  @Matches(APIsRegex, {
    each:true,
    message: 'one or more of those APIs are not supported',
  })
  apinames: string[];

  @ApiProperty()
  @IsOptional()
  @IsString({each: true})
  apikeys: string[];

  @ApiProperty()
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'password too weak',
  })
  password: string;

  @ApiProperty()
  @IsOptional()
  @IsString({each: true})
  directSharers: string[];
}
